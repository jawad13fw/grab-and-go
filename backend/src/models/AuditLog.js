import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: {
    type: String,
    required: true,
    enum: [
      'user_action', 'order_action', 'payment_action',
      'settings_action', 'login', 'support_action', 'content_action'
    ],
    index: true
  },
  action: { type: String, required: true },
  entityType: { type: String },
  entityId: { type: String },
  adminId: { type: String },
  userId: { type: String, index: true },
  orderId: { type: String },
  shopId: { type: String },
  ticketId: { type: String },
  requestId: { type: String },
  newStatus: { type: String },
  ip: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
