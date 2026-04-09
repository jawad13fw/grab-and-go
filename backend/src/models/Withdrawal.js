import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  userType: { type: String, enum: ['rider', 'vendor'], required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  paymentMethod: { type: String, required: true },
  paymentDetails: { type: mongoose.Schema.Types.Mixed },
  processedAt: { type: Date },
  processedBy: { type: String },
  notes: { type: String }
}, { timestamps: true });

withdrawalSchema.index({ status: 1 });

export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
