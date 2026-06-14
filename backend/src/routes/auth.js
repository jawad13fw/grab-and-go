import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { User } from '../models/index.js';
import { validateLogin, validateRegister, validateForgotPassword, validateResetPassword } from '../middleware/validation.js';
import { config } from '../config/config.js';
import { createAuditLog } from '../utils/auditLogger.js';

const router = Router();

// Cookie options for JWT token
const COOKIE_OPTIONS = {
  httpOnly: true,                                   // JS can't read it
  secure: process.env.NODE_ENV === 'production',     // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-origin support
  maxAge: 7 * 24 * 60 * 60 * 1000,                  // 7 days in ms
  path: '/',
};

// SEED_PASSWORDS removed for security - use proper password hashes only

router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    const invalidCredentials = {
      success: false,
      message: 'Invalid email or password.'
    };

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json(invalidCredentials);
    }

    let isValidPassword = false;
    if (user.passwordHash) {
      isValidPassword = await bcrypt.compare(password || '', user.passwordHash);
    }

    if (!isValidPassword) {
      return res.status(401).json(invalidCredentials);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    const out = { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      orders: user.ordersCount ?? 0, 
      deliveries: user.deliveries 
    };

    res.cookie('token', token, COOKIE_OPTIONS);

    // Record login audit
    createAuditLog({
      type: 'login',
      action: 'user_login',
      userId: user.id,
      ip: req.ip,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { email: user.email, role: user.role },
    });

    return res.json({ success: true, user: out });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    
    // Validate role - only allow customer, vendor, or rider roles during registration
    const allowedRoles = ['customer', 'vendor', 'rider'];
    const rawRole = (role || 'customer').toLowerCase();
    
    if (!allowedRoles.includes(rawRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role for registration. Only customer, vendor, and rider roles are allowed.' });
    }
    // Capitalize first letter to match User model enum: 'Customer', 'Vendor', 'Rider'
    const userRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
    
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.json({ success: false, message: 'Email already registered' });
    }
    // Ensure password exists - validation should catch this but double-checking
    if (!password) {
      return res.json({ success: false, message: 'Password is required for registration' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({
      id: `user-${nanoid(8)}`,
      name: name || 'User',
      email: normalizedEmail,
      passwordHash,
      role: userRole, // Use validated role
      ordersCount: 0,
    });
    await newUser.save();
    
    // Send confirmation email
    await sendConfirmationEmail(newUser);
    
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    const out = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      orders: 0,
      deliveries: 0
    };
    res.cookie('token', token, COOKIE_OPTIONS);
    return res.json({ 
      success: true, 
      user: out, 
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Registration confirmation functionality
const sendConfirmationEmail = async (user) => {
  // In a real app, integrate with an email service like SendGrid, Nodemailer, etc.
  console.log(`Registration confirmation queued for user ${user.id} (${user.role})`);
  
  // This would typically include a verification token
  // await emailService.sendConfirmation(user.email, verificationToken);
};

// Forgot password route
router.post('/forgot-password', validateForgotPassword, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
    }
    
    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    
    // Store in user document
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();
    
    // In a real app, send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken);
    
    console.log(`Password reset requested for user ${user.id}`);
    
    res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset password route
router.post('/reset-password', validateResetPassword, async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const user = await User.findOne({ 
      passwordResetToken: token, 
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user
    user.passwordHash = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Logout route - clears the httpOnly cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', path: '/' });
  return res.json({ success: true, message: 'Logged out' });
});

// Check session route - verify if the current cookie is still valid
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const payload = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findOne({ id: payload.id });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orders: user.ordersCount ?? 0,
        deliveries: user.deliveries,
      }
    });
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

export default router;
