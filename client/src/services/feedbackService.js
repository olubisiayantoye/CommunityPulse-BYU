import api from './api';

export const submitFeedback = async (data) => {
  const response = await api.post('/feedback', data);
  return response.data;
};

export const getFeedback = async (params = {}) => {
  const response = await api.get('/feedback', { params });
  return response.data;
};

export const updateFeedback = async (id, updateData) => {
  const response = await api.put(`/feedback/${id}`, updateData);
  return response.data;
};

export const deleteFeedback = async (id) => {
  const response = await api.delete(`/feedback/${id}`);
  return response.data;
};

export const upvoteFeedback = async (id) => {
  const response = await api.post(`/feedback/${id}/upvote`);
  return response.data;
};

export const removeUpvote = async (id) => {
  const response = await api.delete(`/feedback/${id}/upvote`);
  return response.data;
};

export const getMyFeedback = async (params = {}) => {
  const response = await api.get('/feedback/my', { params });
  return response.data;
};

export default {
  submitFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback,
  upvoteFeedback,
  removeUpvote,
  getMyFeedback
};