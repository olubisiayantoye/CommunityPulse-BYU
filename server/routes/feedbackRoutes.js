import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  createFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  upvoteFeedback,
  removeUpvote,
  getMyFeedback,
  getFeedbackStats
} from '../controllers/feedbackController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  validateCreateFeedback,
  validateUpdateFeedback,
  validateFeedbackQuery
} from '../middleware/validate.js';

const router = express.Router();

// =============================================================================
// 🔒 RATE LIMITING CONFIGURATION
// =============================================================================

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many feedback submissions. Please wait before submitting more.',
    retryAfter: '3600'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

const upvoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many upvote actions. Please slow down.',
    retryAfter: '3600'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.',
    retryAfter: '900'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// =============================================================================
// 📤 PUBLIC ROUTES
// =============================================================================

router.get(
  '/public/stats',
  readLimiter,
  getFeedbackStats
);

// =============================================================================
// 🔐 PROTECTED ROUTES
// =============================================================================

router.post(
  '/',
  protect,
  submissionLimiter,
  validateCreateFeedback,
  createFeedback
);

router.get(
  '/',
  protect,
  readLimiter,
  validateFeedbackQuery,
  getFeedback
);

router.get(
  '/my',
  protect,
  readLimiter,
  getMyFeedback
);

router.get(
  '/:id',
  protect,
  readLimiter,
  getFeedbackById
);

router.put(
  '/:id',
  protect,
  validateUpdateFeedback,
  updateFeedback
);

router.delete(
  '/:id',
  protect,
  deleteFeedback
);

router.post(
  '/:id/upvote',
  protect,
  upvoteLimiter,
  upvoteFeedback
);

router.delete(
  '/:id/upvote',
  protect,
  upvoteLimiter,
  removeUpvote
);

// =============================================================================
// 👑 ADMIN-ONLY ROUTES
// =============================================================================

router.get(
  '/admin/pending',
  protect,
  authorize('admin', 'moderator'),
  readLimiter,
  async (req, res) => {
    try {
      const Feedback = (await import('../models/Feedback.js')).default;
      const { limit = 50, category } = req.query;

      const query = { status: 'Pending' };
      if (category) query.category = category;

      const pending = await Feedback.find(query)
        .sort({ submittedAt: -1, upvoteCount: -1 })
        .limit(parseInt(limit))
        .select('content category sentiment upvoteCount status submittedAt keywords');

      res.status(200).json({
        success: true,
        data: {  // ✅ FIXED: Added "data:" key
          pending,
          total: pending.length
        }
      });
    } catch (error) {
      console.error('❌ Get Pending Feedback Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error fetching pending feedback'
      });
    }
  }
);

router.get(
  '/admin/negative',
  protect,
  authorize('admin', 'moderator'),
  readLimiter,
  async (req, res) => {
    try {
      const Feedback = (await import('../models/Feedback.js')).default;
      const { limit = 50, startDate, endDate } = req.query;

      const query = { 'sentiment.label': 'NEGATIVE' };
      
      if (startDate || endDate) {
        query.submittedAt = {};
        if (startDate) query.submittedAt.$gte = new Date(startDate);
        if (endDate) query.submittedAt.$lte = new Date(endDate);
      }

      const negative = await Feedback.find(query)
        .sort({ upvoteCount: -1, submittedAt: -1 })
        .limit(parseInt(limit))
        .select('content category sentiment upvoteCount status submittedAt adminNotes');

      res.status(200).json({
        success: true,
        data: {  // ✅ FIXED: Added "data:" key
          negative,
          total: negative.length
        }
      });
    } catch (error) {
      console.error('❌ Get Negative Feedback Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error fetching negative feedback'
      });
    }
  }
);

router.post(
  '/admin/bulk-update',
  protect,
  authorize('admin', 'moderator'),
  async (req, res) => {
    try {
      const Feedback = (await import('../models/Feedback.js')).default;
      const { feedbackIds, status, adminNote } = req.body;

      if (!Array.isArray(feedbackIds) || feedbackIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an array of feedback IDs'
        });
      }

      if (!['Pending', 'In Progress', 'Resolved', 'Dismissed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      const updateData = { status };
      
      if (adminNote && req.user?.role === 'admin') {
        updateData.$push = {
          adminNotes: {
            note: adminNote,
            addedBy: req.user._id,
            timestamp: new Date()
          }
        };
      }

      const result = await Feedback.updateMany(
        { _id: { $in: feedbackIds } },
        updateData
      );

      res.status(200).json({
        success: true,
        message: `Successfully updated ${result.modifiedCount} feedback items`,
        data: {  // ✅ FIXED: Added "data:" key
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount
        }
      });
    } catch (error) {
      console.error('❌ Bulk Update Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during bulk update'
      });
    }
  }
);

router.get(
  '/admin/export',
  protect,
  authorize('admin', 'moderator'),
  async (req, res) => {
    try {
      const Feedback = (await import('../models/Feedback.js')).default;
      const { 
        format = 'csv',
        startDate, 
        endDate, 
        category, 
        status 
      } = req.query;

      const query = {};
      
      if (startDate || endDate) {
        query.submittedAt = {};
        if (startDate) query.submittedAt.$gte = new Date(startDate);
        if (endDate) query.submittedAt.$lte = new Date(endDate);
      }
      if (category) query.category = category;
      if (status) query.status = status;

      const feedback = await Feedback.find(query)
        .select('content category sentiment upvoteCount status submittedAt keywords adminNotes')
        .sort({ submittedAt: -1 })
        .lean();

      if (format === 'csv') {
        const headers = [
          'Date', 'Category', 'Sentiment', 'Sentiment Score', 'Status',
          'Upvotes', 'Content', 'Keywords', 'Admin Notes'
        ];

        const rows = feedback.map(f => [
          f.submittedAt.toISOString().split('T')[0],
          f.category,
          f.sentiment.label,
          f.sentiment.score,
          f.status,
          f.upvoteCount,
          `"${f.content.replace(/"/g, '""')}"`,
          f.keywords?.join(';') || '',
          `"${f.adminNotes?.map(n => n.note).join('; ') || ''}"`
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=community-pulse-feedback-${Date.now()}.csv`
        );
        res.send(csvContent);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=community-pulse-feedback-${Date.now()}.json`
        );
        res.json({
          success: true,
          exportedAt: new Date().toISOString(),
          totalRecords: feedback.length,
          data: feedback  // ✅ FIXED: Added "data:" key
        });
      }
    } catch (error) {
      console.error('❌ Export Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error exporting feedback'
      });
    }
  }
);

// =============================================================================
// ⚠️ 404 HANDLER
// =============================================================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'POST /api/feedback',
      'GET /api/feedback',
      'GET /api/feedback/my',
      'GET /api/feedback/:id',
      'PUT /api/feedback/:id',
      'DELETE /api/feedback/:id',
      'POST /api/feedback/:id/upvote',
      'DELETE /api/feedback/:id/upvote',
      'GET /api/feedback/public/stats',
      'GET /api/feedback/admin/pending',
      'GET /api/feedback/admin/negative',
      'POST /api/feedback/admin/bulk-update',
      'GET /api/feedback/admin/export'
    ]
  });
});

export default router;