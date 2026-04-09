import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Cart, Product, Shop, PromoCode } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateAddToCart, validateUpdateCartItem, validateApplyPromo } from '../middleware/validation.js';
import { cartLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Calculate cart pricing
const calculatePricing = (items, deliveryFee = 0, tax = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + deliveryFee + tax - discount;
  return { subtotal, deliveryFee, tax, discount, total };
};

// Get user's cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.json({
        success: true,
        data: {
          cart: {
            items: [],
            pricing: { subtotal: 0, deliveryFee: 0, tax: 0, discount: 0, total: 0 }
          }
        }
      });
    }
    res.json({ success: true, data: { cart } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add item to cart
router.post('/items', authMiddleware, validateAddToCart, cartLimiter, async (req, res) => {
  try {
    const { productId, quantity, selectedVariants = [] } = req.body;
    
    // Get product details
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (!product.isAvailable || product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Product not available or insufficient stock' });
    }
    
    // Get shop details
    const shop = await Shop.findOne({ id: product.shopId });
    
    // Calculate price with variants
    const variantPrice = selectedVariants.reduce(
      (sum, v) => sum + (v.priceAdjustment || 0), 0
    );
    const unitPrice = product.price + variantPrice;
    const totalPrice = unitPrice * quantity;
    
    // Find or create cart
    let cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      cart = new Cart({
        id: `cart-${nanoid(8)}`,
        userId: req.user.id,
        shopId: product.shopId,
        shopName: shop?.name,
        items: [],
        pricing: { subtotal: 0, deliveryFee: 0, tax: 0, discount: 0, total: 0 }
      });
    }
    
    // Check if adding from different shop
    if (cart.shopId && cart.shopId !== product.shopId && cart.items.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart contains items from another shop. Please clear cart first.',
        code: 'DIFFERENT_SHOP'
      });
    }
    
    // Update shop info if cart is empty
    if (cart.items.length === 0) {
      cart.shopId = product.shopId;
      cart.shopName = shop?.name;
    }
    
    // Check if item already exists with same variants
    const existingItemIndex = cart.items.findIndex(item => 
      item.productId === productId && 
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
    );
    
    if (existingItemIndex >= 0) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice += totalPrice;
    } else {
      // Add new item
      cart.items.push({
        productId,
        shopId: product.shopId,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
        selectedVariants,
        totalPrice
      });
    }
    
    // Recalculate pricing
    const deliveryFee = shop?.deliveryFee || 0;
    const discount = cart.promoApplied ? cart.pricing.discount : 0;
    cart.pricing = calculatePricing(cart.items, deliveryFee, 0, discount);
    cart.lastUpdatedAt = new Date();
    
    await cart.save();
    
    res.json({ success: true, data: { cart } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update item quantity
router.put('/items/:productId', authMiddleware, validateUpdateCartItem, cartLimiter, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, selectedVariants = [] } = req.body;
    
    if (quantity <= 0) {
      // Remove item
      return res.redirect(307, `/api/cart/items/${productId}`);
    }
    
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    // Find item
    const itemIndex = cart.items.findIndex(item => 
      item.productId === productId && 
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    
    // Update quantity
    const item = cart.items[itemIndex];
    const unitPrice = item.price + item.selectedVariants.reduce(
      (sum, v) => sum + (v.priceAdjustment || 0), 0
    );
    item.quantity = quantity;
    item.totalPrice = unitPrice * quantity;
    
    // Recalculate pricing
    const shop = await Shop.findOne({ id: cart.shopId });
    const deliveryFee = shop?.deliveryFee || 0;
    const discount = cart.promoApplied ? cart.pricing.discount : 0;
    cart.pricing = calculatePricing(cart.items, deliveryFee, 0, discount);
    cart.lastUpdatedAt = new Date();
    
    await cart.save();
    
    res.json({ success: true, data: { cart } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove item from cart
router.delete('/items/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { selectedVariants = [] } = req.body;
    
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    // Remove item
    cart.items = cart.items.filter(item => 
      !(item.productId === productId && 
        JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants))
    );
    
    // If cart is empty, clear shop info
    if (cart.items.length === 0) {
      cart.shopId = null;
      cart.shopName = null;
      cart.promoCode = null;
      cart.promoApplied = null;
    }
    
    // Recalculate pricing
    const shop = cart.shopId ? await Shop.findOne({ id: cart.shopId }) : null;
    const deliveryFee = shop?.deliveryFee || 0;
    cart.pricing = calculatePricing(cart.items, deliveryFee, 0, 0);
    cart.lastUpdatedAt = new Date();
    
    await cart.save();
    
    res.json({ success: true, data: { cart } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Apply promo code
router.post('/apply-promo', authMiddleware, validateApplyPromo, cartLimiter, async (req, res) => {
  try {
    const { code } = req.body;
    
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    // Validate promo code against PromoCode model
    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(), 
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: new Date() } }
      ]
    });
    
    if (!promoCode) {
      return res.status(400).json({ success: false, message: 'Invalid or expired promo code' });
    }
    
    // Check usage limits
    if (promoCode.usageLimit !== null && promoCode.usedCount >= promoCode.usageLimit) {
      return res.status(400).json({ success: false, message: 'Promo code usage limit reached' });
    }
    
    const subtotal = cart.pricing.subtotal;
    if (subtotal < promoCode.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of $${promoCode.minOrderAmount} required`
      });
    }
    
    // Calculate discount
    let discount = 0;
    if (promoCode.type === 'percentage') {
      discount = (subtotal * promoCode.value) / 100;
      // Apply max discount limit if set
      if (promoCode.maxDiscountAmount && discount > promoCode.maxDiscountAmount) {
        discount = promoCode.maxDiscountAmount;
      }
    } else {
      discount = promoCode.value;
    }
    
    // Ensure discount doesn't exceed subtotal
    if (discount > subtotal) {
      discount = subtotal;
    }
    
    // Update cart
    cart.promoCode = code.toUpperCase();
    cart.promoApplied = {
      code: code.toUpperCase(),
      discountType: promoCode.type,
      discountValue: promoCode.value,
      minOrderAmount: promoCode.minOrderAmount
    };
    
    const shop = await Shop.findOne({ id: cart.shopId });
    const deliveryFee = shop?.deliveryFee || 0;
    cart.pricing = calculatePricing(cart.items, deliveryFee, 0, discount);
    cart.lastUpdatedAt = new Date();
    
    // Save cart - DON'T increment usage count yet (only on actual checkout)
    await cart.save();
    
    res.json({
      success: true,
      message: 'Promo code applied successfully',
      data: {
        promo: {
          code: code.toUpperCase(),
          discount,
          type: promoCode.type,
          value: promoCode.value
        },
        cart
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove promo code
router.delete('/promo', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    cart.promoCode = null;
    cart.promoApplied = null;
    
    const shop = cart.shopId ? await Shop.findOne({ id: cart.shopId }) : null;
    const deliveryFee = shop?.deliveryFee || 0;
    cart.pricing = calculatePricing(cart.items, deliveryFee, 0, 0);
    cart.lastUpdatedAt = new Date();
    
    await cart.save();
    
    res.json({ success: true, data: { cart } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Clear cart
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = [];
      cart.shopId = null;
      cart.shopName = null;
      cart.promoCode = null;
      cart.promoApplied = null;
      cart.pricing = { subtotal: 0, deliveryFee: 0, tax: 0, discount: 0, total: 0 };
      cart.lastUpdatedAt = new Date();
      await cart.save();
    }
    
    res.json({
      success: true,
      data: {
        cart: {
          items: [],
          pricing: { subtotal: 0, deliveryFee: 0, tax: 0, discount: 0, total: 0 }
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
