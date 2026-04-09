import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  vehicle: {
    vehicleType: { type: String },
    plateNumber: { type: String }
  },
  status: { type: String, enum: ['available', 'busy', 'offline'], default: 'offline' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  deliveries: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  currentOrderId: { type: String }
}, { timestamps: true });

export const Rider = mongoose.model('Rider', riderSchema);
