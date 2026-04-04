import { body, query, param, validationResult } from 'express-validator';

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
  body('category')
    .optional()
    .isIn(['Facilities', 'Leadership', 'Safety', 'Events', 'Communication', 'Other'])
    .withMessage('Invalid category. Must be one of: Facilities, Leadership, Safety, Events, Communication, Other'),
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
    .isIn(['Facilities', 'Leadership', 'Safety', 'Events', 'Communication', 'Other'])
    .withMessage('Invalid category'),
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
    .optional()
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
    .withMessage('Format must be csv or json')
];

export const validateCategoryParams = [
  param('category')
    .trim()
    .isIn(['Facilities', 'Leadership', 'Safety', 'Events', 'Communication', 'Other'])
    .withMessage('Invalid category parameter')
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
