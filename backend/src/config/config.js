import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Validate required environment variables
function validateEnv() {
  const required = ['JWT_SECRET', 'MONGODB_URI'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ FATAL: Missing required environment variables:');
      missing.forEach(key => console.error(`  - ${key}`));
      console.error('\nPlease set these variables in your environment or .env file.');
      process.exit(1);
    } else {
      console.warn('⚠️  WARNING: Missing environment variables (using defaults for development):');
      missing.forEach(key => console.warn(`  - ${key}`));
    }
  }
}

// Validate JWT secret strength
function validateJWTSecret(secret) {
  if (!secret) return false;
  
  // Check for common weak secrets
  const weakSecrets = [
    'dev_secret_change_me',
    'grabgo_secure_jwt_secret_change_me_in_production',
    'secret',
    'jwt_secret',
    'change_me'
  ];
  
  if (weakSecrets.includes(secret.toLowerCase())) {
    console.error('❌ FATAL: Weak JWT_SECRET detected!');
    console.error('Please use a strong, random secret. Generate one with:');
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  Continuing in development mode with weak secret...');
      return true;
    }
  }
  
  // Require minimum length
  if (secret.length < 32) {
    console.error('❌ JWT_SECRET is too short (minimum 32 characters)');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  
  return true;
}

// Validate on import
validateEnv();

// JWT Configuration
let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV !== 'production') {
  // Generate a secure random secret for development
  JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.warn('⚠️  Auto-generated JWT secret for development session');
  console.warn('   Add this to your .env file to persist across restarts:');
  console.warn('   JWT_SECRET=<redacted>');
}

validateJWTSecret(JWT_SECRET);

// Stripe Configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
if (!STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.error('❌ WARNING: STRIPE_SECRET_KEY not set in production');
}
if (!STRIPE_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ WARNING: STRIPE_WEBHOOK_SECRET not set in production');
}

// JazzCash Configuration (Hosted Checkout)
const JAZZCASH_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID;
const JAZZCASH_PASSWORD = process.env.JAZZCASH_PASSWORD;
const JAZZCASH_INTEGRITY_SALT = process.env.JAZZCASH_INTEGRITY_SALT;
const JAZZCASH_ENV = (process.env.JAZZCASH_ENV || 'sandbox').toLowerCase();
const JAZZCASH_GATEWAY_URL = process.env.JAZZCASH_GATEWAY_URL || (
  JAZZCASH_ENV === 'live'
    ? 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/'
    : 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/'
);
const JAZZCASH_TXN_TYPE = process.env.JAZZCASH_TXN_TYPE || 'MWALLET';
const JAZZCASH_CURRENCY = (process.env.JAZZCASH_CURRENCY || 'PKR').toUpperCase();

// Export configuration
export const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  
  // Security
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/grabandgo',
  
  // CORS
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  // Base URL for this API (used for upload URLs so frontend can display images)
  API_BASE_URL: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || '4000'}`,
  
  // Payment
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_CURRENCY: (process.env.STRIPE_CURRENCY || 'pkr').toLowerCase(),
  JAZZCASH_MERCHANT_ID,
  JAZZCASH_PASSWORD,
  JAZZCASH_INTEGRITY_SALT,
  JAZZCASH_ENV,
  JAZZCASH_GATEWAY_URL,
  JAZZCASH_TXN_TYPE,
  JAZZCASH_CURRENCY,
  JAZZCASH_RETURN_URL: process.env.JAZZCASH_RETURN_URL || `${process.env.API_BASE_URL || `http://localhost:${process.env.PORT || '4000'}`}/api/checkout/jazzcash/return`,
  
  // Images (frontend should mostly use URLs coming from the database)
  DEFAULT_PRODUCT_IMAGE_URL: process.env.DEFAULT_PRODUCT_IMAGE_URL || 'https://via.placeholder.com/300x200?text=Product',
  DEFAULT_SHOP_IMAGE_URL: process.env.DEFAULT_SHOP_IMAGE_URL || 'https://via.placeholder.com/300x200?text=Shop',
  DEFAULT_SHOP_BANNER_URL: process.env.DEFAULT_SHOP_BANNER_URL || 'https://via.placeholder.com/800x200?text=Shop+Banner',

  // Uploads (Multer)
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads'),
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '2', 10),
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

  // Features
  ENABLE_EMAIL: process.env.ENABLE_EMAIL === 'true',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@grabandgo.com',
  
  // Order settings
  ORDER_TIMEOUT_MINUTES: parseInt(process.env.ORDER_TIMEOUT_MINUTES || '30', 10),
  MAX_DELIVERY_DISTANCE_KM: parseInt(process.env.MAX_DELIVERY_DISTANCE_KM || '50', 10),
  ENABLE_AUTO_RIDER_ASSIGNMENT: process.env.ENABLE_AUTO_RIDER_ASSIGNMENT === 'true',
};

// Log configuration (excluding secrets)
if (process.env.NODE_ENV !== 'production') {
  console.log('📋 Configuration loaded:', {
    NODE_ENV: config.NODE_ENV,
    PORT: config.PORT,
    MONGODB_URI: config.MONGODB_URI.replace(/\/\/.*@/, '//***@'), // Hide credentials
    CLIENT_ORIGIN: config.CLIENT_ORIGIN,
    JWT_SECRET: '***' + config.JWT_SECRET.slice(-4), // Show last 4 chars only
    STRIPE_CONFIGURED: !!config.STRIPE_SECRET_KEY,
  });
}
