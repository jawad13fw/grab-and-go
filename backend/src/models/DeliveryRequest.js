import mongoose from 'mongoose';

const deliveryRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  pickup: {
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
    contactName: { type: String },
    contactPhone: { type: String }
  },
  dropoff: {
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
    contactName: { type: String },
    contactPhone: { type: String }
  },
  packageDetails: {
    description: { type: String },
    weight: { type: Number },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number }
    }
  },
  deliveryFee: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  riderId: { type: String },
  completedAt: { type: Date }
}, { timestamps: true });

deliveryRequestSchema.index({ userId: 1 });
deliveryRequestSchema.index({ status: 1 });

export const DeliveryRequest = mongoose.model('DeliveryRequest', deliveryRequestSchema);
