import { Order } from '../models/index.js';
import { config } from '../config/config.js';

/**
 * Check for orders that have timed out and cancel them automatically
 * @param {Object} io - Socket.io instance for real-time notifications
 * @returns {Promise<Array>} Array of cancelled order IDs
 */
export async function checkTimedOutOrders(io = null) {
  const timeoutMinutes = config.ORDER_TIMEOUT_MINUTES || 30;
  const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
  
  try {
    // Find orders that are still pending and haven't been assigned a rider
    const timedOutOrders = await Order.find({
      status: 'pending',
      $or: [
        { riderId: { $exists: false } },
        { riderId: null },
        { riderId: '' }
      ],
      placedAt: { $lt: cutoffTime }
    });
    
    const cancelledIds = [];
    
    for (const order of timedOutOrders) {
      // Auto-cancel the order
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.cancellation = {
        reason: `Order timed out after ${timeoutMinutes} minutes with no rider assigned`,
        cancelledBy: 'system',
        refundStatus: order.payment.status === 'completed' ? 'pending' : 'not_applicable',
        refundAmount: order.payment.status === 'completed' ? order.total : 0
      };
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: `Auto-cancelled due to timeout (${timeoutMinutes} min)`,
        updatedBy: 'system'
      });
      
      await order.save();
      cancelledIds.push(order.id);
      
      // Emit real-time notification
      if (io) {
        io.to(`user:${order.userId}`).emit('order:cancelled', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          reason: order.cancellation.reason
        });
      }
      
      console.log(`⏱️  Order ${order.orderNumber} auto-cancelled due to timeout`);
    }
    
    return cancelledIds;
  } catch (err) {
    console.error('Error checking timed out orders:', err);
    return [];
  }
}

/**
 * Start periodic timeout checker
 * @param {Object} io - Socket.io instance
 * @param {number} intervalMinutes - How often to check (default: 5 minutes)
 * @returns {NodeJS.Timeout} Interval reference
 */
export function startTimeoutChecker(io = null, intervalMinutes = 5) {
  console.log(`🕐 Order timeout checker started (checking every ${intervalMinutes} minutes)`);
  
  // Run immediately on start
  checkTimedOutOrders(io);
  
  // Then run periodically
  const interval = setInterval(async () => {
    const cancelled = await checkTimedOutOrders(io);
    if (cancelled.length > 0) {
      console.log(`⏱️ Cancelled ${cancelled.length} timed-out orders`);
    }
  }, intervalMinutes * 60 * 1000);
  
  return interval;
}

/**
 * Check if an order is about to timeout and send warning
 * @param {string} orderId - Order ID
 * @param {Object} io - Socket.io instance
 * @returns {Promise<boolean>} True if warning sent
 */
export async function checkOrderTimeoutWarning(orderId, io = null) {
  try {
    const order = await Order.findOne({ id: orderId });
    if (!order || order.status !== 'pending' || order.riderId) {
      return false;
    }
    
    const timeoutMinutes = config.ORDER_TIMEOUT_MINUTES || 30;
    const warningMinutes = 5; // Warn 5 minutes before timeout
    const timeSincePlaced = (Date.now() - new Date(order.placedAt).getTime()) / 60000;
    const minutesUntilTimeout = timeoutMinutes - timeSincePlaced;
    
    if (minutesUntilTimeout > 0 && minutesUntilTimeout <= warningMinutes) {
      if (io) {
        io.to(`user:${order.userId}`).emit('order:timeout_warning', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          minutesRemaining: Math.ceil(minutesUntilTimeout)
        });
      }
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Error checking timeout warning:', err);
    return false;
  }
}
