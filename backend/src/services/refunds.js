import Stripe from 'stripe';
import { Order, User } from '../models/index.js';
import { config } from '../config/config.js';

const stripe = config.STRIPE_SECRET_KEY ? new Stripe(config.STRIPE_SECRET_KEY) : null;

/**
 * Process refund for a cancelled order
 * @param {string} orderId - Order ID
 * @param {string} reason - Refund reason
 * @param {number} amount - Refund amount (optional, defaults to full order total)
 * @returns {Promise<Object>} Refund result
 */
export async function processRefund(orderId, reason = 'Order cancelled', amount = null) {
  try {
    const order = await Order.findOne({ id: orderId });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.status !== 'cancelled') {
      throw new Error('Only cancelled orders can be refunded');
    }
    
    if (!order.cancellation) {
      throw new Error('Order cancellation data not found');
    }
    
    if (order.cancellation.refundStatus === 'completed') {
      return { success: false, message: 'Order already refunded' };
    }
    
    const refundAmount = amount || order.total;
    const paymentMethod = order.payment.method;
    
    // Update refund status to processing
    order.cancellation.refundStatus = 'processing';
    order.cancellation.refundAmount = refundAmount;
    await order.save();
    
    let refundResult = null;
    
    // Process refund based on payment method
    switch (paymentMethod) {
      case 'card':
        if (!stripe) {
          throw new Error('Stripe not configured');
        }
        
        if (!order.payment.transactionId || !order.payment.transactionId.startsWith('pi_')) {
          throw new Error('Invalid payment transaction ID for card refund');
        }
        
        try {
          // Create refund in Stripe
          const refund = await stripe.refunds.create({
            payment_intent: order.payment.transactionId,
            amount: Math.round(refundAmount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              refundReason: reason
            }
          });
          
          refundResult = {
            refundId: refund.id,
            status: refund.status,
            amount: refund.amount / 100,
            method: 'stripe'
          };
          
          console.log(`💳 Stripe refund created: ${refund.id} for order ${order.orderNumber}`);
        } catch (stripeErr) {
          console.error('Stripe refund error:', stripeErr);
          order.cancellation.refundStatus = 'failed';
          await order.save();
          throw new Error(`Stripe refund failed: ${stripeErr.message}`);
        }
        break;
      
      case 'wallet':
      case 'upi':
        // Refund to user wallet
        const user = await User.findOne({ id: order.userId });
        if (!user) {
          throw new Error('User not found for wallet refund');
        }

        if (!user.wallet) {
          user.wallet = { balance: 0, currency: 'PKR' };
        }
        
        user.wallet.balance += refundAmount;
        await user.save();
        
        refundResult = {
          refundId: `${paymentMethod}_refund_${Date.now()}`,
          status: 'succeeded',
          amount: refundAmount,
          method: paymentMethod === 'upi' ? 'wallet_fallback' : 'wallet',
          newBalance: user.wallet.balance
        };
        
        console.log(`💰 ${paymentMethod.toUpperCase()} refund credited to wallet: PKR ${refundAmount} to user ${user.email}`);
        break;
      
      case 'cod':
        // Cash on delivery - no refund needed
        refundResult = {
          refundId: 'cod_na',
          status: 'not_applicable',
          amount: 0,
          method: 'cod'
        };
        
        console.log(`💵 COD order cancelled - no refund needed: ${order.orderNumber}`);
        break;
      
      default:
        throw new Error(`Unsupported payment method for refund: ${paymentMethod}`);
    }
    
    // Update order with refund completion
    order.cancellation.refundStatus = refundResult.status === 'succeeded' || refundResult.status === 'not_applicable' 
      ? 'completed' 
      : 'failed';
    order.cancellation.refundId = refundResult.refundId;
    order.cancellation.refundedAt = new Date();
    await order.save();
    
    return {
      success: true,
      message: 'Refund processed successfully',
      refund: refundResult,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        refundStatus: order.cancellation.refundStatus
      }
    };
  } catch (err) {
    console.error('Refund processing error:', err);
    return {
      success: false,
      message: err.message
    };
  }
}

/**
 * Process pending refunds in batch
 * @returns {Promise<Object>} Batch refund result
 */
export async function processPendingRefunds() {
  try {
    const ordersNeedingRefund = await Order.find({
      status: 'cancelled',
      'cancellation.refundStatus': 'pending',
      'payment.status': 'completed'
    });
    
    const results = {
      total: ordersNeedingRefund.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (const order of ordersNeedingRefund) {
      const result = await processRefund(order.id, order.cancellation.reason || 'Order cancelled');
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({
          orderId: order.id,
          error: result.message
        });
      }
    }
    
    console.log(`💸 Batch refund complete: ${results.successful} successful, ${results.failed} failed`);
    
    return results;
  } catch (err) {
    console.error('Batch refund error:', err);
    return {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [{ error: err.message }]
    };
  }
}

/**
 * Calculate partial refund amount based on order status
 * @param {Object} order - Order document
 * @returns {number} Refund amount
 */
export function calculatePartialRefund(order) {
  const total = order.total;
  
  switch (order.status) {
    case 'pending':
    case 'confirmed':
      // Full refund before preparation
      return total;
    
    case 'preparing':
      // 80% refund during preparation
      return total * 0.8;
    
    case 'ready':
    case 'out_for_delivery':
      // 50% refund if already prepared/in transit
      return total * 0.5;
    
    case 'delivered':
      // No refund after delivery
      return 0;
    
    default:
      return total;
  }
}
