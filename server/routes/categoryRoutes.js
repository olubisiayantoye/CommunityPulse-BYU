import express from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getActiveCategories
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCategory } from '../middleware/validate.js';

const router = express.Router();

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * @route   GET /api/categories/active
 * @desc    Get active categories for feedback form
 * @access  Public
 */
router.get('/active', getActiveCategories);

// =============================================================================
// PROTECTED ROUTES (All users)
// =============================================================================

/**
 * @route   GET /api/categories
 * @desc    Get all categories with pagination
 * @access  Private
 */
router.get('/', protect, getCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID
 * @access  Private
 */
router.get('/:id', protect, getCategoryById);

// =============================================================================
// ADMIN-ONLY ROUTES
// =============================================================================

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private/Admin
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  validateCategory,
  createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private/Admin
 */
router.put(
  '/:id',
  protect,
  authorize('admin'),
  validateCategory,
  updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete/deactivate category
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteCategory
);

/**
 * @route   PUT /api/categories/reorder
 * @desc    Reorder categories
 * @access  Private/Admin
 */
router.put(
  '/reorder',
  protect,
  authorize('admin'),
  reorderCategories
);

// =============================================================================
// 404 HANDLER
// =============================================================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /api/categories/active',
      'GET /api/categories',
      'GET /api/categories/:id',
      'POST /api/categories',
      'PUT /api/categories/:id',
      'DELETE /api/categories/:id',
      'PUT /api/categories/reorder'
    ]
  });
});

export default router;