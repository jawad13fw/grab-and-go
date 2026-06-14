import { AuditLog } from '../models/index.js';

/**
 * Record an audit log entry.
 * Safe to call without awaiting — errors are logged but never thrown.
 *
 * @param {Object} opts
 * @param {string} opts.type        - user_action | order_action | payment_action | settings_action | login | support_action | content_action
 * @param {string} opts.action      - e.g. 'update_settings', 'delete_user', 'refund_order'
 * @param {string} [opts.entityType] - e.g. 'User', 'Order', 'Settings'
 * @param {string} [opts.entityId]
 * @param {string} [opts.adminId]   - the admin who performed the action
 * @param {string} [opts.userId]
 * @param {string} [opts.orderId]
 * @param {string} [opts.shopId]
 * @param {string} [opts.ticketId]
 * @param {string} [opts.requestId]
 * @param {string} [opts.newStatus]
 * @param {string} [opts.ip]
 * @param {Object} [opts.details]   - any extra data
 * @param {string} [opts.ipAddress]
 * @param {string} [opts.userAgent]
 */
export const createAuditLog = async (opts) => {
  try {
    const entry = new AuditLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...opts,
      timestamp: new Date(),
    });
    await entry.save();
  } catch (err) {
    // Audit logging should never break business logic
    console.error('[AuditLog] Failed to record:', err.message);
  }
};

/**
 * Express middleware that automatically logs admin write operations.
 * Attach after the route handler with: router.use(auditMiddleware)
 * Only logs POST/PATCH/PUT/DELETE requests.
 */
export const auditMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    // Only log successful write operations
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && res.statusCode < 400) {
      const type = mapRouteToType(req.path);
      const action = `${req.method.toLowerCase()}_${req.path.replace(/^\//, '').replace(/\//g, '_')}`;

      createAuditLog({
        type,
        action,
        adminId: req.user?.id || 'system',
        entityType: type.replace('_action', ''),
        ip: req.ip,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: { method: req.method, path: req.path, body: sanitizeBody(req.body) },
      });
    }

    return originalJson(body);
  };

  next();
};

const mapRouteToType = (path) => {
  if (path.includes('settings')) return 'settings_action';
  if (path.includes('content')) return 'content_action';
  if (path.includes('tickets') || path.includes('support')) return 'support_action';
  if (path.includes('refund') || path.includes('payment')) return 'payment_action';
  if (path.includes('order') || path.includes('assign')) return 'order_action';
  if (path.includes('user')) return 'user_action';
  if (path.includes('login')) return 'login';
  return 'user_action';
};

const sanitizeBody = (body) => {
  if (!body) return {};
  const clean = { ...body };
  // Remove sensitive fields
  delete clean.password;
  delete clean.passwordHash;
  delete clean.token;
  delete clean.secretKey;
  return clean;
};
