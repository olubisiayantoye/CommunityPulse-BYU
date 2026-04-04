import rateLimit from 'express-rate-limit';

const createLimiter = ({
  windowMs,
  max,
  message,
  keyGenerator
}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    message: {
      success: false,
      message
    }
  });

export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests, please try again shortly.'
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyGenerator: (req) => req.ip
});

export const feedbackSubmissionLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many feedback submissions. Please try again later.',
  keyGenerator: (req) => req.ip
});

export default {
  apiLimiter,
  authLimiter,
  feedbackSubmissionLimiter
};
