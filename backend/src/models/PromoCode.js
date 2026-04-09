import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['percentage', 'fixed'] 
  },
  value: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number },
  usageLimit: { type: Number, default: null }, // null means unlimited
  usedCount: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index for efficient lookups
promoCodeSchema.index({ code: 1, isActive: 1 });
promoCodeSchema.index({ endDate: 1 });

export const PromoCode = mongoose.model('PromoCode', promoCodeSchema);