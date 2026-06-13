// Custom App Error class
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.details = details; // { field, hint, errors[] }

    Error.captureStackTrace(this, this.constructor);
  }
}

// Map of error codes to user-friendly info
const ERROR_CODE_MAP = {
  DIFFERENT_SHOP: {
    title: 'Items from another shop',
    hint: 'Your cart already has items from a different shop. Clear the cart first, then add items from this shop.',
  },
  INSUFFICIENT_STOCK: {
    title: 'Out of stock',
    hint: 'This product doesn\'t have enough stock for the requested quantity. Try reducing the quantity.',
  },
  INVALID_PROMO: {
    title: 'Invalid promo code',
    hint: 'Double-check the promo code for typos. Codes are case-sensitive and may have expired.',
  },
  PAYMENT_REQUIRED: {
    title: 'Payment incomplete',
    hint: 'Your payment was not completed. Please try again or choose a different payment method.',
  },
  AUTH_REQUIRED: {
    title: 'Login required',
    hint: 'You need to be logged in to perform this action. Please sign in and try again.',
  },
  FORBIDDEN: {
    title: 'Access denied',
    hint: 'You don\'t have permission to perform this action. Contact support if you believe this is an error.',
  },
  NOT_FOUND: {
    title: 'Not found',
    hint: 'The item you\'re looking for doesn\'t exist or has been removed.',
  },
  RATE_LIMITED: {
    title: 'Too many requests',
    hint: 'You\'re making requests too quickly. Please wait a moment and try again.',
  },
};

// Build a structured error response
const buildErrorResponse = (statusCode, message, { code, field, hint, errors, title } = {}) => {
  const mapped = code ? ERROR_CODE_MAP[code] : null;
  return {
    success: false,
    error: {
      status: statusCode,
      code: code || 'UNKNOWN_ERROR',
      title: title || mapped?.title || friendlyTitleForStatus(statusCode),
      message,
      hint: hint || mapped?.hint || null,
      field: field || null,
      errors: errors || null,
      timestamp: new Date().toISOString(),
    },
    // Keep backward-compatible flat "message" for existing frontend code
    message,
  };
};

// Human-readable title based on HTTP status
const friendlyTitleForStatus = (status) => {
  const titles = {
    400: 'Invalid request',
    401: 'Authentication required',
    403: 'Access denied',
    404: 'Not found',
    409: 'Conflict',
    422: 'Validation failed',
    429: 'Too many requests',
    500: 'Server error',
  };
  return titles[status] || 'Something went wrong';
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const fieldErrors = Object.entries(err.errors).map(([field, val]) => ({
      field,
      message: val.message,
      value: val.value,
      hint: getValidationHint(field, val),
    }));
    const summary = fieldErrors.map(e => e.message).join('. ');
    return res.status(400).json(
      buildErrorResponse(400, `Please fix the following: ${summary}`, {
        code: 'VALIDATION_ERROR',
        title: 'Validation failed',
        hint: 'Check the highlighted fields below and correct the errors.',
        errors: fieldErrors,
      })
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const friendlyField = field === 'email' ? 'email address' : field;
    return res.status(409).json(
      buildErrorResponse(409, `This ${friendlyField} is already registered. Please use a different one or log in to your existing account.`, {
        code: 'DUPLICATE_ENTRY',
        field,
        title: `${capitalize(friendlyField)} already taken`,
        hint: field === 'email'
          ? 'Try logging in instead, or use a different email address.'
          : `Choose a different ${friendlyField}.`,
      })
    );
  }

  // Mongoose cast error (invalid ID format)
  if (err.name === 'CastError') {
    const friendlyPath = err.path === '_id' ? 'ID' : err.path;
    return res.status(400).json(
      buildErrorResponse(400, `The ${friendlyPath} "${err.value}" is not valid. Please check the URL or request data.`, {
        code: 'INVALID_ID',
        field: err.path,
        title: 'Invalid identifier',
        hint: 'Make sure you\'re using the correct link. If you copied it, check for missing characters.',
      })
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      buildErrorResponse(401, 'Your session is invalid. Please log in again.', {
        code: 'INVALID_TOKEN',
        title: 'Session invalid',
        hint: 'Try logging out and logging back in. If this keeps happening, clear your browser cookies.',
      })
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      buildErrorResponse(401, 'Your session has expired. Please log in again to continue.', {
        code: 'TOKEN_EXPIRED',
        title: 'Session expired',
        hint: 'For security, sessions expire after some time. Simply log in again to continue.',
      })
    );
  }

  // Operational errors (trusted errors we threw intentionally)
  if (err.isOperational) {
    return res.status(err.statusCode).json(
      buildErrorResponse(err.statusCode, err.message, {
        code: err.code,
        ...(err.details || {}),
      })
    );
  }

  // Programming or unknown errors — don't leak details in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json(
      buildErrorResponse(500, 'Something unexpected went wrong. Please try again later or contact support if the problem persists.', {
        code: 'INTERNAL_ERROR',
        title: 'Unexpected error',
        hint: 'This is a problem on our end. Try refreshing the page. If it keeps happening, please contact support.',
      })
    );
  }

  // Development error response (includes stack trace)
  return res.status(500).json({
    ...buildErrorResponse(500, err.message, {
      code: 'INTERNAL_ERROR',
      title: 'Server error (dev)',
      hint: 'Check the server console for the full stack trace.',
    }),
    stack: err.stack,
  });
};

// Generate contextual hints for common validation fields
const getValidationHint = (field, error) => {
  const hints = {
    email: 'Enter a valid email like name@example.com',
    password: 'Use at least 8 characters with a mix of uppercase, lowercase, and numbers',
    name: 'Use 2-50 characters, letters and spaces only',
    phone: 'Enter a valid phone number like +92 300 1234567',
    address: 'Enter your full delivery address (5-200 characters)',
    quantity: 'Enter a number of 1 or more',
    rating: 'Choose a rating between 1 and 5',
    price: 'Enter a valid price greater than 0',
  };
  return hints[field] || `Please provide a valid ${field}`;
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Async handler wrapper to catch errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Not Found handler
const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Unhandled promise rejection handler
const handleUnhandledRejection = (server) => {
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    
    // Graceful shutdown
    server.close(() => {
      process.exit(1);
    });
  });
};

// Uncaught exception handler
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
  });
};

// MongoDB connection error handler
const handleDBConnectionError = (err) => {
  console.error('MongoDB Connection Error:', err.message);
  
  if (err.name === 'MongoNetworkError') {
    console.error('Network error - check your MongoDB connection string and network connectivity');
  }
  
  if (err.name === 'MongoServerError' && err.code === 18) {
    console.error('Authentication failed - check your MongoDB credentials');
  }
  
  process.exit(1);
};

export {
  AppError,
  errorHandler,
  asyncHandler,
  notFound,
  buildErrorResponse,
  handleUnhandledRejection,
  handleUncaughtException,
  handleDBConnectionError
};
