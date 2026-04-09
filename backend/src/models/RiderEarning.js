import mongoose from 'mongoose';

const riderEarningSchema = new mongoose.Schema({
  id: { type: String },
  riderId: { type: String, required: true, index: true },
  orderId: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['delivery', 'bonus', 'tip'], default: 'delivery' },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidAt: { type: Date }
}, { timestamps: true });

export const RiderEarning = mongoose.model('RiderEarning', riderEarningSchema);
