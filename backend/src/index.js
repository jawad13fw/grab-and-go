import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/config.js';

// Security headers middleware
function securityHeaders(req, res, next) {
  // Prevent opening in frames (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS protection (deprecated but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (basic)
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");

  next();
}

// Verify JWT token middleware for Socket.IO (reads from cookie or auth)
function authenticateSocket(socket, next) {
  // Try auth payload first, then cookie
  let token = socket.handshake.auth?.token;

  if (!token) {
    // Parse cookie from handshake headers
    const cookieHeader = socket.handshake.headers?.cookie || '';
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
    if (match) token = match[1];
  }

  if (!token) {
    console.log('Socket connection rejected: No token provided');
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    socket.decodedToken = decoded;
    next();
  } catch (err) {
    console.log('Socket connection rejected: Invalid token', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
}

async function getRiderIdForUser(userId) {
  const rider = await findPrimaryRiderProfile(userId);
  return rider?.id || null;
}

const toFiniteNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getCoordinates = (input) => {
  if (!input || typeof input !== 'object') return null;
  const source = input.coordinates && typeof input.coordinates === 'object' ? input.coordinates : input;
  const lat = toFiniteNumber(source.lat ?? source.latitude);
  const lng = toFiniteNumber(source.lng ?? source.lon ?? source.longitude ?? source.long);
  if (lat === null || lng === null) return null;
  return { lat, lng };
};

const haversineKm = (pointA, pointB) => {
  if (!pointA || !pointB) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);
  const lat1 = toRad(pointA.lat);
  const lat2 = toRad(pointB.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const estimateEta = (distanceKm) => {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return null;
  const averageSpeedKmh = 25;
  const etaMinutes = Math.max(3, Math.round((distanceKm / averageSpeedKmh) * 60));
  return new Date(Date.now() + etaMinutes * 60 * 1000);
};

import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import shopsRoutes from './routes/shops.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import ridersRoutes from './routes/riders.js';
import adminRoutes from './routes/admin.js';
import deliveryRequestsRoutes from './routes/deliveryRequests.js';
import checkoutRoutes from './routes/checkout.js';
import cartRoutes from './routes/cart.js';
import usersRoutes from './routes/users.js';
import reviewsRoutes from './routes/reviews.js';
import recommendationsRoutes from './routes/recommendations.js';
import uploadRoutes from './routes/upload.js';
import { findPrimaryRiderProfile } from './services/riderProfiles.js';
import { validateOrderStatusUpdate, applyOrderStatusTimestamp } from './services/orderStatusRules.js';
import { connectDB } from './db/mongoose.js';
import { Rider, Order, Shop } from './models/index.js';
import { apiLimiter, authLimiter, passwordResetLimiter, orderLimiter, reviewLimiter, cartLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound, handleUnhandledRejection, handleUncaughtException } from './middleware/errorHandler.js';
import { startTimeoutChecker } from './services/orderTimeout.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: config.CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

app.use(securityHeaders);
app.use(morgan('dev'));
app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use('/api/checkout/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Apply specific rate limiters to their routes
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/reviews', reviewLimiter);
app.use('/api/cart', cartLimiter);

app.get('/health', (_, res) => res.json({ ok: true, db: 'mongodb' }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/riders', ridersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery-requests', deliveryRequestsRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/upload', uploadRoutes);

// Serve uploaded files (Multer)
app.use('/uploads', express.static(config.UPLOAD_DIR));

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Use the authenticateSocket middleware so the token is already verified
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log('Socket authenticated for user:', socket.decodedToken.id, 'role:', socket.decodedToken.role);

  if (socket.decodedToken.role === 'Admin') {
    socket.join('admins');
  }

  // Handle order subscription for real-time tracking
  socket.on('subscribe', async (data) => {
    const { orderId, userId } = data;
    if (orderId) {
      // Verify user has permission to subscribe to this order
      const order = await Order.findOne({ id: orderId });
      if (!order) {
        socket.emit('error', { message: 'Order not found' });
        return;
      }

      // Check if user is authorized to view this order
      const userRole = socket.decodedToken.role;
      const isOrderOwner = order.userId === socket.decodedToken.id;
      const riderId = userRole === 'Rider' ? await getRiderIdForUser(socket.decodedToken.id) : null;
      const isAssignedRider = riderId ? order.riderId === riderId : false;

      if (userRole === 'Admin' || isOrderOwner || isAssignedRider) {
        socket.join(`order:${orderId}`);
        console.log(`User ${socket.decodedToken.id} (${userRole}) subscribed to order ${orderId}`);

        // Send current order status
        if (order) {
          socket.emit('order_status_update', {
            status: order.status,
            statusHistory: order.statusHistory
          });

          if (order.tracking) {
            socket.emit('rider_location', {
              location: order.tracking.currentLocation,
              timestamp: order.tracking.lastUpdated
            });
          }

          if (order.tracking?.eta) {
            socket.emit('eta_update', {
              estimatedTime: order.tracking.eta,
              distance: order.tracking.distance
            });
          }
        }
      } else {
        socket.emit('error', { message: 'Not authorized to access this order' });
      }
    }
  });

  // Handle unsubscribe
  socket.on('unsubscribe', (data) => {
    const { orderId } = data;
    if (orderId) {
      socket.leave(`order:${orderId}`);
    }
  });

  // Handle rider location updates
  socket.on('rider:location', async (payload) => {
    const { riderId, orderId, lat, lng } = payload;

    // Verify user is authenticated and has rider role or is admin
    const userRole = socket.decodedToken?.role;
    const userId = socket.decodedToken?.id;
    const authenticatedRiderId = userRole === 'Rider' ? await getRiderIdForUser(userId) : null;

    if (userRole !== 'Rider' && userRole !== 'Admin') {
      socket.emit('error', { message: 'Only riders and admins can update locations' });
      return;
    }

    // Verify the rider is updating their own location or admin is doing it
    if (userRole === 'Rider' && riderId !== authenticatedRiderId) {
      socket.emit('error', { message: 'Cannot update location for another rider' });
      return;
    }

    if (riderId && (lat != null || lng != null)) {
      const rider = await Rider.findOne({ id: riderId });
      if (rider) {
        rider.location = {
          lat: Number(lat) || rider.location?.lat,
          lng: Number(lng) || rider.location?.lng
        };
        await rider.save();

        io.to('admins').emit('rider_location', {
          riderId,
          orderId: orderId || null,
          location: rider.location,
          timestamp: new Date()
        });

        // Broadcast to order room if orderId is provided
        if (orderId) {
          // Verify rider is assigned to this order
          const order = await Order.findOne({ id: orderId });
          if (order && (order.riderId === riderId || userRole === 'Admin')) {
            const destinationCoordinates = getCoordinates(order.deliveryAddress);
            const currentCoordinates = getCoordinates(rider.location);
            const distance = haversineKm(currentCoordinates, destinationCoordinates);
            const eta = estimateEta(distance);

            order.tracking = {
              ...(order.tracking?.toObject ? order.tracking.toObject() : (order.tracking || {})),
              currentLocation: currentCoordinates || order.tracking?.currentLocation,
              lastUpdated: new Date(),
              distance: Number.isFinite(distance) ? Math.round(distance * 100) / 100 : order.tracking?.distance,
              eta: eta || order.tracking?.eta,
            };
            await order.save();

            io.to(`order:${orderId}`).emit('rider_location', {
              riderId,
              location: rider.location,
              timestamp: new Date()
            });

            if (eta || Number.isFinite(distance)) {
              io.to(`order:${orderId}`).emit('eta_update', {
                estimatedTime: eta,
                distance: Number.isFinite(distance) ? Math.round(distance * 100) / 100 : null,
              });
            }
          } else {
            socket.emit('error', { message: 'Not authorized to update location for this order' });
          }
        }
      }
    }
  });

  // Handle order status updates
  socket.on('order:status_update', async (payload) => {
    const { orderId, status } = payload || {};

    // Verify user is authenticated
    const userRole = socket.decodedToken?.role;
    const userId = socket.decodedToken?.id;
    const authenticatedRiderId = userRole === 'Rider' ? await getRiderIdForUser(userId) : null;

    if (!['Rider', 'Vendor', 'Admin'].includes(userRole)) {
      socket.emit('error', { message: 'Insufficient permissions to update order status' });
      return;
    }

    if (!orderId || !status) {
      socket.emit('error', { message: 'orderId and status are required' });
      return;
    }

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      socket.emit('error', { message: 'Order not found' });
      return;
    }

    // Verify user has permission to update this order.
    const isAssignedRider = authenticatedRiderId ? order.riderId === authenticatedRiderId : false;

    // Riders can update status if they're assigned to the order.
    // Vendors can update status for their shop's orders.
    // Admins can update any order.
    let canUpdate = false;

    if (userRole === 'Admin') {
      canUpdate = true;
    } else if (userRole === 'Rider' && isAssignedRider) {
      canUpdate = true;
    } else if (userRole === 'Vendor') {
      const shops = await Shop.find({ vendorId: userId });
      const shopIds = shops.map((s) => s.id);
      if (shopIds.includes(order.shopId)) {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      socket.emit('error', { message: 'Not authorized to update this order status' });
      return;
    }

    const validation = validateOrderStatusUpdate({
      currentStatus: order.status,
      nextStatus: status,
      userRole,
      allowCancelled: false
    });

    if (!validation.valid) {
      socket.emit('error', { message: validation.message, code: validation.code });
      return;
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

    io.to(`order:${orderId}`).emit('order_status_update', {
      status: validation.status,
      statusHistory: order.statusHistory
    });

    io.to('admins').emit('analytics_updated', {
      orderId,
      status: validation.status,
      timestamp: new Date(),
    });
  });

  // Handle ping/pong for connection keepalive
  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Handle uncaught exceptions
handleUncaughtException();

connectDB().then(() => {
  const server = httpServer.listen(config.PORT, () => {
    console.log(`🚀 Server running at http://localhost:${config.PORT}`);
  });

  // Start order timeout checker (every 5 minutes)
  startTimeoutChecker(io, 5);

  // Handle unhandled promise rejections
  handleUnhandledRejection(server);

}).catch((err) => {
  console.error('DB init failed:', err);
  process.exit(1);
});
