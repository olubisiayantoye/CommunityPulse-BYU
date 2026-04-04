import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatDate = (value, options = {}) => {
  if (!value) return 'N/A';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  }).format(date);
};

export const truncateText = (text = '', maxLength = 140) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
};

export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const normalizeApiError = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

export const toDays = (range) => {
  if (typeof range === 'number') return range;
  const numeric = parseInt(String(range).replace(/\D/g, ''), 10);
  return Number.isFinite(numeric) ? numeric : 30;
};

export default {
  cn,
  formatDate,
  truncateText,
  getInitials,
  normalizeApiError,
  toDays
};
