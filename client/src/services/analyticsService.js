import api from './api';

export const getDashboardAnalytics = async (params = {}) => {
  const response = await api.get('/analytics/dashboard', { params });
  return response.data;
};

export const getSentimentTrends = async (params = {}) => {
  const response = await api.get('/analytics/sentiment', { params });
  return response.data;
};

export const getPriorityAlerts = async (params = {}) => {
  const response = await api.get('/analytics/alerts', { params });
  return response.data;
};

export const exportAnalytics = async (params = {}) => {
  const response = await api.get('/analytics/export', { 
    params,
    responseType: 'blob'
  });
  return response;
};

export default {
  getDashboardAnalytics,
  getSentimentTrends,
  getPriorityAlerts,
  exportAnalytics
};