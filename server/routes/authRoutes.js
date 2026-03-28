import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  deleteAccount
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword
} from '../middleware/validate.js';

const router = express.Router();

// =============================================================================
// 🔒 RATE LIMITING CONFIGURATION
// Prevent brute force attacks and API abuse
// =============================================================================

// Strict limit for login/register (authentication endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: '900' // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip // Rate limit by IP address
});

// Moderate limit for password reset (prevent email bombing)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again in 1 hour.',
    retryAfter: '3600'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Moderate limit for email verification
const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    success: false,
    message: 'Too many verification requests. Please try again in 1 hour.',
    retryAfter: '3600'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// =============================================================================
// 📤 PUBLIC ROUTES (No Authentication Required)
// =============================================================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 * @body    { name, email, password, organization, role? }
 */
router.post(
  '/register',
  authLimiter,
  validateRegister,
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 * @body    { email, password }
 */
router.post(
  '/login',
  authLimiter,
  validateLogin,
  login
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 * @body    { email }
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validateForgotPassword,
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token from email
 * @access  Public
 * @body    { token, newPassword }
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  validateResetPassword,
  resetPassword
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address with token
 * @access  Public
 * @params  { token }
 */
router.get(
  '/verify-email/:token',
  verifyEmail
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 * @body    { email }
 */
router.post(
  '/resend-verification',
  verificationLimiter,
  resendVerification
);

// =============================================================================
// 🔐 PROTECTED ROUTES (Authentication Required)
// =============================================================================

/**
 * @route   POST /api/auth/logout
 * @desc    Clear authentication cookie and log out user
 * @access  Private
 */
router.post(
  '/logout',
  logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user profile
 * @access  Private
 * @returns { user: { id, name, email, role, organization, ... } }
 */
router.get(
  '/me',
  protect,
  getMe
);

/**
 * @route   PUT /api/auth/me
 * @desc    Update user profile (name, bio, avatar, preferences)
 * @access  Private
 * @body    { name?, bio?, avatar?, preferences? }
 */
router.put(
  '/me',
  protect,
  validateUpdateProfile,
  updateProfile
);

/**
 * @route   PUT /api/auth/me/change-password
 * @desc    Change user password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.put(
  '/me/change-password',
  protect,
  validateChangePassword,
  changePassword
);

/**
 * @route   DELETE /api/auth/me
 * @desc    Soft delete user account (requires password confirmation)
 * @access  Private
 * @body    { password, confirmDelete: true }
 */
router.delete(
  '/me',
  protect,
  deleteAccount
);

// =============================================================================
// 👑 ADMIN-ONLY ROUTES (Admin Role Required)
// =============================================================================

/**
 * @route   GET /api/auth/admin/users
 * @desc    Get all users (Admin only - for user management)
 * @access  Private/Admin
 * @query   { page, limit, role, organization, isActive }
 */
router.get(
  '/admin/users',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const User = (await import('../models/User.js')).default;
      
      const { 
        page = 1, 
        limit = 20, 
        role, 
        organization, 
        isActive 
      } = req.query;

      const query = {};
      if (role) query.role = role;
      if (organization) query.organization = organization;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit
          }
        }
      });
    } catch (error) {
      console.error('❌ Admin Get Users Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error fetching users'
      });
    }
  }
);

/**
 * @route   PUT /api/auth/admin/users/:id
 * @desc    Update user role or status (Admin only)
 * @access  Private/Admin
 * @params  { id }
 * @body    { role?, isActive?, organization? }
 */
router.put(
  '/admin/users/:id',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const User = (await import('../models/User.js')).default;
      const { id } = req.params;
      const { role, isActive, organization } = req.body;

      // Prevent admin from modifying their own account
      if (id === req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify your own admin account'
        });
      }

      const updateData = {};
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (organization) updateData.organization = organization;

      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { user },
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('❌ Admin Update User Error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error updating user'
      });
    }
  }
);

/**
 * @route   DELETE /api/auth/admin/users/:id
 * @desc    Hard delete user account (Admin only - use with caution)
 * @access  Private/Admin
 * @params  { id }
 */
router.delete(
  '/admin/users/:id',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const User = (await import('../models/User.js')).default;
      const { id } = req.params;

      // Prevent admin from deleting their own account
      if (id === req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete your own admin account'
        });
      }

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'User account permanently deleted',
        data: { deletedUserId: id }
      });
    } catch (error) {
      console.error('❌ Admin Delete User Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error deleting user'
      });
    }
  }
);

// =============================================================================
// 🏥 HEALTH CHECK (For monitoring & load balancers)
// =============================================================================

/**
 * @route   GET /api/auth/health
 * @desc    Check authentication service health
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'CommunityPulse Auth',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// =============================================================================
// ⚠️ 404 HANDLER FOR UNKNOWN ROUTES
// =============================================================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET /api/auth/me',
      'PUT /api/auth/me',
      'PUT /api/auth/me/change-password',
      'DELETE /api/auth/me',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'GET /api/auth/verify-email/:token',
      'POST /api/auth/resend-verification',
      'GET /api/auth/admin/users',
      'PUT /api/auth/admin/users/:id',
      'DELETE /api/auth/admin/users/:id',
      'GET /api/auth/health'
    ]
  });
});

export default router;