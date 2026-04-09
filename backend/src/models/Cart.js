import mongoose from 'mongoose';

const selectedVariantSchema = new mongoose.Schema({
  variantId: { type: String, required: true },
  optionId: { type: String, required: true },
  name: { type: String, required: true },
  priceAdjustment: { type: Number, default: 0 }
});

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  shopId: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  selectedVariants: [selectedVariantSchema],
  totalPrice: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now }
});

const pricingSchema = new mongoose.Schema({
  subtotal: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
});

const promoAppliedSchema = new mongoose.Schema({
  code: { type: String },
  discountType: { type: String, enum: ['percentage', 'fixed'] },
  discountValue: { type: Number },
  minOrderAmount: { type: Number }
});

const cartSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  shopId: { type: String },
  shopName: { type: String },
  items: [cartItemSchema],
  pricing: { type: pricingSchema, default: () => ({}) },
  promoCode: { type: String },
  promoApplied: { type: promoAppliedSchema }
}, { timestamps: true });

// Indexes
cartSchema.index({ userId: 1 }, { unique: true });
cartSchema.index({ shopId: 1 });

export const Cart = mongoose.model('Cart', cartSchema);
