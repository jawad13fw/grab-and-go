import { Rider, Order, Shop } from '../models/index.js';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate estimated time of arrival based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} vehicleType - Type of vehicle (bike, car, etc.)
 * @returns {number} ETA in minutes
 */
export function calculateETA(distanceKm, vehicleType = 'bike') {
  // Average speeds in km/h for different vehicle types
  const speeds = {
    bike: 25,
    car: 40,
    scooter: 30,
    bicycle: 15
  };
  
  const speed = speeds[vehicleType] || speeds.bike;
  const timeInHours = distanceKm / speed;
  const timeInMinutes = timeInHours * 60;
  
  // Add buffer time for pickup/dropoff (5 minutes)
  return Math.ceil(timeInMinutes + 5);
}

/**
 * Find the best available rider for an order based on proximity and availability
 * @param {Object} order - The order document
 * @param {number} maxDistanceKm - Maximum distance to search for riders (default: 50km)
 * @returns {Promise<Object|null>} Best rider or null if none found
 */
export async function findBestRider(order, maxDistanceKm = 50) {
  try {
    // Get shop location
    const shop = await Shop.findOne({ id: order.shopId });
    if (!shop || !shop.coordinates?.lat || !shop.coordinates?.lng) {
      console.log('Shop location not available for automatic rider assignment');
      return null;
    }
    
    const shopLat = shop.coordinates.lat;
    const shopLng = shop.coordinates.lng;
    
    // Find available riders
    const availableRiders = await Rider.find({
      status: 'available',
      'location.lat': { $exists: true },
      'location.lng': { $exists: true }
    });
    
    if (availableRiders.length === 0) {
      console.log('No available riders found');
      return null;
    }
    
    // Calculate distance for each rider and filter by max distance
    const ridersWithDistance = availableRiders
      .map(rider => {
        const distance = calculateDistance(
          shopLat,
          shopLng,
          rider.location.lat,
          rider.location.lng
        );
        
        return {
          rider,
          distance,
          // Calculate score based on distance and rating
          score: calculateRiderScore(distance, rider.rating, rider.deliveries)
        };
      })
      .filter(r => r.distance <= maxDistanceKm);
    
    if (ridersWithDistance.length === 0) {
      console.log(`No riders found within ${maxDistanceKm}km radius`);
      return null;
    }
    
    // Sort by score (higher is better) and get the best rider
    ridersWithDistance.sort((a, b) => b.score - a.score);
    
    const best = ridersWithDistance[0];
    
    // Prioritize emergency orders
    if (order.isEmergency && ridersWithDistance.length > 1) {
      // For emergency, prioritize closest rider regardless of score
      ridersWithDistance.sort((a, b) => a.distance - b.distance);
      return {
        rider: ridersWithDistance[0].rider,
        distance: ridersWithDistance[0].distance,
        eta: calculateETA(ridersWithDistance[0].distance, ridersWithDistance[0].rider.vehicle?.type)
      };
    }
    
    return {
      rider: best.rider,
      distance: best.distance,
      eta: calculateETA(best.distance, best.rider.vehicle?.type)
    };
  } catch (err) {
    console.error('Error finding best rider:', err);
    return null;
  }
}

/**
 * Calculate a score for rider selection
 * Lower distance = better
 * Higher rating = better
 * More deliveries = more experienced = slightly better
 */
function calculateRiderScore(distance, rating = 0, deliveries = 0) {
  // Normalize distance (inverse - closer is better)
  const distanceScore = 100 / (1 + distance);
  
  // Rating score (0-5 scale, normalize to 0-100)
  const ratingScore = (rating / 5) * 100;
  
  // Experience score (logarithmic scale to avoid overwhelming other factors)
  const experienceScore = Math.min(Math.log10(deliveries + 1) * 20, 50);
  
  // Weighted combination
  return (
    distanceScore * 0.5 +  // 50% weight on distance
    ratingScore * 0.35 +    // 35% weight on rating
    experienceScore * 0.15  // 15% weight on experience
  );
}

/**
 * Automatically assign a rider to an order
 * @param {string} orderId - Order ID
 * @param {Object} io - Socket.io instance for real-time notifications
 * @returns {Promise<Object>} Assignment result
 */
export async function autoAssignRider(orderId, io = null) {
  try {
    const order = await Order.findOne({ id: orderId });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.riderId) {
      return { success: false, message: 'Order already has a rider assigned' };
    }
    
    // Find best rider
    const result = await findBestRider(order);
    
    if (!result) {
      return { success: false, message: 'No available riders found' };
    }
    
    const { rider, distance, eta } = result;
    
    // Update order with rider assignment
    order.rider = {
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      vehicleType: rider.vehicle?.type || 'bike',
      vehicleNumber: rider.vehicle?.plateNumber || '',
      rating: rider.rating || 0
    };
    order.riderId = rider.id;
    order.status = 'assigned';
    order.tracking = {
      currentLocation: rider.location,
      lastUpdated: new Date(),
      eta: new Date(Date.now() + eta * 60000), // Convert minutes to milliseconds
      distance: distance
    };
    order.statusHistory.push({
      status: 'assigned',
      timestamp: new Date(),
      note: `Auto-assigned to rider ${rider.name}`,
      updatedBy: 'system'
    });
    
    await order.save();
    
    // Update rider status
    rider.status = 'busy';
    rider.currentOrderId = order.id;
    await rider.save();
    
    // Emit real-time notification via Socket.IO
    if (io) {
      io.to(`rider:${rider.id}`).emit('order:assigned', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        distance,
        eta
      });
      
      io.to(`order:${order.id}`).emit('rider:assigned', {
        rider: order.rider,
        tracking: order.tracking
      });
    }
    
    console.log(`Order ${orderId} assigned to rider ${rider.name} (${distance.toFixed(2)}km away, ETA: ${eta} min)`);
    
    return {
      success: true,
      message: 'Rider assigned successfully',
      rider: order.rider,
      distance,
      eta
    };
  } catch (err) {
    console.error('Auto-assign rider error:', err);
    return { success: false, message: err.message };
  }
}
