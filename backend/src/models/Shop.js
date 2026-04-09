import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  deliveryTime: { type: String, required: true },
  deliveryFee: { type: Number, required: true },
  minOrder: { type: Number, required: true },
  image: { type: String, required: true },
  banner: { type: String },
  tags: [{ type: String }],
  address: { type: String, required: true },
  phone: { type: String },
  hours: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  vendorId: { type: String, required: true, index: true },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Shop = mongoose.model('Shop', shopSchema);
