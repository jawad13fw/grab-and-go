import { Router } from 'express';
import { Rider, Order } from '../models/index.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { ensureRiderProfileForUser, findPrimaryRiderProfile } from '../services/riderProfiles.js';

const router = Router();

router.get('/', authMiddleware, validatePagination, async (req, res) => {
  try {
    if (!['Admin', 'Rider'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admin and rider accounts can access rider profiles.'
      });
    }

    const { page = 1, limit = 20, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    if (req.user.role === 'Rider') {
      const rider = await findPrimaryRiderProfile(req.user.id);
      query = rider ? { id: rider.id } : { userId: req.user.id };
    }

    const total = await Rider.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    const riders = await Rider.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const mappedRiders = riders.map((rider) => ({
      id: rider.id,
      userId: rider.userId,
      name: rider.name,
      status: rider.status,
      rating: rider.rating,
      deliveries: rider.deliveries,
      earnings: rider.earnings,
      location: rider.location,
      currentOrderId: rider.currentOrderId,
      ...(req.user.role === 'Admin' ? { email: rider.email, phone: rider.phone } : {}),
      createdAt: rider.createdAt,
      updatedAt: rider.updatedAt
    }));

    res.json({
      riders: mappedRiders,
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
    res.status(500).json({ success: false, message: 'Unable to load riders list. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Failed to load riders', hint: 'Try refreshing the page.' } });
  }
});

router.patch('/online', authMiddleware, requireRole('Rider'), async (req, res) => {
  try {
    const { isOnline } = req.body;
    const rider = await ensureRiderProfileForUser(req.user);
    rider.status = isOnline ? 'available' : 'offline';
    await rider.save();
    res.json({ success: true, rider });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update your availability status. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Status update failed', hint: 'Check your internet connection and try again.' } });
  }
});

router.post('/location', authMiddleware, requireRole('Rider'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const rider = await ensureRiderProfileForUser(req.user);
    rider.location = {
      lat: lat != null ? Number(lat) : rider.location?.lat,
      lng: lng != null ? Number(lng) : rider.location?.lng
    };
    await rider.save();
    res.json({ success: true, rider });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update your location.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Location update failed' } });
  }
});

router.get('/available-orders', authMiddleware, requireRole('Rider'), async (req, res) => {
  try {
    const orders = await Order.find({
      riderId: { $in: [null, undefined] },
      status: { $nin: ['delivered', 'cancelled'] }
    }).sort({
      isEmergency: -1, // Emergency orders first
      placedAt: 1      // Then by placement time (oldest first)
    });

    res.json({
      success: true,
      orders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to load available orders. Please try again.', error: { status: 500, code: 'INTERNAL_ERROR', title: 'Failed to load orders', hint: 'Try refreshing the page.' } });
  }
});

export default router;