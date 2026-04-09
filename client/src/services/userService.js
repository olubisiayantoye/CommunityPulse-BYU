import api from './api';

// Get user statistics
export const getUserStats = async () => {
  const response = await api.get('/users/stats');
  return response.data;
};

// Get all users with filters
export const getUsers = async (params = {}) => {
  const response = await api.get('/users', { params });
  return response.data;
};

// Get single user
export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Update user
export const updateUser = async (id, updateData) => {
  const response = await api.put(`/users/${id}`, updateData);
  return response.data;
};

// Deactivate user
export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Activate user
export const activateUser = async (id) => {
  const response = await api.put(`/users/${id}/activate`);
  return response.data;
};

export default {
  getUserStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  activateUser
};