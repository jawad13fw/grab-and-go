import { body, param, query, validationResult } from 'express-validator';

// Field-specific hints for common validation failures
const FIELD_HINTS = {
  email: 'Enter a valid email address like name@example.com',
  password: 'Use at least 8 characters with uppercase, lowercase, and a number (e.g. MyPass123)',
  name: 'Use 2–50 characters with letters and spaces only',
  phone: 'Enter a phone number like +92 300 1234567',
  address: 'Enter your full street address (5–200 characters)',
  quantity: 'Enter a whole number of 1 or more',
  code: 'Enter the promo code in UPPERCASE letters and numbers (e.g. SAVE20)',
  cardHolder: 'Enter the name exactly as it appears on your card',
  cardNumber: 'Enter all 13–19 digits of your card number without spaces',
  expiry: 'Use MM/YY format (e.g. 03/26)',
  cvc: 'Enter the 3 or 4-digit code on the back of your card',
  shopRating: 'Choose a rating between 1 (worst) and 5 (best)',
  riderRating: 'Choose a rating between 1 (worst) and 5 (best)',
  role: 'Choose one of: Customer, Vendor, or Rider',
  token: 'The reset token from your email is required',
  label: 'Choose Home, Work, or Other',
  'coordinates.lat': 'Latitude must be between -90 and 90',
  'coordinates.lng': 'Longitude must be between -180 and 180',
};

// Helper to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value !== undefined ? err.value : undefined,
      hint: FIELD_HINTS[err.path] || `Please enter a valid ${err.path}`,
    }));

    // Build a concise summary for the top-level message
    const summary = fieldErrors.map(e => `${formatFieldName(e.field)}: ${e.message}`).join('. ');

    return res.status(400).json({
      success: false,
      error: {
        status: 400,
        code: 'VALIDATION_ERROR',
        title: 'Please fix the errors below',
        message: summary,
        hint: 'Check the highlighted fields and correct the errors before trying again.',
        errors: fieldErrors,
        timestamp: new Date().toISOString(),
      },
      // Backward-compatible flat message
      message: summary,
      errors: fieldErrors,
    });
  }
  next();
};

// Convert field paths like "coordinates.lat" → "Latitude" or "shopRating" → "Shop rating"
const formatFieldName = (field) => {
  const overrides = {
    'coordinates.lat': 'Latitude',
    'coordinates.lng': 'Longitude',
    'shopRating': 'Shop rating',
    'riderRating': 'Rider rating',
    'shopReview.comment': 'Shop review comment',
    'riderReview.comment': 'Rider review comment',
    'cardHolder': 'Card holder name',
    'cardNumber': 'Card number',
    'cvc': 'CVC',
  };
  if (overrides[field]) return overrides[field];
  // camelCase → Title Case
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
};

// Auth validation
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .optional()
    .customSanitizer(value => value ? value.toLowerCase() : value)
    .isIn(['customer', 'vendor', 'rider']).withMessage('Invalid role'),
  handleValidationErrors
];

const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  handleValidationErrors
];

const validateResetPassword = [
  body('token')
    .notEmpty().withMessage('Token is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

// Order validation
const validateCreateOrder = [
  body('shopId')
    .optional()
    .notEmpty().withMessage('Shop ID is required'),
  body('items')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one item is required'),
  body('products')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one product is required'),
  body('paymentMethod')
    .optional()
    .isIn(['card', 'cash', 'wallet', 'cod']).withMessage('Invalid payment method'),
  handleValidationErrors
];

const validateOrderId = [
  param('id')
    .notEmpty().withMessage('Order ID is required'),
  handleValidationErrors
];

const validateCancelOrder = [
  param('id')
    .notEmpty().withMessage('Order ID is required'),
  body('reason')
    .notEmpty().withMessage('Cancellation reason is required')
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters'),
  handleValidationErrors
];

// Cart validation
const validateAddToCart = [
  body('productId')
    .notEmpty().withMessage('Product ID is required'),
  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('selectedVariants')
    .optional()
    .isArray().withMessage('Variants must be an array'),
  handleValidationErrors
];

const validateUpdateCartItem = [
  param('productId')
    .notEmpty().withMessage('Product ID is required'),
  body('quantity')
    .isInt({ min: 0 }).withMessage('Quantity must be 0 or greater'),
  handleValidationErrors
];

const validateApplyPromo = [
  body('code')
    .notEmpty().withMessage('Promo code is required')
    .isLength({ min: 3, max: 20 }).withMessage('Promo code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9]+$/).withMessage('Promo code must be uppercase alphanumeric'),
  handleValidationErrors
];

// Review validation
const validateCreateReview = [
  param('orderId')
    .notEmpty().withMessage('Order ID is required'),
  body('shopRating')
    .isInt({ min: 1, max: 5 }).withMessage('Shop rating must be between 1 and 5'),
  body('riderRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rider rating must be between 1 and 5'),
  body('shopReview.comment')
    .optional()
    .isLength({ max: 1000 }).withMessage('Comment must not exceed 1000 characters'),
  body('riderReview.comment')
    .optional()
    .isLength({ max: 1000 }).withMessage('Comment must not exceed 1000 characters'),
  handleValidationErrors
];

// User validation
const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/).withMessage('Invalid phone number format'),
  handleValidationErrors
];

const validateAddAddress = [
  body('label')
    .optional()
    .isIn(['Home', 'Work', 'Other']).withMessage('Invalid label'),
  body('address')
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 5, max: 200 }).withMessage('Address must be between 5 and 200 characters'),
  body('coordinates.lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('coordinates.lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('instructions')
    .optional()
    .isLength({ max: 500 }).withMessage('Instructions must not exceed 500 characters'),
  handleValidationErrors
];

// Shop validation
const validateShopId = [
  param('id')
    .notEmpty().withMessage('Shop ID is required'),
  handleValidationErrors
];

const validateProductId = [
  param('id')
    .notEmpty().withMessage('Product ID is required'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

export {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validateForgotPassword,
  validateResetPassword,
  validateCreateOrder,
  validateOrderId,
  validateCancelOrder,
  validateAddToCart,
  validateUpdateCartItem,
  validateApplyPromo,
  validateCreateReview,
  validateUpdateProfile,
  validateAddAddress,
  validateShopId,
  validateProductId,
  validatePagination
};
