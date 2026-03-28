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

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// Dashboard overview (Admin/Mod only)
router.get(
  '/dashboard',
  authorize('admin', 'moderator'),
  getDashboardAnalytics
);

// Sentiment trends over time
router.get(
  '/sentiment',
  authorize('admin', 'moderator'),
  getSentimentTrends
);

// Category-specific analytics
router.get(
  '/category/:category',
  authorize('admin', 'moderator'),
  getCategoryAnalytics
);

// Export data
router.get(
  '/export',
  authorize('admin', 'moderator'),
  exportAnalytics
);

// Priority alerts
router.get(
  '/alerts',
  authorize('admin', 'moderator'),
  getPriorityAlerts
);

// User engagement metrics
router.get(
  '/engagement',
  authorize('admin', 'moderator'),
  getUserEngagement
);

// Period comparison
router.get(
  '/comparison',
  authorize('admin', 'moderator'),
  getComparisonAnalytics
);

export default router;