import Feedback from '../models/Feedback.js';
import AuditLog from '../models/AuditLog.js';
import { analyzeSentiment } from '../config/hf-api.js';
import { validationResult } from 'express-validator';

// =============================================================================
// 🔍 HELPER FUNCTIONS
// =============================================================================

const extractKeywords = (text, maxKeywords = 5) => {
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'for', 'with', 'that', 'this', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'from', 'by', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  const frequency = {};
  words.forEach(word => { frequency[word] = (frequency[word] || 0) + 1; });
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
};


const detectPlatform = (userAgent = '') => {
  const normalized = String(userAgent).toLowerCase();

  if (!normalized) return 'Web';
  if (normalized.includes('postman') || normalized.includes('insomnia') || normalized.includes('axios')) return 'API';
  if (normalized.includes('ipad') || normalized.includes('tablet')) return 'Tablet';
  if (normalized.includes('mobi') || normalized.includes('android') || normalized.includes('iphone')) return 'Mobile';
  if (normalized.includes('mozilla') || normalized.includes('chrome') || normalized.includes('safari')) return 'Web';

  return 'Other';
};

const recordAuditLog = async (req, payload) => {
  try {
    const details = {
      organization: req.user?.organization || null,
      ...(payload.details || {})
    };

    await AuditLog.record({
      actor: req.user?._id || null,
      action: payload.action,
      targetType: payload.targetType || 'Feedback',
      targetId: payload.targetId || null,
      details,
      ipAddress: req.ip || null,
      userAgent: req.get('user-agent') || null,
      severity: payload.severity || 'info'
    });
  } catch (error) {
    console.error('Audit log write failed:', error);
  }
};

// =============================================================================
// ✅ CREATE - Submit new feedback
// =============================================================================

export const createFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { content, category, isAnonymous = true } = req.body;
    const platform = detectPlatform(req.get('user-agent'));
    
    // AI Sentiment Analysis via Hugging Face
    const sentimentResult = await analyzeSentiment(content);
    const keywords = extractKeywords(content);

    const feedback = await Feedback.create({
      content,
      category: category || 'Other',
      sentiment: {
        label: sentimentResult.label,
        score: sentimentResult.score
      },
      keywords,
      isAnonymous,
      submittedBy: isAnonymous ? null : req.user._id,
      metadata: { platform }
    });

    await recordAuditLog(req, {
      action: 'feedback.created',
      targetId: feedback._id,
      details: {
        category: feedback.category,
        isAnonymous: feedback.isAnonymous,
        status: feedback.status,
        submittedBy: feedback.submittedBy,
        platform: feedback.metadata?.platform || platform
      }
    });

    res.status(201).json({
      success: true,
      data: { feedback },
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('❌ Create Feedback Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};

// =============================================================================
// ✅ READ - Get all feedback with filtering
// =============================================================================

export const getFeedback = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      sentiment, 
      status, 
      startDate, 
      endDate,
      sort = 'submittedAt'
    } = req.query;

    const query = {};
    
    if (category) query.category = category;
    if (sentiment) query['sentiment.label'] = sentiment;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) query.submittedAt.$lte = new Date(endDate);
    }

    const sortOptions = {
      submittedAt: -1,
      upvoteCount: -1,
      'sentiment.score': -1
    };

    const feedback = await Feedback.find(query)
      .sort({ [sort]: sortOptions[sort] || -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-submittedBy')
      .lean();

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Get Feedback Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =============================================================================
// ✅ READ - Get single feedback by ID
// =============================================================================

export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .select('-submittedBy');

    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: 'Feedback not found' 
      });
    }

    res.json({ success: true, data: { feedback } });
  } catch (error) {
    console.error('❌ Get Feedback By ID Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =============================================================================
// ✅ UPDATE - Update feedback status or add admin notes
// =============================================================================

export const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, content } = req.body;

    const feedback = await Feedback.findById(id);
    const previousStatus = feedback?.status || null;

    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: 'Feedback not found' 
      });
    }

    // Members can only edit their own feedback content
    if (req.user.role === 'member') {
      const ownsFeedback =
        feedback.submittedBy &&
        typeof feedback.submittedBy.equals === 'function' &&
        feedback.submittedBy.equals(req.user._id);

      if (!ownsFeedback) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own non-anonymous feedback'
        });
      }

      if (!content || status || adminNote) {
        return res.status(403).json({
          success: false,
          message: 'Members can only update the content of their own feedback'
        });
      }

      const sentimentResult = await analyzeSentiment(content);
      feedback.content = content;
      feedback.keywords = extractKeywords(content);
      feedback.sentiment = {
        label: sentimentResult.label,
        score: sentimentResult.score
      };
    }

    // Admins/Mods can update status and add notes
    if (['admin', 'moderator'].includes(req.user.role)) {
      if (status) feedback.status = status;
      
      if (adminNote) {
        feedback.adminNotes = feedback.adminNotes || [];
        feedback.adminNotes.push({
          note: adminNote,
          addedBy: req.user._id,
          timestamp: new Date()
        });
      }
    }

    feedback.updatedAt = Date.now();
    await feedback.save();

    await recordAuditLog(req, {
      action:
        req.user.role === 'member'
          ? 'feedback.updated'
          : 'feedback.status_updated',
      targetId: feedback._id,
      details: {
        previousStatus,
        newStatus: feedback.status || null,
        note: adminNote || null,
        contentUpdated: Boolean(content),
        category: feedback.category
      },
      severity: adminNote ? 'warning' : 'info'
    });

    res.json({ success: true, data: { feedback } });
  } catch (error) {
    console.error('❌ Update Feedback Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =============================================================================
// ✅ DELETE - Soft delete feedback
// =============================================================================

export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: 'Feedback not found' 
      });
    }

    // Only admins can delete feedback
    if (req.user.role === 'member') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete feedback'
      });
    }

    // Soft delete by setting status to Dismissed
    const previousStatus = feedback.status || null;
    feedback.status = 'Dismissed';
    feedback.updatedAt = Date.now();
    await feedback.save();

    await recordAuditLog(req, {
      action: 'feedback.archived',
      targetId: feedback._id,
      details: {
        previousStatus,
        newStatus: feedback.status,
        category: feedback.category
      },
      severity: 'warning'
    });

    res.json({ 
      success: true, 
      message: 'Feedback archived successfully' 
    });
  } catch (error) {
    console.error('❌ Delete Feedback Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =============================================================================
// ✅ UPVOTE - Add upvote to feedback
// =============================================================================

export const upvoteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: 'Feedback not found' 
      });
    }

    // Prevent duplicate upvotes
    if (!feedback.upvotes.includes(req.user._id)) {
      feedback.upvotes = feedback.upvotes || [];
      feedback.upvotes.push(req.user._id);
      feedback.upvoteCount = (feedback.upvoteCount || 0) + 1;
      await feedback.save();
    }

    res.json({ 
      success: true, 
      data: { upvoteCount: feedback.upvoteCount } 
    });
  } catch (error) {
    console.error('❌ Upvote Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =============================================================================
// ✅ REMOVE UPVOTE - Remove upvote from feedback
// =============================================================================

export const removeUpvote = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: 'Feedback not found' 
      });
    }

    // Remove upvote if exists
    if (feedback.upvotes && feedback.upvotes.includes(req.user._id)) {
      feedback.upvotes = feedback.upvotes.filter(
        id => !id.equals(req.user._id)
      );
      feedback.upvoteCount = Math.max(0, (feedback.upvoteCount || 0) - 1);
      await feedback.save();
    }

    res.json({ 
      success: true, 
      data: { upvoteCount: feedback.upvoteCount } 
    });
  } catch (error) {
    console.error('❌ Remove Upvote Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =============================================================================
// ✅ GET MY FEEDBACK - Get current user's submissions
// =============================================================================

export const getMyFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {
      isAnonymous: false,
      submittedBy: req.user._id
    };
    
    if (status) query.status = status;

    const feedback = await Feedback.find(query)
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('content category sentiment upvoteCount status submittedAt');

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total
        }
      }
    });
  } catch (error) {
    console.error('❌ Get My Feedback Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =============================================================================
// ✅ GET FEEDBACK STATS - Public statistics
// =============================================================================

export const getFeedbackStats = async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments({ status: { $ne: 'Dismissed' } });
    
    const sentimentBreakdown = await Feedback.aggregate([
      { $match: { status: { $ne: 'Dismissed' } } },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalFeedback,
        sentiment: sentimentBreakdown.reduce((acc, s) => {
          const label = s._id ? String(s._id).toLowerCase() : 'neutral';
          acc[label] = (acc[label] || 0) + s.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('❌ Get Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
