import { Router } from 'express';
import Stripe from 'stripe';
import { Order, Product, Cart, PromoCode } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateCreateOrder } from '../middleware/validation.js';
import { nanoid } from 'nanoid';
import { config } from '../config/config.js';
import { autoAssignRider } from '../services/riderAssignment.js';

const router = Router();
const stripe = config.STRIPE_SECRET_KEY ? new Stripe(config.STRIPE_SECRET_KEY) : null;
const MINOR_UNIT_MULTIPLIER = 100;
const EMERGENCY_FEE = 150;

function toMinorUnits(amount) {
  return Math.round(Number(amount) * MINOR_UNIT_MULTIPLIER);
}

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

// Stripe webhook handler (expects raw request body configured at app level).
router.post('/webhook', async (req, res) => {
  if (!stripe || !config.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, message: 'Stripe webhook is not configured.' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing Stripe signature header.' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, config.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await Order.findOneAndUpdate(
          {
            $or: [
              { 'payment.transactionId': paymentIntent.id },
              { id: paymentIntent.metadata?.orderId }
            ]
          },
          {
            $set: {
              'payment.status': 'completed',
              'payment.paidAt': new Date()
            }
          }
        );
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await Order.findOneAndUpdate(
          {
            $or: [
              { 'payment.transactionId': paymentIntent.id },
              { id: paymentIntent.metadata?.orderId }
            ]
          },
          {
            $set: {
              'payment.status': 'failed'
            }
          }
        );
        break;
      }
      default:
        break;
    }

    return res.json({ received: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});


// All routes below require authentication.
router.use(authMiddleware);


// Step 1: Create payment intent (card checkout).
router.post('/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Card payments are unavailable. Stripe is not configured.'
      });
    }

    const { amount, orderId } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: toMinorUnits(amount),
      currency: config.STRIPE_CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: req.user.id,
        orderRef: orderId || `pending-${nanoid(10)}`
      }
    });

    return res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create payment intent' });
  }
});

// Step 2: Confirm order (after payment confirmation or for COD).
router.post('/', validateCreateOrder, async (req, res) => {
  let reservedStock = [];
  let verifiedPaymentIntentId = null;

  try {
    const {
      items,
      amount,
      customer,
      shopId,
      specialInstructions,
      isEmergency,
      paymentMethod = 'cod',
      paymentIntentId,
      promoCode
    } = req.body;



    const products = items?.map((i) => ({ productId: i.id, quantity: i.quantity || 1 })) || [];

    // Calculate actual total from products.
    let productSubtotal = 0;
    if (products.length) {
      const productIds = products.map((p) => p.productId);
      const prods = await Product.find({ id: { $in: productIds } });
      productSubtotal = products.reduce((sum, p) => {
        const prod = prods.find((x) => x.id === p.productId);
        return sum + (prod?.price || 0) * (p.quantity || 1);
      }, 0);
    }

    // Use delivery fee from request (frontend cart), fallback to 0
    const requestDeliveryFee = Number(req.body.deliveryFee) || 0;
    const requestTax = Number(req.body.tax) || 0;

    // Resolve shop ID.
    let resolvedShopId = shopId;
    if (!resolvedShopId && products[0]) {
      const firstProduct = await Product.findOne({ id: products[0].productId });
      resolvedShopId = firstProduct?.shopId;
    }

    // Add emergency fee if applicable.
    const emergencyFee = isEmergency ? EMERGENCY_FEE : 0;

    // Validate and apply promo code if provided.
    let discount = 0;
    let promoCodeDoc = null;

    if (promoCode) {
      promoCodeDoc = await PromoCode.findOne({
        code: promoCode.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: new Date() } }
        ]
      });

      if (!promoCodeDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired promo code'
        });
      }

      if (promoCodeDoc.usageLimit !== null && promoCodeDoc.usedCount >= promoCodeDoc.usageLimit) {
        return res.status(400).json({
          success: false,
          message: 'Promo code usage limit reached'
        });
      }

      if (productSubtotal < promoCodeDoc.minOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount of ${promoCodeDoc.minOrderAmount} required for this promo code`
        });
      }

      if (promoCodeDoc.type === 'percentage') {
        discount = (productSubtotal * promoCodeDoc.value) / 100;
        if (promoCodeDoc.maxDiscountAmount && discount > promoCodeDoc.maxDiscountAmount) {
          discount = promoCodeDoc.maxDiscountAmount;
        }
      } else {
        discount = promoCodeDoc.value;
      }

      if (discount > productSubtotal) {
        discount = productSubtotal;
      }
    }

    const finalTotal = productSubtotal + requestDeliveryFee + requestTax + emergencyFee - discount;

    // Verify payment for card transactions.
    let paymentStatus = 'pending';
    let stripePaymentId = null;
    if (paymentMethod === 'card') {
      if (!stripe) {
        return res.status(503).json({
          success: false,
          message: 'Card payments are unavailable. Stripe is not configured.'
        });
      }

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: 'paymentIntentId is required for card payments.'
        });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const expectedAmount = toMinorUnits(finalTotal);

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          success: false,
          message: 'Payment is not completed yet. Please complete card payment first.'
        });
      }

      if ((paymentIntent.metadata?.userId || '') !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'This payment intent does not belong to the authenticated user.'
        });
      }

      if ((paymentIntent.currency || '').toLowerCase() !== config.STRIPE_CURRENCY) {
        return res.status(400).json({
          success: false,
          message: 'Payment currency mismatch.'
        });
      }

      const receivedAmount = paymentIntent.amount_received || paymentIntent.amount || 0;
      // Allow a small tolerance (5 PKR in minor units) for rounding differences
      const TOLERANCE = 500; // 5 PKR in paisas
      if (receivedAmount < expectedAmount - TOLERANCE) {
        return res.status(400).json({
          success: false,
          message: `Paid amount (Rs. ${(receivedAmount / 100).toFixed(0)}) does not match order total (Rs. ${(expectedAmount / 100).toFixed(0)}).`
        });
      }

      paymentStatus = 'completed';
      stripePaymentId = paymentIntent.id;
      verifiedPaymentIntentId = paymentIntent.id;
    }

    // Reserve stock atomically before order creation.
    if (products.length) {
      reservedStock = await reserveStock(products);
    }

    // Create the order.
    const orderId = `order-${nanoid(10)}`;
    const order = new Order({
      id: orderId,
      orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
      userId: req.user.id,
      customer: {
        name: customer?.name || req.user.name,
        phone: customer?.phone || '',
        email: req.user.email
      },
      items: products.map((p) => {
        const item = items.find((i) => i.id === p.productId);
        return {
          productId: p.productId,
          name: item?.name || 'Item',
          price: item?.price || 0,
          quantity: p.quantity,
          totalPrice: (item?.price || 0) * p.quantity
        };
      }),
      pricing: {
        subtotal: productSubtotal,
        deliveryFee: requestDeliveryFee,
        tax: requestTax,
        discount,
        emergencyFee,
        promoCode: promoCode?.toUpperCase() || null,
        total: finalTotal
      },
      total: finalTotal,
      shopId: resolvedShopId,
      deliveryAddress: {
        address: customer?.address || '',
        coordinates: customer?.coordinates || {}
      },
      status: 'pending',
      placedAt: new Date(),
      specialInstructions: specialInstructions || '',
      isEmergency: !!isEmergency,
      payment: {
        method: paymentMethod,
        status: paymentStatus,
        transactionId: stripePaymentId || `${paymentMethod.toUpperCase()}-${Date.now()}`,
        paidAt: paymentStatus === 'completed' ? new Date() : undefined
      }
    });

    await order.save();

    // Link the order ID to Stripe intent metadata for webhook reconciliation.
    if (paymentMethod === 'card' && stripePaymentId) {
      try {
        await stripe.paymentIntents.update(stripePaymentId, {
          metadata: {
            userId: req.user.id,
            orderId: order.id
          }
        });
      } catch (metadataErr) {
        console.warn(`Unable to update payment intent metadata for ${stripePaymentId}: ${metadataErr.message}`);
      }
    }

    try {
      await Cart.findOneAndDelete({ userId: req.user.id });
    } catch (cartErr) {
      console.warn(`Failed to clear cart for user ${req.user.id}: ${cartErr.message}`);
    }

    if (promoCodeDoc) {
      try {
        await PromoCode.findByIdAndUpdate(promoCodeDoc._id, { $inc: { usedCount: 1 } });
      } catch (promoErr) {
        console.warn(`Failed to increment promo usage for ${promoCodeDoc.code}: ${promoErr.message}`);
      }
    }

    if (config.ENABLE_AUTO_RIDER_ASSIGNMENT) {
      setImmediate(async () => {
        try {
          const assignmentResult = await autoAssignRider(order.id);
          if (assignmentResult.success) {
            console.log(`Rider auto-assigned to order ${order.id}`);
          }
        } catch (assignErr) {
          console.error(`Auto-assignment failed for order ${order.id}:`, assignErr.message);
        }
      });
    }

    const paymentMessage = paymentMethod === 'card'
      ? 'Payment verified. Order placed successfully.'
      : 'Order placed successfully. Pay on delivery.';

    const paymentRedirect = null;

    return res.json({
      success: true,
      message: paymentMessage,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        payment: order.payment
      },
      paymentRedirect
    });
  } catch (err) {
    await rollbackStock(reservedStock);

    if (verifiedPaymentIntentId && stripe) {
      try {
        await stripe.refunds.create({ payment_intent: verifiedPaymentIntentId });
      } catch (refundErr) {
        console.error(`Automatic refund failed for payment intent ${verifiedPaymentIntentId}:`, refundErr.message);
      }
    }

    const statusCode = err.message.includes('Insufficient stock') ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: statusCode === 400 ? err.message : 'Order creation failed. Please try again.'
    });
  }
});

export default router;
