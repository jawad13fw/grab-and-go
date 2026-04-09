import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Product, Shop } from '../models/index.js';
import { config } from '../config/config.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateShopId, validateProductId, validatePagination } from '../middleware/validation.js';

const router = Router();

// Search products (public) with pagination
router.get('/search', validatePagination, async (req, res) => {
  try {
    const { q, category, shopId, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    let query = { isAvailable: true };
    
    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Shop filter
    if (shopId) {
      query.shopId = shopId;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Get total count for pagination metadata
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get paginated results
    const products = await Product.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    
    res.json({
      products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      searchQuery: q || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get products (public) with pagination
router.get('/', validatePagination, async (req, res) => {
  try {
    const { shopId, category, page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    let query = { isAvailable: true };
    if (shopId) query.shopId = shopId;
    if (category && category !== 'all') query.category = category;
    
    // Get total count for pagination metadata
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get paginated results
    const products = await Product.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    
    res.json({
      products,
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
    res.status(500).json({ success: false, message: 'Unable to load products right now. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Failed to load products', hint: 'Try refreshing the page.' } });
  }
});

// Get vendor's products with pagination
router.get('/my-products', authMiddleware, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Get all shops owned by this vendor
    const shops = await Shop.find({ vendorId: req.user.id });
    const shopIds = shops.map(s => s.id);
    
    const query = { shopId: { $in: shopIds }, isAvailable: true };
    
    // Get total count for pagination metadata
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get paginated results
    const products = await Product.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      products,
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
    res.status(500).json({ success: false, message: 'Unable to load your products. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Failed to load products', hint: 'Try refreshing the page.' } });
  }
});

// Get single product (public)
router.get('/:id', validateProductId, async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id, isAvailable: true });
    if (!product) return res.status(404).json({ success: false, message: 'This product could not be found. It may have been removed or is no longer available.', error: { status: 404, code: 'NOT_FOUND', title: 'Product not found', hint: 'The product may no longer be available. Try browsing other products.' } });
    res.json(product);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to load product details. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Failed to load product', hint: 'Try refreshing the page.' } });
  }
});

// Create product (vendor only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Vendor') {
      return res.status(403).json({ success: false, message: 'Only vendor accounts can create products. Please register as a vendor or switch accounts.', error: { status: 403, code: 'FORBIDDEN', title: 'Cannot create product', hint: 'You need a Vendor account to add products.' } });
    }
    
    const { name, description, price, category, shopId, stock, image, images } = req.body;
    
    // Verify shop belongs to vendor
    const shop = await Shop.findOne({ id: shopId });
    if (!shop) return res.status(404).json({ success: false, message: 'The shop you selected was not found. Please select a valid shop.', error: { status: 404, code: 'NOT_FOUND', title: 'Shop not found', hint: 'Make sure you have created a shop first before adding products.' } });
    if (shop.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only add products to shops that you own.', error: { status: 403, code: 'FORBIDDEN', title: 'Not your shop', hint: 'Select one of your own shops.' } });
    }
    
    const product = new Product({
      id: `prod-${nanoid(8)}`,
      name,
      description,
      price,
      category,
      shopId,
      shopName: shop.name,
      stock: stock || 0,
      image: image || (images && images[0]) || config.DEFAULT_PRODUCT_IMAGE_URL,
      images: images && images.length ? images : [image || config.DEFAULT_PRODUCT_IMAGE_URL],
      isAvailable: true,
      rating: 0,
      reviews: 0
    });
    
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create product. Please check your details and try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Product creation failed', hint: 'Make sure all required fields (name, price, shop, etc.) are filled in.' } });
  }
});

// Update product (vendor only)
router.put('/:id', authMiddleware, validateProductId, async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found. It may have been removed.', error: { status: 404, code: 'NOT_FOUND', title: 'Product not found', hint: 'Check your products list and try again.' } });
    
    // Verify shop belongs to vendor
    const shop = await Shop.findOne({ id: product.shopId });
    if (!shop || shop.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit products in shops that you own.', error: { status: 403, code: 'FORBIDDEN', title: 'Not your product', hint: 'Make sure you\'re logged in with the correct vendor account.' } });
    }
    
    // Safely update only allowed fields to prevent mass assignment
    const allowedUpdates = [
      'name', 'description', 'price', 'category', 'stock', 'image', 'images', 'isAvailable', 'tags'
    ];
    
    // Filter req.body to only include allowed fields
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body.hasOwnProperty(key) && req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    // Apply only allowed updates
    Object.keys(updates).forEach(key => {
      product[key] = updates[key];
    });
    
    await product.save();
    
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update product. Please check your changes and try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Update failed', hint: 'Make sure all fields are valid.' } });
  }
});

// Delete product (vendor only)
router.delete('/:id', authMiddleware, validateProductId, async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found. It may have already been removed.', error: { status: 404, code: 'NOT_FOUND', title: 'Product not found', hint: 'The product may already be deactivated.' } });
    
    // Verify shop belongs to vendor
    const shop = await Shop.findOne({ id: product.shopId });
    if (!shop || shop.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete products from your own shops.', error: { status: 403, code: 'FORBIDDEN', title: 'Not your product', hint: 'Make sure you\'re logged in with the correct vendor account.' } });
    }
    
    product.isAvailable = false;
    await product.save();
    
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove product. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Removal failed', hint: 'Try again in a moment.' } });
  }
});

export default router;
