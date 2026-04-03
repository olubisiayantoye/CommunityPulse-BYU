import express from 'express';
import {
  getDashboardAnalytics,
  getSentimentTrends,
  getCategoryAnalytics,
  exportAnalytics,
  getPriorityAlerts,
  getUserEngagement,
  getComparisonAnalytics
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  validateAnalyticsQuery,
  validateCategoryParams
} from '../middleware/validate.js';

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// Dashboard overview (Admin/Mod only)
router.get(
  '/dashboard',
  authorize('admin', 'moderator'),
  validateAnalyticsQuery,
  getDashboardAnalytics
);

// Sentiment trends over time
router.get(
  '/sentiment',
  authorize('admin', 'moderator'),
  validateAnalyticsQuery,
  getSentimentTrends
);

// Category-specific analytics
router.get(
  '/category/:category',
  authorize('admin', 'moderator'),
  validateCategoryParams,
  validateAnalyticsQuery,
  getCategoryAnalytics
);

// Export data
router.get(
  '/export',
  authorize('admin', 'moderator'),
  validateAnalyticsQuery,
  exportAnalytics
);

// Priority alerts
router.get(
  '/alerts',
  authorize('admin', 'moderator'),
  validateAnalyticsQuery,
  getPriorityAlerts
);

// User engagement metrics
router.get(
  '/engagement',
  authorize('admin', 'moderator'),
  validateAnalyticsQuery,
  getUserEngagement
);

// Period comparison
router.get(
  '/comparison',
  authorize('admin', 'moderator'),
  validateAnalyticsQuery,
  getComparisonAnalytics
);

export default router;
