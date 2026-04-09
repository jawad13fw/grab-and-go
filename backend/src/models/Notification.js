import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const notificationSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `not-${nanoid(12)}`,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['order_update', 'delivery', 'promotion', 'system', 'chat', 'payment'],
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  data: {
    orderId: String,
    shopId: String,
    riderId: String,
    screen: String,
    actionUrl: String,
    imageUrl: String
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  pushSent: {
    type: Boolean,
    default: false
  },
  pushDelivered: {
    type: Boolean,
    default: false
  },
  pushDeliveredAt: Date,
  emailSent: {
    type: Boolean,
    default: false
  },
  smsSent: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // TTL index - auto delete after 30 days

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, isRead: false });
};

// Static method to create order update notification
notificationSchema.statics.createOrderNotification = async function(order, type, title, message) {
  const notificationTypes = {
    placed: { title: 'Order Placed', message: `Your order #${order.orderNumber} has been placed successfully.` },
    confirmed: { title: 'Order Confirmed', message: `Your order #${order.orderNumber} has been confirmed by the shop.` },
    preparing: { title: 'Preparing Order', message: `Your order #${order.orderNumber} is being prepared.` },
    ready: { title: 'Order Ready', message: `Your order #${order.orderNumber} is ready for pickup.` },
    picked_up: { title: 'Order Picked Up', message: `Your order #${order.orderNumber} has been picked up by the rider.` },
    delivering: { title: 'Out for Delivery', message: `Your order #${order.orderNumber} is on the way!` },
    delivered: { title: 'Order Delivered', message: `Your order #${order.orderNumber} has been delivered. Enjoy!` },
    cancelled: { title: 'Order Cancelled', message: `Your order #${order.orderNumber} has been cancelled.` }
  };

  const notificationData = notificationTypes[type] || { title, message };

  return await this.create({
    userId: order.userId,
    type: 'order_update',
    title: notificationData.title,
    message: notificationData.message,
    data: {
      orderId: order.id,
      shopId: order.shopId,
      screen: 'OrderTracking',
      imageUrl: order.shopImage
    },
    priority: type === 'cancelled' ? 'high' : 'normal'
  });
};

export const Notification = mongoose.model('Notification', notificationSchema);
