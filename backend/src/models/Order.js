import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  selectedVariants: [{
    variantId: String,
    optionId: String,
    name: String,
    value: String
  }],
  totalPrice: { type: Number, required: true }
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String }
});

const deliveryAddressSchema = new mongoose.Schema({
  label: { type: String },
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  instructions: { type: String }
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
  updatedBy: { type: String }
});

const riderSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  vehicleType: { type: String },
  vehicleNumber: { type: String },
  rating: { type: Number }
});

const trackingSchema = new mongoose.Schema({
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  lastUpdated: { type: Date },
  eta: { type: Date },
  distance: { type: Number }
});

const cancellationSchema = new mongoose.Schema({
  reason: { type: String },
  cancelledBy: { 
    type: String, 
    enum: ['customer', 'shop', 'rider', 'system'] 
  },
  refundStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'not_applicable'],
    default: 'pending'
  },
  refundAmount: { type: Number, default: 0 },
  refundId: { type: String },
  refundedAt: { type: Date }
});

const reviewSchema = new mongoose.Schema({
  shopRating: { type: Number, min: 1, max: 5 },
  riderRating: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const pricingSchema = new mongoose.Schema({
  subtotal: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  promoCode: { type: String },
  platformFee: { type: Number, default: 0 },
  emergencyFee: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const paymentSchema = new mongoose.Schema({
  method: { 
    type: String, 
    enum: ['cod', 'card', 'wallet', 'upi', 'jazzcash'],
    default: 'cod'
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: { type: String },
  paidAt: { type: Date }
});

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  orderNumber: { type: String, required: true, unique: true },
  
  // Customer
  userId: { type: String, required: true, index: true },
  customer: { type: customerSchema, required: true },
  
  // Shop
  shopId: { type: String, required: true, index: true },
  shopName: { type: String },
  
  // Items
  items: [orderItemSchema],
  
  // Pricing
  pricing: { type: pricingSchema, required: true },
  
  // Delivery
  deliveryAddress: { type: deliveryAddressSchema, required: true },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'assigned'],
    default: 'pending',
    index: true
  },
  statusHistory: [statusHistorySchema],
  
  // Rider
  rider: { type: riderSchema },
  riderId: { type: String }, // Removed index: true
  
  // Top-level total for quick access
  total: { type: Number },
  
  // Tracking
  tracking: { type: trackingSchema },
  
  // Payment
  payment: { type: paymentSchema, default: () => ({}) },
  
  // Cancellation
  cancellation: { type: cancellationSchema },
  
  // Review
  isReviewed: { type: Boolean, default: false },
  review: { type: reviewSchema },
  
  // Special Instructions
  specialInstructions: { type: String },
  isEmergency: { type: Boolean, default: false },
  
  // Timestamps
  placedAt: { type: Date, default: Date.now, index: true },
  confirmedAt: { type: Date },
  preparingAt: { type: Date },
  readyAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, status: 1 });
orderSchema.index({ riderId: 1 });

export const Order = mongoose.model('Order', orderSchema);
