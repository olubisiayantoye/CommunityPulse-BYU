import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data?.data?.token) {
    localStorage.setItem('token', response.data.data.token);
  }
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.warn('Logout backend call failed');
  } finally {
    localStorage.removeItem('token');
  }
  return { success: true, message: 'Logged out successfully' };
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/me', profileData);
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await api.put('/auth/me/change-password', passwordData);
  return response.data;
};


export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};
// ===========================

export const verifyEmail = async (token) => {
  const response = await api.get(`/auth/verify-email/${token}`);
  if (response.data?.data?.token) {
    localStorage.setItem('token', response.data.data.token);
  }
  return response.data;
};

export const resendVerification = async (email) => {
  const response = await api.post('/auth/resend-verification', { email });
  return response.data;
};

export const deleteAccount = async (password) => {
  const response = await api.delete('/auth/me', {
    data: { password, confirmDelete: true }
  });
  if (response.data?.success) {
    localStorage.removeItem('token');
  }
  return response.data;
};



export default api;