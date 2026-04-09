import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  activateUser,
  getUserStats
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateUserUpdate } from '../middleware/validate.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// =============================================================================
// USER MANAGEMENT ROUTES
// =============================================================================

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics for admin dashboard
 * @access  Private/Admin
 */
router.get('/stats', getUserStats);

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Private/Admin
 * @query   { page, limit, search, role, isActive, organization }
 */
router.get('/', getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private/Admin
 */
router.get('/:id', getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user details (role, status, profile)
 * @access  Private/Admin
 * @body    { name?, email?, role?, organization?, isActive?, bio?, avatar? }
 */
router.put(
  '/:id',
  validateUserUpdate,
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user (soft delete)
 * @access  Private/Admin
 */
router.delete('/:id', deleteUser);

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Reactivate a deactivated user
 * @access  Private/Admin
 */
router.put('/:id/activate', activateUser);

// =============================================================================
// 404 HANDLER
// =============================================================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /api/users/stats',
      'GET /api/users',
      'GET /api/users/:id',
      'PUT /api/users/:id',
      'DELETE /api/users/:id',
      'PUT /api/users/:id/activate'
    ]
  });
});

export default router;