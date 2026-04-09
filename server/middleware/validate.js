import { body, query, param, validationResult } from 'express-validator';
import Category from '../models/Category.js';  

// =============================================================================
// 🔐 AUTH VALIDATION
// =============================================================================

export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must include uppercase, lowercase, and number'),
  body('organization')
    .trim()
    .notEmpty()
    .withMessage('Organization name is required'),
  body('role')
    .optional()
    .isIn(['member', 'admin'])
    .withMessage('Invalid role value')
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('organization')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Organization name cannot be empty'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  body('preferences.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications must be a boolean'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Theme must be light, dark, or system')
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must include uppercase, lowercase, and number')
];

export const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

export const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must include uppercase, lowercase, and number')
];

// =============================================================================
// 📝 FEEDBACK VALIDATION
// =============================================================================

export const validateCreateFeedback = [
  body('content')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Feedback must be between 10 and 2000 characters'),
  
  // ✅ Simplified: Just check it's a non-empty string
  // The controller does the DB lookup for active category
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isString()
    .withMessage('Category must be a string')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),
  
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean value')
];

export const validateUpdateFeedback = [
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Resolved', 'Dismissed'])
    .withMessage('Invalid status. Must be one of: Pending, In Progress, Resolved, Dismissed'),
  body('adminNote')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin note cannot exceed 1000 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Content must be between 10 and 2000 characters')
];

export const validateFeedbackQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    query('category')
    .optional()
    .trim()
    .customSanitizer(value => value)  // Pass through for DB query
    .custom(async (value) => {
      if (value) {
        const category = await Category.findOne({ 
          name: { $regex: new RegExp(`^${value}$`, 'i') },
          isActive: true 
        });
        if (!category) {
          throw new Error('Invalid category filter');
        }
      }
      return true;
    }),
  query('sentiment')
    .optional()
    .isIn(['POSITIVE', 'NEUTRAL', 'NEGATIVE'])
    .withMessage('Invalid sentiment value'),
  query('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Resolved', 'Dismissed'])
    .withMessage('Invalid status value'),
  query('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('startDate must be a valid ISO 8601 date (YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('endDate must be a valid ISO 8601 date (YYYY-MM-DD)'),
  query('sort')
    .optional()
    .isIn(['submittedAt', 'upvoteCount', 'sentiment.score'])
    .withMessage('Invalid sort field')
];

// =============================================================================
// 📊 ANALYTICS VALIDATION (Optional - for analytics routes)
// =============================================================================

export const validateAnalyticsQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('endDate must be a valid ISO 8601 date'),
  query('organization')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Organization cannot be empty'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  query('interval')
    .optional()
    .isIn(['hour', 'day', 'week', 'month'])
    .withMessage('Interval must be hour, day, week, or month'),
  query('format')
    .optional()
    .isIn(['csv', 'json'])
    .withMessage('Format must be csv or json'),
  query('action')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Action filter cannot be empty'),
  query('targetType')
    .optional({ values: 'falsy' })
    .isIn(['User', 'Feedback', 'Analytics', 'System'])
    .withMessage('Invalid target type'),
  query('severity')
    .optional({ values: 'falsy' })
    .isIn(['info', 'warning', 'error'])
    .withMessage('Invalid severity'),
  query('actor')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Actor filter cannot be empty'),
  query('hasNote')
    .optional()
    .isIn(['all', 'with-note', 'without-note'])
    .withMessage('hasNote must be all, with-note, or without-note'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'action', 'severity', 'targetType'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc')
];

export const validateCategoryParams = [
  param('category')
    .trim()
    .notEmpty()
    .withMessage('Category parameter is required')
    .custom(async (value) => {
      const category = await Category.findOne({ 
        name: { $regex: new RegExp(`^${value}$`, 'i') },
        isActive: true 
      });
      if (!category) {
        throw new Error('Invalid category');
      }
      return true;
    })
];

// =============================================================================
// 🔄 ERROR HANDLING MIDDLEWARE FOR VALIDATION
// =============================================================================

/**
 * Middleware to handle validation errors from express-validator
 * Must be placed after validation rules in routes
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

// Add to existing validate.js exports

export const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be 2-50 characters')
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage('Category name can only contain letters, numbers, and spaces'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('icon')
    .optional()
    .isIn(['MessageSquare', 'Shield', 'Brain', 'BarChart3', 'Users', 'AlertTriangle', 'CheckCircle', 'Settings', 'Home', 'Briefcase', 'Heart', 'Star'])
    .withMessage('Invalid icon value'),
  body('color')
    .optional()
    .isIn(['indigo', 'blue', 'green', 'red', 'orange', 'purple', 'pink', 'yellow', 'teal'])
    .withMessage('Invalid color value'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Add to existing exports at the bottom of validate.js

export const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('role')
    .optional()
    .isIn(['member', 'moderator', 'admin'])
    .withMessage('Role must be member, moderator, or admin'),
  body('organization')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Organization cannot be empty'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];


validateRegister.push(handleValidationErrors);
validateLogin.push(handleValidationErrors);
validateUpdateProfile.push(handleValidationErrors);
validateChangePassword.push(handleValidationErrors);
validateForgotPassword.push(handleValidationErrors);
validateResetPassword.push(handleValidationErrors);
validateCreateFeedback.push(handleValidationErrors);
validateUpdateFeedback.push(handleValidationErrors);
validateFeedbackQuery.push(handleValidationErrors);
validateAnalyticsQuery.push(handleValidationErrors);
validateCategoryParams.push(handleValidationErrors);
