import rateLimit from 'express-rate-limit';

const isRateLimitDisabled =
  process.env.DISABLE_RATE_LIMIT === 'true' ||
  process.env.NODE_ENV !== 'production';

const shouldSkipRateLimit = () => isRateLimitDisabled;

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (generous for dev)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 auth attempts per windowMs (generous for dev)
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP, please try again after 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter for order creation
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 order requests per minute
  message: {
    success: false,
    message: 'Too many order requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many order requests, please slow down.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter for review creation
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 reviews per hour
  message: {
    success: false,
    message: 'Too many review submissions, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many review submissions, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter for cart operations
const cartLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 cart operations per minute
  message: {
    success: false,
    message: 'Too many cart operations, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many cart operations, please slow down.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

export {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  orderLimiter,
  reviewLimiter,
  cartLimiter
};
