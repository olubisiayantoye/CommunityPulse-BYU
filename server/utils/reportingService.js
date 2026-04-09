import Feedback from '../models/Feedback.js';
import User from '../models/User.js';

const escapeCsv = (value = '') => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const buildExportQuery = async ({
  days,
  startDate,
  endDate,
  category,
  sentiment,
  platform,
  status,
  organization
} = {}) => {
  const query = buildDateFilter({ days, startDate, endDate });

  if (category && category !== 'all') {
    query.category = category;
  }

  if (sentiment && sentiment !== 'all') {
    query['sentiment.label'] = sentiment;
  }

  if (platform && platform !== 'all') {
    query['metadata.platform'] = platform;
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  if (organization) {
    const orgUserIds = await User.findIncludingInactive({ organization }).distinct('_id');
    query.$or = [{ submittedBy: { $in: orgUserIds } }, { submittedBy: null }];
  }

  return query;
};

export const getExportFeedback = async (query = {}, { includeAdminNotes = false } = {}) => {
  const baseSelect = [
    'content',
    'category',
    'sentiment',
    'upvoteCount',
    'status',
    'submittedAt',
    'keywords',
    'metadata.platform',
    'isAnonymous'
  ];

  if (includeAdminNotes) {
    baseSelect.push('adminNotes');
  }

  return Feedback.find(query)
    .select(baseSelect.join(' '))
    .sort({ submittedAt: -1 })
    .lean();
};

export const buildDetailedCsv = (feedback = [], { includeAdminNotes = false } = {}) => {
  const headers = [
    'Date',
    'Category',
    'Platform',
    'Participation',
    'Sentiment',
    'Sentiment Score',
    'Status',
    'Upvotes',
    'Content',
    'Keywords'
  ];

  if (includeAdminNotes) {
    headers.push('Admin Notes');
  }

  const rows = feedback.map((item) => {
    const row = [
      item.submittedAt ? new Date(item.submittedAt).toISOString().split('T')[0] : '',
      item.category || 'Other',
      item.metadata?.platform || 'Web',
      item.isAnonymous ? 'Anonymous' : 'Identified',
      item.sentiment?.label || 'NEUTRAL',
      item.sentiment?.score ?? '',
      item.status || 'Pending',
      item.upvoteCount ?? 0,
      escapeCsv(item.content || ''),
      escapeCsv((item.keywords || []).join('; '))
    ];

    if (includeAdminNotes) {
      row.push(escapeCsv((item.adminNotes || []).map((note) => note.note).join('; ')));
    }

    return row;
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

export const getSummaryReport = async (query = {}, { organization = null } = {}) => {
  const [totals, categories, statuses, sentiments, platforms, noteStats] = await Promise.all([
    Feedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          totalUpvotes: { $sum: '$upvoteCount' },
          avgSentimentScore: { $avg: '$sentiment.score' }
        }
      }
    ]),
    Feedback.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]),
    Feedback.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]),
    Feedback.aggregate([
      { $match: query },
      { $group: { _id: '$sentiment.label', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]),
    Feedback.aggregate([
      { $match: query },
      { $group: { _id: { $ifNull: ['$metadata.platform', 'Web'] }, count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]),
    Feedback.aggregate([
      { $match: query },
      {
        $project: {
          noteCount: { $size: { $ifNull: ['$adminNotes', []] } }
        }
      },
      {
        $group: {
          _id: null,
          feedbackWithAdminNotes: {
            $sum: {
              $cond: [{ $gt: ['$noteCount', 0] }, 1, 0]
            }
          },
          totalAdminNotes: { $sum: '$noteCount' }
        }
      }
    ])
  ]);

  const totalsRow = totals[0] || {
    totalFeedback: 0,
    totalUpvotes: 0,
    avgSentimentScore: 0
  };

  const noteRow = noteStats[0] || {
    feedbackWithAdminNotes: 0,
    totalAdminNotes: 0
  };

  return {
    organization,
    generatedAt: new Date().toISOString(),
    overview: {
      totalFeedback: totalsRow.totalFeedback || 0,
      totalUpvotes: totalsRow.totalUpvotes || 0,
      avgSentimentScore: Number((totalsRow.avgSentimentScore || 0).toFixed(2)),
      feedbackWithAdminNotes: noteRow.feedbackWithAdminNotes || 0,
      totalAdminNotes: noteRow.totalAdminNotes || 0
    },
    breakdowns: {
      categories: normalizeBreakdown(categories),
      statuses: normalizeBreakdown(statuses),
      sentiments: normalizeBreakdown(sentiments),
      platforms: normalizeBreakdown(platforms)
    }
  };
};

export const buildSummaryCsv = (summary) => {
  const rows = [
    ['Section', 'Metric', 'Value'],
    ['Overview', 'Generated At', summary.generatedAt],
    ['Overview', 'Organization', summary.organization || 'All'],
    ['Overview', 'Total Feedback', summary.overview.totalFeedback],
    ['Overview', 'Total Upvotes', summary.overview.totalUpvotes],
    ['Overview', 'Average Sentiment Score', summary.overview.avgSentimentScore],
    ['Overview', 'Feedback With Admin Notes', summary.overview.feedbackWithAdminNotes],
    ['Overview', 'Total Admin Notes', summary.overview.totalAdminNotes]
  ];

  for (const [section, items] of Object.entries(summary.breakdowns)) {
    for (const item of items) {
      rows.push([section, item.label, item.count]);
    }
  }

  return rows.map((row) => row.map((value) => escapeCsv(value)).join(',')).join('\n');
};

const normalizeBreakdown = (items = []) =>
  items.map((item) => ({
    label: item._id || 'Unspecified',
    count: item.count || 0
  }));

const buildDateFilter = ({ days, startDate, endDate } = {}) => {
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
