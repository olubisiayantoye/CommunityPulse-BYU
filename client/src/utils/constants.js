export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const FEEDBACK_CATEGORIES = [
  'Facilities',
  'Leadership',
  'Safety',
  'Events',
  'Communication',
  'Other'
];

export const FEEDBACK_STATUSES = [
  'Pending',
  'In Progress',
  'Resolved',
  'Dismissed'
];

export const SENTIMENT_LABELS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];

export const DATE_RANGE_OPTIONS = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 }
];

export const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10
};

export default {
  API_BASE_URL,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  SENTIMENT_LABELS,
  DATE_RANGE_OPTIONS,
  DEFAULT_PAGINATION
};
