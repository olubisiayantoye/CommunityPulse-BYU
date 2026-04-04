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
  return normalizeAuthResponse(response.data);
};

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  const normalized = normalizeAuthResponse(response.data);
  if (normalized.token) {
    localStorage.setItem('token', normalized.token);
  }
  return normalized;
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

export const forgotPassword = async (payload) => {
  const requestBody = typeof payload === 'string' ? { email: payload } : payload;
  const response = await api.post('/auth/forgot-password', requestBody);
  return response.data;
};

export const resetPassword = async (payload, maybeNewPassword) => {
  const requestBody =
    typeof payload === 'string'
      ? { token: payload, newPassword: maybeNewPassword }
      : payload;
  const response = await api.post('/auth/reset-password', requestBody);
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await api.get(`/auth/verify-email/${token}`);
  const normalized = normalizeAuthResponse(response.data);
  if (normalized.token) {
    localStorage.setItem('token', normalized.token);
  }
  return normalized;
};

export const resendVerification = async (payload) => {
  const requestBody = typeof payload === 'string' ? { email: payload } : payload;
  const response = await api.post('/auth/resend-verification', requestBody);
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

const normalizeAuthResponse = (payload = {}) => ({
  ...payload,
  user: payload.user || payload.data?.user || null,
  token: payload.token || payload.data?.token || null
});

export default api;
