import api from './api';

export const getAdminUsers = async (params = {}) => {
  const response = await api.get('/auth/admin/users', { params });
  return response.data;
};

export const updateAdminUser = async (userId, updates) => {
  const response = await api.put(`/auth/admin/users/${userId}`, updates);
  return response.data;
};

export default {
  getAdminUsers,
  updateAdminUser
};
