import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export function authMiddleware(req, res, next) {
  // 1. Try httpOnly cookie first
  let token = req.cookies?.token;

  // 2. Fall back to Authorization header (for mobile / Postman)
  if (!token) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      token = auth.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'You need to be logged in to do this. Please sign in and try again.',
      error: {
        status: 401,
        code: 'AUTH_REQUIRED',
        title: 'Login required',
        message: 'You need to be logged in to do this. Please sign in and try again.',
        hint: 'Click "Login" in the top menu, or create an account if you don\'t have one yet.',
      },
    });
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired or is invalid. Please log in again.',
      error: {
        status: 401,
        code: 'INVALID_TOKEN',
        title: 'Session expired',
        message: 'Your session has expired or is invalid. Please log in again.',
        hint: 'For security, sessions expire periodically. Simply log in again to continue where you left off.',
      },
    });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'You need to be logged in to access this page.',
        error: {
          status: 401,
          code: 'AUTH_REQUIRED',
          title: 'Login required',
          message: 'You need to be logged in to access this page.',
          hint: 'Please sign in first.',
        },
      });
    }
    if (!roles.includes(req.user.role)) {
      const allowedRoles = roles.join(' or ');
      return res.status(403).json({
        success: false,
        message: `This action is only available to ${allowedRoles} accounts. Your account is "${req.user.role}".`,
        error: {
          status: 403,
          code: 'FORBIDDEN',
          title: 'Access denied',
          message: `This action is only available to ${allowedRoles} accounts. Your account is "${req.user.role}".`,
          hint: `You are signed in as a ${req.user.role}. If you need a different role, please contact support or register a new account.`,
        },
      });
    }
    next();
  };
}
