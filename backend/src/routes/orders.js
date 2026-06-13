import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Order, Product, Shop, Rider } from '../models/index.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validateCreateOrder, validateOrderId, validatePagination } from '../middleware/validation.js';
import { orderLimiter } from '../middleware/rateLimiter.js';
import { processRefund, calculatePartialRefund } from '../services/refunds.js';
import { ensureRiderProfileForUser, findPrimaryRiderProfile } from '../services/riderProfiles.js';
import { validateOrderStatusUpdate, applyOrderStatusTimestamp } from '../services/orderStatusRules.js';

const router = Router();

async function reserveStock(products) {
  const reservations = [];

  for (const productData of products) {
    const updated = await Product.findOneAndUpdate(
      {
        id: productData.productId,
        stock: { $gte: productData.quantity }
      },
      { $inc: { stock: -productData.quantity } },
      { new: true }
    );

    if (!updated) {
      throw new Error(`Insufficient stock for product ${productData.productId}`);
    }

    reservations.push(productData);
  }

  return reservations;
}

async function rollbackStock(reservations) {
  if (!reservations?.length) return;

  await Promise.all(
    reservations.map((reservation) =>
      Product.updateOne(
        { id: reservation.productId },
        { $inc: { stock: reservation.quantity } }
      )
    )
  );
}

router.get('/', authMiddleware, validatePagination, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    let query = {};
    if (req.user.role === 'Customer') query.userId = req.user.id;
    if (req.user.role === 'Vendor') {
      // Find all shops owned by this vendor
      const shops = await Shop.find({ vendorId: req.user.id });
      if (shops.length > 0) {
        // Query orders from all shops owned by this vendor
        query.shopId = { $in: shops.map(s => s.id) };
      } else {
        // If vendor has no shops, return empty result
        query.shopId = { $in: [] };
      }
    }
    if (req.user.role === 'Rider') {
      const rider = await findPrimaryRiderProfile(req.user.id) || await Rider.findOne({ id: req.user.riderId });
      if (rider) query.riderId = rider.id;
      else query.riderId = null;
    }
    if (status && status !== 'All') query.status = status;
    
    // Get total count for pagination metadata
    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get paginated results
    const orders = await Order.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ placedAt: -1 });
    
    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'We couldn\'t load your orders right now. Please try again in a moment.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Failed to load orders', message: err.message, hint: 'Try refreshing the page. If the problem continues, please contact support.' } });
  }
});

router.get('/:id', authMiddleware, validateOrderId, async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'We couldn\'t find this order. It may have been removed or the order ID is incorrect.', error: { status: 404, code: 'NOT_FOUND', title: 'Order not found', message: 'We couldn\'t find this order.', hint: 'Double-check the order ID. If you placed it recently, try refreshing the page.' } });
    
    // Check if user has permission to view this order
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let hasPermission = false;
    
    if (userRole === 'Admin') {
      // Admins can view any order
      hasPermission = true;
    } else if (userRole === 'Customer' && order.userId === userId) {
      // Customers can view their own orders
      hasPermission = true;
    } else if (userRole === 'Rider') {
      // Riders can view orders they're assigned to
      const rider = await findPrimaryRiderProfile(userId);
      if (rider && order.riderId === rider.id) {
        hasPermission = true;
      }
    } else if (userRole === 'Vendor') {
      // Vendors can view orders from their shops only
      const shops = await Shop.find({ vendorId: userId });
      const shopIds = shops.map(s => s.id);
      if (shopIds.includes(order.shopId)) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'You don\'t have permission to view this order. You can only see orders that belong to you.', error: { status: 403, code: 'FORBIDDEN', title: 'Access denied', message: 'You don\'t have permission to view this order.', hint: 'Make sure you\'re logged in with the correct account. This order may belong to a different user.' } });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, validateCreateOrder, orderLimiter, async (req, res) => {
  let reservedStock = [];

  try {
    const { customer, products: items, total, shopId, specialInstructions, isEmergency, paymentMethod } = req.body;
    const products = items?.map((i) => ({ productId: i.id, quantity: i.quantity || 1 })) || [];
    let calculatedTotal = Number(total) || 0;
    if (products.length) {
      const productIds = products.map(p => p.productId);
      const prods = await Product.find({ id: { $in: productIds } });
      calculatedTotal = products.reduce((s, p) => {
        const prod = prods.find((x) => x.id === p.productId);
        return s + (prod?.price || 0) * (p.quantity || 1);
      }, 0);
    }
    let resolvedShopId = shopId;
    if (!resolvedShopId && products[0]) {
      const firstProduct = await Product.findOne({ id: products[0].productId });
      resolvedShopId = firstProduct?.shopId;
    }
    
    // Determine payment status based on payment method
    const payMethod = paymentMethod || 'card';

    if (payMethod === 'card' || payMethod === 'jazzcash') {
      return res.status(400).json({
        success: false,
        message: 'Online payments must be created through the secure checkout flow.'
      });
    }

    // Reserve stock using atomic conditional updates to prevent overselling.
    if (products.length) {
      reservedStock = await reserveStock(products);
    }
    
    // Add emergency fee if applicable (in PKR)
    const emergencyFee = isEmergency ? 150 : 0;
    const finalTotal = calculatedTotal + emergencyFee;
    
    const paymentStatus = 'pending';
    const paymentMessage = payMethod === 'cod' 
      ? 'Order placed successfully. Pay on delivery.' 
      : 'Order placed successfully. Payment is pending.';
    
    const order = new Order({
      id: `order-${nanoid(10)}`,
      orderNumber: `ORD-${Math.floor(Math.random() * 100000)}`,
      userId: req.user.id,
      customer: { 
        name: customer?.name || req.user.name, 
        phone: customer?.phone || '', 
        email: req.user.email 
      },
      items: products.map(p => ({ 
        productId: p.productId, 
        name: items.find(i => i.id === p.productId)?.name || 'Item',
        price: items.find(i => i.id === p.productId)?.price || 0,
        quantity: p.quantity,
        totalPrice: (items.find(i => i.id === p.productId)?.price || 0) * p.quantity
      })),
      pricing: {
        subtotal: calculatedTotal,
        deliveryFee: 0,
        tax: 0,
        emergencyFee: emergencyFee,
        total: finalTotal
      },
      total: finalTotal,
      shopId: resolvedShopId,
      deliveryAddress: {
        address: customer?.address || ''
      },
      status: 'pending',
      placedAt: new Date(),
      specialInstructions: specialInstructions || '',
      isEmergency: !!isEmergency,
      payment: {
        method: payMethod,
        status: paymentStatus
      }
    });
    await order.save();
    res.json({
      success: true,
      message: paymentMessage,
      payload: { orderId: order.id, total: finalTotal, paymentMethod: payMethod },
      order,
    });
  } catch (err) {
    await rollbackStock(reservedStock);
    const statusCode = err.message.includes('Insufficient stock') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  }
});

router.patch('/:id/status', authMiddleware, validateOrderId, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found. It may have been deleted or the ID is incorrect.', error: { status: 404, code: 'NOT_FOUND', title: 'Order not found', message: 'Order not found.', hint: 'Check the order ID and try again.' } });
    
    // Check if user has permission to update this order's status
    const userRole = req.user.role;
    const userId = req.user.id;
    
    // Determine if user has permission to update this order
    let hasPermission = false;
    
    if (userRole === 'Admin') {
      // Admins can update any order
      hasPermission = true;
    } else if (userRole === 'Rider') {
      // Riders can only update orders they're assigned to
      const rider = await findPrimaryRiderProfile(userId);
      if (rider && order.riderId === rider.id) {
        hasPermission = true;
      }
    } else if (userRole === 'Vendor') {
      // Vendors can only update orders from shops they own
      const shops = await Shop.find({ vendorId: userId });
      const shopIds = shops.map(s => s.id);
      if (shopIds.includes(order.shopId)) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'You don\'t have permission to update this order. Only the assigned rider, shop owner, or admin can change order status.', error: { status: 403, code: 'FORBIDDEN', title: 'Cannot update order', hint: 'Make sure you\'re logged in with the correct account.' } });
    }

    const validation = validateOrderStatusUpdate({
      currentStatus: order.status,
      nextStatus: status,
      userRole,
      allowCancelled: false
    });

    if (!validation.valid) {
      const responseStatus = validation.code === 'ROLE_STATUS_NOT_ALLOWED' ? 403 : 400;
      return res.status(responseStatus).json({
        success: false,
        message: validation.message,
        error: {
          status: responseStatus,
          code: validation.code,
          title: 'Invalid order status update',
          hint: validation.code === 'CANCEL_VIA_ENDPOINT_ONLY'
            ? 'Use the cancel endpoint to cancel this order.'
            : 'Send a valid next lifecycle status for this order.'
        }
      });
    }

    order.status = validation.status;
    applyOrderStatusTimestamp(order, validation.status);

    const historyUpdatedBy = `${userRole}:${userId}`;
    const lastHistoryEntry = order.statusHistory?.[order.statusHistory.length - 1];
    if (!lastHistoryEntry || lastHistoryEntry.status !== validation.status || lastHistoryEntry.updatedBy !== historyUpdatedBy) {
      order.statusHistory.push({
        status: validation.status,
        timestamp: new Date(),
        updatedBy: historyUpdatedBy
      });
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order status. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Update failed', hint: 'Try again in a moment. If the problem persists, contact support.' } });
  }
});

router.post('/:id/accept', authMiddleware, requireRole('Rider'), validateOrderId, async (req, res) => {
  try {
    const rider = await ensureRiderProfileForUser(req.user);
    const riderId = rider.id;
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'This order no longer exists or has already been removed.', error: { status: 404, code: 'NOT_FOUND', title: 'Order not found', hint: 'The order may have been cancelled. Refresh available orders to see the latest.' } });

    if (order.riderId && order.riderId !== riderId) return res.status(400).json({ success: false, message: 'This order has already been accepted by another rider. Please choose a different order.', error: { status: 400, code: 'ALREADY_ASSIGNED', title: 'Order already taken', hint: 'Refresh the available orders list to see new orders.' } });

    order.riderId = riderId;
    order.rider = {
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      vehicleType: rider.vehicle?.vehicleType || 'bike',
      vehicleNumber: rider.vehicle?.plateNumber || '',
      rating: rider.rating || 0
    };

    if (['pending', 'assigned', 'confirmed'].includes(order.status)) {
      order.status = 'confirmed';
    }

    if (!order.statusHistory?.some((entry) => entry.status === 'confirmed' && entry.updatedBy === `Rider:${req.user.id}`)) {
      order.statusHistory.push({
        status: order.status,
        timestamp: new Date(),
        note: `Accepted by rider ${rider.name}`,
        updatedBy: `Rider:${req.user.id}`
      });
    }

    await order.save();

    rider.currentOrderId = order.id;
    rider.status = 'busy';
    await rider.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to accept order. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Accept failed', hint: 'Try again in a moment.' } });
  }
});
router.post('/:id/cancel', authMiddleware, validateOrderId, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ id: req.params.id });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'This order could not be found. It may have already been removed.', error: { status: 404, code: 'NOT_FOUND', title: 'Order not found', hint: 'Refresh your orders list to see the latest status.' } });
    }
    
    // Check if user has permission to cancel
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let canCancel = false;
    if (userRole === 'Admin') {
      canCancel = true;
    } else if (userRole === 'Customer' && order.userId === userId) {
      // Customers can only cancel pending/confirmed orders
      if (['pending', 'confirmed'].includes(order.status)) {
        canCancel = true;
      }
    }
    
    if (!canCancel) {
      const statusMsg = !['pending', 'confirmed'].includes(order.status)
        ? `This order is already "${order.status}" and can no longer be cancelled.`
        : 'You don\'t have permission to cancel this order.';
      return res.status(403).json({
        success: false,
        message: statusMsg,
        error: {
          status: 403,
          code: 'CANCEL_NOT_ALLOWED',
          title: 'Cannot cancel order',
          message: statusMsg,
          hint: order.status === 'delivering'
            ? 'Your order is already on its way. Contact support if you need help.'
            : 'Orders can only be cancelled while they are still pending or confirmed.',
        },
      });
    }
    
    // Calculate refund amount based on order status
    const refundAmount = calculatePartialRefund(order);
    
    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellation = {
      reason: reason || 'Cancelled by customer',
      cancelledBy: userRole.toLowerCase(),
      refundStatus: order.payment.status === 'completed' ? 'pending' : 'not_applicable',
      refundAmount: refundAmount
    };
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason || 'Cancelled by customer',
      updatedBy: `${userRole}:${userId}`
    });
    
    await order.save();
    
    // If payment was completed, trigger refund process
    if (order.payment.status === 'completed' && refundAmount > 0) {
      // Process refund asynchronously
      setImmediate(async () => {
        const refundResult = await processRefund(order.id, reason, refundAmount);
        if (!refundResult.success) {
          console.error(`Refund failed for order ${order.id}:`, refundResult.message);
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: order.id,
        status: order.status,
        cancellation: order.cancellation
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel the order. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Cancellation failed', hint: 'Try again in a moment. If the problem persists, contact support.' } });
  }
});

export default router;
