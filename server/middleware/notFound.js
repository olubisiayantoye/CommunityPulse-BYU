export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /api/health',
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
      'POST /api/feedback',
      'GET /api/feedback',
      'PUT /api/feedback/:id',
      'DELETE /api/feedback/:id',
      'POST /api/feedback/:id/upvote',
      'GET /api/analytics/dashboard',
      'GET /api/analytics/sentiment',
      'GET /api/analytics/export'
    ]
  });
};