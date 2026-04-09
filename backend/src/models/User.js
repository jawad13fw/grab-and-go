import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Other' },
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  isDefault: { type: Boolean, default: false },
  instructions: { type: String }
});

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['Customer', 'Vendor', 'Rider', 'Admin'], default: 'Customer' },
  avatar: { type: String },
  
  // Customer-specific fields
  addresses: [addressSchema],
  favorites: [{ type: String }], // Array of shop IDs
  
  // Wallet
  wallet: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'PKR' }
  },
  
  // Stats
  ordersCount: { type: Number, default: 0 },
  shopId: { type: String },
  riderId: { type: String },
  deliveries: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  
  // Email verification fields
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  
  // Password reset fields
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date }
}, { timestamps: true });

// Indexes
// Removed redundant indexes for email and id; unique: true in schema handles this
userSchema.index({ phone: 1 });

export const User = mongoose.model('User', userSchema);
