import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  resendVerification,
  verifyEmail
} from './authService';

export const authStorage = {
  getToken() {
    return localStorage.getItem('token');
  },
  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    }
  },
  clearToken() {
    localStorage.removeItem('token');
  }
};

export const isAuthenticated = () => Boolean(authStorage.getToken());

export {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  resendVerification,
  verifyEmail
};

export default {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  resendVerification,
  verifyEmail,
  isAuthenticated,
  authStorage
};
