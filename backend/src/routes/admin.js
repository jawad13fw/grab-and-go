import { Router } from 'express';
import { Order, Rider, Shop, User, AdminSettings, Ticket, AuditLog, Content } from '../models/index.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { autoAssignRider } from '../services/riderAssignment.js';
import { processPendingRefunds, processRefund } from '../services/refunds.js';

const router = Router();
router.use(authMiddleware, requireRole('Admin'));

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const getOrderTotal = (order) => Number(order?.total ?? order?.pricing?.total ?? 0) || 0;

const getOrderDate = (order) => {
  const date = new Date(order?.placedAt || order?.createdAt || order?.updatedAt || Date.now());
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildDayWindow = (offsetDays = 0) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - offsetDays);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const calculatePercentChange = (current, previous) => {
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;

  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Math.round((((currentValue - previousValue) / previousValue) * 100) * 10) / 10;
};

const countCreatedBetween = (items, start, end) => items.filter((item) => {
  const createdAt = new Date(item?.createdAt);
  return !Number.isNaN(createdAt.getTime()) && createdAt >= start && createdAt < end;
}).length;

router.get('/analytics', async (req, res) => {
  try {
    const orders = await Order.find();
    const riders = await Rider.find();
    const shops = await Shop.find();
    const users = await User.find();

    const todayWindow = buildDayWindow(0);
    const yesterdayWindow = buildDayWindow(1);
    const weekStart = buildDayWindow(6).start;
    const previousWeekStart = buildDayWindow(13).start;
    const previousWeekEnd = buildDayWindow(7).end;

    const ordersToday = orders.filter((order) => {
      const date = getOrderDate(order);
      return date && date >= todayWindow.start && date < todayWindow.end;
    });

    const ordersYesterday = orders.filter((order) => {
      const date = getOrderDate(order);
      return date && date >= yesterdayWindow.start && date < yesterdayWindow.end;
    });

    const activeRiders = riders.filter((r) => r.status !== 'offline').length;
    const revenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);

    const statusBreakdown = orders.reduce((acc, order) => {
      const status = normalizeStatus(order?.status);
      if (['assigned', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(status)) {
        acc.inProgress += 1;
      } else if (status === 'delivered') {
        acc.delivered += 1;
      } else if (status === 'cancelled') {
        acc.cancelled += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    }, { pending: 0, inProgress: 0, delivered: 0, cancelled: 0 });

    const orderTrends = Array.from({ length: 7 }, (_, index) => {
      const dayWindow = buildDayWindow(6 - index);
      return orders.filter((order) => {
        const date = getOrderDate(order);
        return date && date >= dayWindow.start && date < dayWindow.end;
      }).length;
    });

    const revenueTrends = Array.from({ length: 7 }, (_, index) => {
      const dayWindow = buildDayWindow(6 - index);
      return orders.filter((order) => {
        const date = getOrderDate(order);
        return date && date >= dayWindow.start && date < dayWindow.end;
      }).reduce((sum, order) => sum + getOrderTotal(order), 0);
    });

    const averageDeliveryTimeMinutes = (() => {
      const deliveredOrders = orders.filter((order) => normalizeStatus(order?.status) === 'delivered');
      const durations = deliveredOrders
        .map((order) => {
          const start = new Date(order?.pickedUpAt || order?.confirmedAt || order?.placedAt);
          const end = new Date(order?.deliveredAt || order?.updatedAt);
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
          return (end.getTime() - start.getTime()) / 60000;
        })
        .filter((duration) => Number.isFinite(duration) && duration >= 0);

      if (!durations.length) return 0;
      return Math.round((durations.reduce((sum, duration) => sum + duration, 0) / durations.length) * 10) / 10;
    })();

    const usersWindowThisWeek = countCreatedBetween(users, weekStart, todayWindow.end);
    const usersWindowLastWeek = countCreatedBetween(users, previousWeekStart, previousWeekEnd);
    const ridersWindowThisWeek = countCreatedBetween(riders, weekStart, todayWindow.end);
    const ridersWindowLastWeek = countCreatedBetween(riders, previousWeekStart, previousWeekEnd);
    const shopsWindowThisWeek = countCreatedBetween(shops, weekStart, todayWindow.end);
    const shopsWindowLastWeek = countCreatedBetween(shops, previousWeekStart, previousWeekEnd);

    res.json({
      success: true,
      ordersToday: ordersToday.length,
      ordersYesterday: ordersYesterday.length,
      activeRiders,
      vendors: shops.length,
      revenue,
      revenueToday: ordersToday.reduce((sum, order) => sum + getOrderTotal(order), 0),
      revenueYesterday: ordersYesterday.reduce((sum, order) => sum + getOrderTotal(order), 0),
      orderTrends,
      revenueTrends,
      statusBreakdown,
      averageDeliveryTimeMinutes,
      deliverySuccessRate: orders.length ? Math.round(((statusBreakdown.delivered / orders.length) * 100) * 10) / 10 : 0,
      activeOrders: orders.length - statusBreakdown.delivered - statusBreakdown.cancelled,
      users: users.length,
      customers: users.filter((u) => u.role === 'Customer').length,
      userGrowth: calculatePercentChange(usersWindowThisWeek, usersWindowLastWeek),
      riderGrowth: calculatePercentChange(ridersWindowThisWeek, ridersWindowLastWeek),
      shopGrowth: calculatePercentChange(shopsWindowThisWeek, shopsWindowLastWeek),
      orderGrowth: calculatePercentChange(ordersToday.length, ordersYesterday.length),
      revenueGrowth: calculatePercentChange(
        ordersToday.reduce((sum, order) => sum + getOrderTotal(order), 0),
        ordersYesterday.reduce((sum, order) => sum + getOrderTotal(order), 0)
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', validatePagination, async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    let query = {};
    if (role && role !== 'All') query.role = role;
    
    // Get total count for pagination metadata
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get paginated results
    const users = await User.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    
    const mapped = users.map((u) => ({ 
      id: u.id, 
      name: u.name, 
      email: u.email, 
      role: u.role, 
      orders: u.ordersCount ?? 0, 
      deliveries: u.deliveries,
      createdAt: u.createdAt
    }));
    
    res.json({
      success: true,
      users: mapped,
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
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings(req.body);
    } else {
      // Safely update only allowed fields to prevent mass assignment
      const allowedUpdates = [
        'deliveryFee', 'riderCommission', 'shopCommission', 'platformFee', 
        'minWithdrawal', 'maxWithdrawal', 'updatedAt'
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
        settings[key] = updates[key];
      });
    }
    settings.updatedAt = new Date();
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const ticket = new Ticket({ 
      id: `ticket-${Date.now()}`, 
      ...req.body, 
      status: 'open', 
      createdAt: new Date().toISOString() 
    });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(1000);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logs', async (req, res) => {
  try {
    const log = new AuditLog({ 
      id: `log-${Date.now()}`, 
      ...req.body, 
      timestamp: new Date().toISOString() 
    });
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/content', async (req, res) => {
  try {
    const content = await Content.find();
    const result = { faqs: [], terms: '', privacy: '', helpCenter: '' };
    content.forEach((c) => {
      if (c.type === 'faqs') result.faqs = c.data || [];
      if (c.type === 'terms') result.terms = c.data || '';
      if (c.type === 'privacy') result.privacy = c.data || '';
      if (c.type === 'helpCenter') result.helpCenter = c.data || '';
    });
    res.json({ success: true, content: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const upsertContent = async (req, res) => {
  try {
    const { type, content: data } = req.body;
    const allowedTypes = ['faqs', 'terms', 'privacy', 'helpCenter'];

    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Valid content type is required' });
    }

    let contentDoc = await Content.findOne({ type });
    if (!contentDoc) {
      contentDoc = new Content({ type, data });
    } else {
      contentDoc.data = data;
      contentDoc.updatedAt = new Date();
    }
    await contentDoc.save();

    const allContent = await Content.find();
    const result = { faqs: [], terms: '', privacy: '', helpCenter: '' };
    allContent.forEach((c) => {
      if (c.type === 'faqs') result.faqs = c.data || [];
      if (c.type === 'terms') result.terms = c.data || '';
      if (c.type === 'privacy') result.privacy = c.data || '';
      if (c.type === 'helpCenter') result.helpCenter = c.data || '';
    });
    res.json({ success: true, content: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.patch('/content', upsertContent);
router.post('/content', upsertContent);

router.get('/rider-locations', async (req, res) => {
  try {
    const riders = await Rider.find({ status: { $ne: 'offline' } });
    const online = riders.map((r) => ({
      ...r.toObject(),
      location: r.location || { lat: 37.7749, lng: -122.4194 },
    }));
    res.json(online);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-assign rider to an order
router.post('/orders/:orderId/assign-rider', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await autoAssignRider(orderId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          rider: result.rider,
          distance: result.distance,
          eta: result.eta
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Process pending refunds
router.post('/refunds/process-pending', async (req, res) => {
  try {
    const result = await processPendingRefunds();
    res.json({
      success: true,
      message: 'Batch refund processing completed',
      result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Process single order refund
router.post('/orders/:orderId/refund', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, amount } = req.body;
    
    const result = await processRefund(orderId, reason, amount);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
