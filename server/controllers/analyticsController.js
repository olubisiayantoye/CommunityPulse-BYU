import Feedback from '../models/Feedback.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// =============================================================================
// 📊 DASHBOARD ANALYTICS
// Main dashboard overview with key metrics
// =============================================================================

export const getDashboardAnalytics = async (req, res) => {
  try {
    const { 
      days,
      startDate, 
      endDate, 
      organization 
    } = req.query;

    const dateFilter = buildDateFilter({ days, startDate, endDate });

    // Build organization filter (for multi-tenant support)
    const orgFilter = {};
    if (organization) {
      const orgUsers = await User.find({ organization }).distinct('_id');
      // If feedback has submittedBy field, filter by those users
      // For now, we'll skip this for anonymous feedback
    }

    // Combine filters
    const query = { ...dateFilter };

    // =============================================================================
    // 📈 KEY METRICS
    // =============================================================================

    // Total Feedback Count
    const totalFeedback = await Feedback.countDocuments(query);
    const totalUsers = await User.countDocuments();

    // Sentiment Breakdown
    const sentimentBreakdown = await Feedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentiment.score' }
        }
      }
    ]);

    // Format sentiment data
    const sentiment = {
      positive: sentimentBreakdown.find(s => s._id === 'POSITIVE') || { count: 0, avgScore: 0 },
      neutral: sentimentBreakdown.find(s => s._id === 'NEUTRAL') || { count: 0, avgScore: 0 },
      negative: sentimentBreakdown.find(s => s._id === 'NEGATIVE') || { count: 0, avgScore: 0 }
    };

    // Calculate overall sentiment score (-100 to 100)
    const sentimentScore = totalFeedback > 0
      ? Math.round(
          ((sentiment.positive.count - sentiment.negative.count) / totalFeedback) * 100
        )
      : 0;

    // Category Breakdown
    const categoryBreakdown = await Feedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgSentiment: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$sentiment.label', 'POSITIVE'] }, then: 1 },
                  { case: { $eq: ['$sentiment.label', 'NEGATIVE'] }, then: -1 }
                ],
                default: 0
              }
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Status Breakdown
    const statusBreakdown = await Feedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent Activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await Feedback.countDocuments({
      submittedAt: { $gte: sevenDaysAgo }
    });

    // Priority Issues (Negative + High Upvotes)
    const priorityIssues = await Feedback.find({
      ...query,
      'sentiment.label': 'NEGATIVE',
      upvoteCount: { $gte: 5 }
    })
      .sort({ upvoteCount: -1, submittedAt: -1 })
      .limit(10)
      .select('content category sentiment upvoteCount status submittedAt');

    // =============================================================================
    // 📉 TREND DATA (Last 30 Days)
    // =============================================================================

    const trendData = await getTrendData(query, 30);

    // =============================================================================
    // 🎯 RESPONSE
    // =============================================================================

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalFeedback,
          totalUsers,
          recentActivity,
          sentimentScore,
          responseRate: calculateResponseRate(statusBreakdown)
        },
        sentiment: {
          positive: sentiment.positive.count,
          neutral: sentiment.neutral.count,
          negative: sentiment.negative.count,
          positiveAvgScore: sentiment.positive.avgScore?.toFixed(2) || 0,
          negativeAvgScore: sentiment.negative.avgScore?.toFixed(2) || 0
        },
        categories: categoryBreakdown.map(c => ({
          name: c._id || 'Other',
          count: c.count,
          sentiment: Number(c.avgSentiment?.toFixed(2) || 0)
        })),
        status: statusBreakdown.reduce((acc, s) => {
          const statusKey = normalizeStatusKey(s._id);
          acc[statusKey] = (acc[statusKey] || 0) + s.count;
          return acc;
        }, {}),
        priorityIssues,
        trends: trendData
      },
      meta: {
        dateRange: {
          start: startDate || 'all',
          end: endDate || 'current'
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Dashboard Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard analytics'
    });
  }
};

// =============================================================================
// 📈 SENTIMENT TRENDS
// Time-series sentiment analysis
// =============================================================================

export const getSentimentTrends = async (req, res) => {
  try {
    const { 
      days = 30, 
      interval = 'day' // 'hour', 'day', 'week', 'month'
    } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trendData = await getTrendData(
      {
        submittedAt: {
          $gte: startDate,
          $lte: endDate
        }
      },
      parseInt(days),
      interval
    );

    res.status(200).json({
      success: true,
      data: {
        trends: trendData,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: parseInt(days),
          interval
        }
      }
    });

  } catch (error) {
    console.error('❌ Sentiment Trends Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching sentiment trends'
    });
  }
};

// =============================================================================
// 📊 CATEGORY ANALYTICS
// Deep dive into specific categories
// =============================================================================

export const getCategoryAnalytics = async (req, res) => {
  try {
    const { category } = req.params;
    const { startDate, endDate } = req.query;

    const query = { category };
    
    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) query.submittedAt.$lte = new Date(endDate);
    }

    // Category overview
    const totalInCategory = await Feedback.countDocuments(query);

    // Sentiment distribution
    const sentimentDist = await Feedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
          feedback: { $push: '$$ROOT' }
        }
      }
    ]);

    // Top keywords in this category
    const keywordAgg = await Feedback.aggregate([
      { $match: query },
      { $unwind: '$keywords' },
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 },
          sentiment: { $first: '$sentiment.label' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Recent feedback in category
    const recentFeedback = await Feedback.find(query)
      .sort({ submittedAt: -1 })
      .limit(20)
      .select('content sentiment upvoteCount status submittedAt');

    res.status(200).json({
      success: true,
      data: {
        category,
        overview: {
          total: totalInCategory,
          sentiment: sentimentDist.reduce((acc, s) => {
            const key = s._id ? String(s._id).toLowerCase() : 'neutral';
            acc[key] = (acc[key] || 0) + s.count;
            return acc;
          }, {})
        },
        keywords: keywordAgg,
        recentFeedback,
        trend: await getTrendData(query, 30)
      }
    });

  } catch (error) {
    console.error('❌ Category Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching category analytics'
    });
  }
};

// =============================================================================
// 📥 DATA EXPORT
// Export analytics data for reports
// =============================================================================

export const exportAnalytics = async (req, res) => {
  try {
    const { 
      format = 'csv', // 'csv', 'json'
      startDate, 
      endDate,
      category,
      sentiment
    } = req.query;

    const query = {};
    
    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) query.submittedAt.$lte = new Date(endDate);
    }
    
    if (category) query.category = category;
    if (sentiment) query['sentiment.label'] = sentiment;

    // Fetch data
    const feedback = await Feedback.find(query)
      .select('content category sentiment upvoteCount status submittedAt keywords')
      .sort({ submittedAt: -1 })
      .lean();

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Date',
        'Category',
        'Sentiment',
        'Sentiment Score',
        'Status',
        'Upvotes',
        'Content',
        'Keywords'
      ];

      const rows = feedback.map(f => [
        f.submittedAt.toISOString().split('T')[0],
        f.category,
        f.sentiment.label,
        f.sentiment.score,
        f.status,
        f.upvoteCount,
        `"${f.content.replace(/"/g, '""')}"`, // Escape quotes
        f.keywords?.join(';') || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=community-pulse-analytics-${Date.now()}.csv`
      );
      res.send(csvContent);
    } else {
      // JSON export
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=community-pulse-analytics-${Date.now()}.json`
      );
      res.json({
        success: true,
        exportedAt: new Date().toISOString(),
        totalRecords: feedback.length,
        data: feedback
      });
    }

  } catch (error) {
    console.error('❌ Export Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting analytics'
    });
  }
};

// =============================================================================
// 🚨 PRIORITY ALERTS
// Get items requiring immediate attention
// =============================================================================

export const getPriorityAlerts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Priority scoring: Negative sentiment + High upvotes + Pending status
    const priorityIssues = await Feedback.aggregate([
      {
        $match: {
          'sentiment.label': 'NEGATIVE',
          status: { $in: ['Pending', 'In Progress'] }
        }
      },
      {
        $addFields: {
          priorityScore: {
            $add: [
              { $multiply: ['$upvoteCount', 2] },
              {
                $cond: [{ $eq: ['$status', 'Pending'] }, 10, 5]
              },
              {
                $cond: [{ $gte: ['$sentiment.score', 0.8] }, 15, 0]
              }
            ]
          }
        }
      },
      { $sort: { priorityScore: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Alert summary
    const alertSummary = {
      critical: priorityIssues.filter(i => i.priorityScore >= 30).length,
      high: priorityIssues.filter(i => i.priorityScore >= 20 && i.priorityScore < 30).length,
      medium: priorityIssues.filter(i => i.priorityScore < 20).length
    };

    res.status(200).json({
      success: true,
      data: {
        alerts: priorityIssues,
        summary: alertSummary,
        total: priorityIssues.length
      }
    });

  } catch (error) {
    console.error('❌ Priority Alerts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching priority alerts'
    });
  }
};

// =============================================================================
// 📊 USER ENGAGEMENT ANALYTICS
// Track member participation
// =============================================================================

export const getUserEngagement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.submittedAt = {};
      if (startDate) dateFilter.submittedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.submittedAt.$lte = new Date(endDate);
    }

    // Active users (submitted feedback)
    const activeUsers = await Feedback.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$submittedBy',
          submissionCount: { $sum: 1 },
          lastSubmission: { $max: '$submittedAt' }
        }
      },
      { $sort: { submissionCount: -1 } },
      { $limit: 20 }
    ]);

    // Upvote activity
    const upvoteActivity = await Feedback.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalUpvotes: { $sum: '$upvoteCount' },
          avgUpvotesPerFeedback: { $avg: '$upvoteCount' }
        }
      }
    ]);

    // Feedback velocity (feedback per day)
    const velocity = await Feedback.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        activeUsers: activeUsers.length,
        topContributors: activeUsers.slice(0, 10),
        upvotes: upvoteActivity[0] || { totalUpvotes: 0, avgUpvotesPerFeedback: 0 },
        dailyVelocity: velocity,
        avgFeedbackPerDay: velocity.length > 0
          ? (velocity.reduce((sum, v) => sum + v.count, 0) / velocity.length).toFixed(2)
          : 0
      }
    });

  } catch (error) {
    console.error('❌ User Engagement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user engagement analytics'
    });
  }
};

// =============================================================================
// AUDIT LOGS
// Surface recent audit activity for admins
// =============================================================================

export const getAuditLogs = async (req, res) => {
  try {
    const {
      limit = 20,
      action,
      targetType,
      severity,
      actor,
      organization,
      hasNote = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    const organizationFilter = organization || req.user.organization;

    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (severity) query.severity = severity;

    if (hasNote === 'with-note') {
      query.$or = buildAuditNoteClauses('exists');
    } else if (hasNote === 'without-note') {
      query.$and = buildAuditNoteClauses('missing');
    }

    if (actor) {
      const actorRegex = new RegExp(escapeRegExp(actor), 'i');
      const matchingActorIds = await User.findIncludingInactive({
        $or: [{ name: actorRegex }, { email: actorRegex }]
      }).distinct('_id');

      query.actor = matchingActorIds.length > 0
        ? { $in: matchingActorIds }
        : { $in: [] };
    }

    if (organizationFilter) {
      const orgUserIds = await User.findIncludingInactive({
        organization: organizationFilter
      }).distinct('_id');

      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { actor: { $in: orgUserIds } },
            { 'details.organization': organizationFilter },
            { targetType: 'User', targetId: { $in: orgUserIds } },
            { 'details.submittedBy': { $in: orgUserIds } }
          ]
        }
      ];
    }

    const sortFieldMap = {
      createdAt: 'createdAt',
      action: 'action',
      severity: 'severity',
      targetType: 'targetType'
    };

    const sortField = sortFieldMap[sortBy] || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [auditLogs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email role')
        .sort({ [sortField]: sortDirection, _id: sortDirection })
        .limit(parseInt(limit, 10))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        auditLogs: auditLogs.map((entry) => ({
          _id: entry._id,
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId,
          details: normalizeAuditDetails(entry.details),
          note: extractAuditNote(entry.details),
          severity: entry.severity || 'info',
          createdAt: entry.createdAt,
          changedBy: entry.actor
            ? {
                _id: entry.actor._id,
                name: entry.actor.name,
                email: entry.actor.email,
                role: entry.actor.role
              }
            : null,
          organization: entry.details?.organization || organizationFilter || null
        })),
        total,
        organization: organizationFilter || null
      }
    });
  } catch (error) {
    console.error('Audit Logs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching audit logs'
    });
  }
};

const buildAuditNoteClauses = (mode) => {
  const notePaths = ['details.note', 'details.adminNote', 'details.noteAdded', 'details.comment'];

  if (mode === 'exists') {
    return notePaths.map((path) => ({
      [path]: { $exists: true, $nin: [null, ''] }
    }));
  }

  return notePaths.map((path) => ({
    [path]: { $in: [null, ''] }
  }));
};

const normalizeAuditDetails = (details) => {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return {};
  }

  const note = extractAuditNote(details);

  return {
    ...details,
    note
  };
};

const extractAuditNote = (details) => {
  if (!details || typeof details !== 'object') {
    return null;
  }

  const directCandidates = [
    details.note,
    details.adminNote,
    details.noteAdded,
    details.comment
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (Array.isArray(details.notes)) {
    const matchingNote = details.notes.find(
      (candidate) => typeof candidate === 'string' && candidate.trim()
    );

    if (matchingNote) {
      return matchingNote.trim();
    }
  }

  return null;
};

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// =============================================================================
// 🔧 HELPER FUNCTIONS
// =============================================================================

// Get trend data for time series
const getTrendData = async (query, days = 30, interval = 'day') => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const dateField = interval === 'hour'
    ? { $dateToString: { format: '%Y-%m-%d %H', date: '$submittedAt' } }
    : interval === 'week'
    ? { $dateToString: { format: '%Y-W%V', date: '$submittedAt' } }
    : interval === 'month'
    ? { $dateToString: { format: '%Y-%m', date: '$submittedAt' } }
    : { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } };

  const trends = await Feedback.aggregate([
    {
      $match: {
        ...query,
        submittedAt: {
          ...query.submittedAt,
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: dateField,
        total: { $sum: 1 },
        positive: {
          $sum: { $cond: [{ $eq: ['$sentiment.label', 'POSITIVE'] }, 1, 0] }
        },
        neutral: {
          $sum: { $cond: [{ $eq: ['$sentiment.label', 'NEUTRAL'] }, 1, 0] }
        },
        negative: {
          $sum: { $cond: [{ $eq: ['$sentiment.label', 'NEGATIVE'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Fill in missing dates with zeros
  const filledTrends = fillMissingDates(trends, startDate, endDate, interval);

  return filledTrends.map(t => ({
    date: t._id,
    total: t.total,
    positive: t.positive,
    neutral: t.neutral,
    negative: t.negative,
    sentimentScore: t.total > 0
      ? Math.round(((t.positive - t.negative) / t.total) * 100)
      : 0
  }));
};

// Fill missing dates in trend data
const fillMissingDates = (trends, startDate, endDate, interval = 'day') => {
  const result = [];
  const currentDate = new Date(startDate);
  const trendsMap = new Map(trends.map(t => [t._id, t]));

  while (currentDate <= endDate) {
    let dateKey;
    if (interval === 'hour') {
      dateKey = currentDate.toISOString().slice(0, 13).replace('T', ' ');
    } else if (interval === 'week') {
      const weekNum = getWeekNumber(currentDate);
      dateKey = `${currentDate.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    } else if (interval === 'month') {
      dateKey = currentDate.toISOString().slice(0, 7);
    } else {
      dateKey = currentDate.toISOString().slice(0, 10);
    }

    const trend = trendsMap.get(dateKey) || {
      _id: dateKey,
      total: 0,
      positive: 0,
      neutral: 0,
      negative: 0
    };

    result.push(trend);

    // Increment date
    if (interval === 'hour') {
      currentDate.setHours(currentDate.getHours() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return result;
};

// Get ISO week number
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Calculate response rate
const calculateResponseRate = (statusBreakdown) => {
  const total = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
  const resolved = statusBreakdown.find(s => s._id === 'Resolved')?.count || 0;
  const inProgress = statusBreakdown.find(s => s._id === 'In Progress')?.count || 0;
  
  return total > 0
    ? Math.round(((resolved + inProgress) / total) * 100)
    : 0;
};

const buildDateFilter = ({ days, startDate, endDate }) => {
  const dateFilter = {};

  if (startDate || endDate) {
    dateFilter.submittedAt = {};
    if (startDate) dateFilter.submittedAt.$gte = new Date(startDate);
    if (endDate) dateFilter.submittedAt.$lte = new Date(endDate);
    return dateFilter;
  }

  if (days) {
    const parsedDays = parseInt(days, 10);
    if (!Number.isNaN(parsedDays) && parsedDays > 0) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - parsedDays);
      dateFilter.submittedAt = { $gte: start, $lte: end };
    }
  }

  return dateFilter;
};

const normalizeStatusKey = (status) => {
  if (!status) return 'pending';
  return String(status).toLowerCase().replace(/\s+/g, '_');
};

// =============================================================================
// 📊 COMPARISON ANALYTICS
// Compare two time periods
// =============================================================================

export const getComparisonAnalytics = async (req, res) => {
  try {
    const {
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate
    } = req.query;

    // Validate dates
    if (!currentStartDate || !currentEndDate || !previousStartDate || !previousEndDate) {
      return res.status(400).json({
        success: false,
        message: 'All date parameters are required for comparison'
      });
    }

    // Current period query
    const currentQuery = {
      submittedAt: {
        $gte: new Date(currentStartDate),
        $lte: new Date(currentEndDate)
      }
    };

    // Previous period query
    const previousQuery = {
      submittedAt: {
        $gte: new Date(previousStartDate),
        $lte: new Date(previousEndDate)
      }
    };

    // Get metrics for both periods
    const [currentTotal, previousTotal] = await Promise.all([
      Feedback.countDocuments(currentQuery),
      Feedback.countDocuments(previousQuery)
    ]);

    const [currentSentiment, previousSentiment] = await Promise.all([
      Feedback.aggregate([
        { $match: currentQuery },
        {
          $group: {
            _id: '$sentiment.label',
            count: { $sum: 1 }
          }
        }
      ]),
      Feedback.aggregate([
        { $match: previousQuery },
        {
          $group: {
            _id: '$sentiment.label',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    res.status(200).json({
      success: true,
      data: {
        current: {
          total: currentTotal,
          sentiment: currentSentiment.reduce((acc, s) => {
            const key = s._id ? String(s._id).toLowerCase() : 'neutral';
            acc[key] = (acc[key] || 0) + s.count;
            return acc;
          }, {})
        },
        previous: {
          total: previousTotal,
          sentiment: previousSentiment.reduce((acc, s) => {
            const key = s._id ? String(s._id).toLowerCase() : 'neutral';
            acc[key] = (acc[key] || 0) + s.count;
            return acc;
          }, {})
        },
        changes: {
          total: calculateChange(currentTotal, previousTotal),
          positive: calculateChange(
            currentSentiment.find(s => s._id === 'POSITIVE')?.count || 0,
            previousSentiment.find(s => s._id === 'POSITIVE')?.count || 0
          ),
          negative: calculateChange(
            currentSentiment.find(s => s._id === 'NEGATIVE')?.count || 0,
            previousSentiment.find(s => s._id === 'NEGATIVE')?.count || 0
          )
        }
      },
      periods: {
        current: { start: currentStartDate, end: currentEndDate },
        previous: { start: previousStartDate, end: previousEndDate }
      }
    });

  } catch (error) {
    console.error('❌ Comparison Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching comparison analytics'
    });
  }
};
