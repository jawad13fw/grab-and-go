import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Shop } from '../models/index.js';
import { config } from '../config/config.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateShopId, validatePagination } from '../middleware/validation.js';

const router = Router();

// Search shops (public) with pagination
router.get('/search', validatePagination, async (req, res) => {
  try {
    const { q, category, minOrder, page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    let query = { isActive: true };
    
    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Minimum order filter
    if (minOrder) {
      query.minOrder = { $lte: parseFloat(minOrder) };
    }
    
    // Get total count for pagination metadata
    const total = await Shop.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get paginated results
    const shops = await Shop.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    
    res.json({
      shops,
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
    res.status(500).json({ success: false, message: 'Unable to search shops right now. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Search failed', hint: 'Try refreshing the page or simplifying your search.' } });
  }
});

// Get all shops (public) with pagination
router.get('/', validatePagination, async (req, res) => {
  try {
    const { category, page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const query = category && category !== 'all' ? { category, isActive: true } : { isActive: true };
    
    // Get total count for pagination metadata
    const total = await Shop.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get paginated results
    const shops = await Shop.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    
    res.json({
      shops,
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
    res.status(500).json({ success: false, message: 'Unable to load shops right now. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Failed to load shops', hint: 'Try refreshing the page.' } });
  }
});

// Get vendor's shops with pagination
router.get('/my-shops', authMiddleware, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const query = { vendorId: req.user.id, isActive: true };
    
    // Get total count for pagination metadata
    const total = await Shop.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get paginated results
    const shops = await Shop.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      shops,
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
    res.status(500).json({ success: false, message: 'Unable to load your shops. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Failed to load shops', hint: 'Try refreshing the page.' } });
  }
});

// Get single shop (public)
router.get('/:id', validateShopId, async (req, res) => {
  try {
    const shop = await Shop.findOne({ id: req.params.id, isActive: true });
    if (!shop) return res.status(404).json({ success: false, message: 'This shop could not be found. It may have been closed or removed.', error: { status: 404, code: 'NOT_FOUND', title: 'Shop not found', hint: 'The shop may no longer be active. Try browsing other shops.' } });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to load shop details. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Failed to load shop', hint: 'Try refreshing the page.' } });
  }
});

// Create new shop (vendor only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Vendor') {
      return res.status(403).json({ success: false, message: 'Only vendor accounts can create shops. Please register as a vendor or switch accounts.', error: { status: 403, code: 'FORBIDDEN', title: 'Cannot create shop', hint: 'You need a Vendor account to create shops. Register a new account with the Vendor role.' } });
    }
    
    const { name, category, deliveryTime, deliveryFee, minOrder, image, banner, address, phone, hours, description, tags } = req.body;
    
    const shop = new Shop({
      id: `shop-${nanoid(8)}`,
      name,
      category,
      deliveryTime: deliveryTime || '30-45 min',
      deliveryFee: deliveryFee || 0,
      minOrder: minOrder || 0,
      image: image || config.DEFAULT_SHOP_IMAGE_URL,
      banner: banner || config.DEFAULT_SHOP_BANNER_URL,
      address,
      phone,
      hours: hours || '9:00 AM - 10:00 PM',
      description,
      tags: tags || [],
      vendorId: req.user.id,
      isActive: true
    });
    
    await shop.save();
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create shop. Please check your details and try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Shop creation failed', hint: 'Make sure all required fields (name, category, etc.) are filled in correctly.' } });
  }
});

// Update shop (vendor only)
router.put('/:id', authMiddleware, validateShopId, async (req, res) => {
  try {
    const shop = await Shop.findOne({ id: req.params.id });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    if (shop.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    // Safely update only allowed fields to prevent mass assignment
    const allowedUpdates = [
      'name', 'category', 'deliveryTime', 'deliveryFee', 'minOrder', 
      'image', 'banner', 'address', 'phone', 'hours', 'description', 'tags'
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
      shop[key] = updates[key];
    });
    
    await shop.save();
    
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update shop. Please check your changes and try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Update failed', hint: 'Make sure all fields are valid and try again.' } });
  }
});

// Delete shop (vendor only)
router.delete('/:id', authMiddleware, validateShopId, async (req, res) => {
  try {
    const shop = await Shop.findOne({ id: req.params.id });
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found. It may have already been removed.', error: { status: 404, code: 'NOT_FOUND', title: 'Shop not found', hint: 'The shop may already be deactivated. Check your shop list.' } });
    if (shop.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete shops that you own.', error: { status: 403, code: 'FORBIDDEN', title: 'Not your shop', hint: 'Make sure you\'re logged in with the correct vendor account.' } });
    }
    
    shop.isActive = false;
    await shop.save();
    
    res.json({ success: true, message: 'Shop deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to deactivate shop. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Deactivation failed', hint: 'Try again in a moment.' } });
  }
});

export default router;
