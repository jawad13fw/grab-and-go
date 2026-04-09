import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  images: [{ type: String }],
  category: { type: String, required: true },
  shopId: { type: String, required: true, index: true },
  shopName: { type: String },
  stock: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  tags: [{ type: String }]
}, { timestamps: true });

productSchema.index({ category: 1 });

export const Product = mongoose.model('Product', productSchema);
