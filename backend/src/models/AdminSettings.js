import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema({
  deliveryFee: { type: Number, default: 2.5 },
  riderCommission: { type: Number, default: 15 },
  shopCommission: { type: Number, default: 10 },
  platformFee: { type: Number, default: 5 },
  minWithdrawal: { type: Number, default: 10 },
  maxWithdrawal: { type: Number, default: 1000 }
}, { timestamps: true });

export const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
