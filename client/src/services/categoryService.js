import api from './api';

// Get all categories (admin)
export const getCategories = async (params = {}) => {
  const response = await api.get('/categories', { params });
  return response.data;
};

// Get active categories (public, for feedback form)
export const getActiveCategories = async () => {
  const response = await api.get('/categories/active');
  return response.data;
};

// Get single category
export const getCategoryById = async (id) => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

// Create category
export const createCategory = async (categoryData) => {
  const response = await api.post('/categories', categoryData);
  return response.data;
};

// Update category
export const updateCategory = async (id, updateData) => {
  const response = await api.put(`/categories/${id}`, updateData);
  return response.data;
};

// Delete category
export const deleteCategory = async (id, hardDelete = false) => {
  const response = await api.delete(`/categories/${id}`, {
    params: { hardDelete }
  });
  return response.data;
};

// Reorder categories
export const reorderCategories = async (categories) => {
  const response = await api.put('/categories/reorder', { categories });
  return response.data;
};

export default {
  getCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories
};