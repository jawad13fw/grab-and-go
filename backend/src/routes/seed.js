import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import {
  User,
  Category,
  Shop,
  Product,
  Rider,
  AdminSettings,
  Content,
  PromoCode,
} from '../models/index.js';

const router = Router();

const SEED_SECRET = process.env.SEED_SECRET || 'seed-grabgo-2024';

router.post('/', async (req, res) => {
  try {
    const { secret, force } = req.body;
    if (secret !== SEED_SECRET) {
      return res.status(403).json({ success: false, message: 'Invalid seed secret' });
    }

    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin && !force) {
      return res.json({ success: true, message: 'Database already seeded', skipped: true });
    }

    // Clear existing data if force reset
    if (existingAdmin && force) {
      await Promise.all([
        User.deleteMany({}),
        Category.deleteMany({}),
        Shop.deleteMany({}),
        Product.deleteMany({}),
        Rider.deleteMany({}),
        AdminSettings.deleteMany({}),
        Content.deleteMany({}),
        PromoCode.deleteMany({})
      ]);
    }

    // --- Users ---
    const customer = await User.create({
      id: nanoid(), name: 'Riya Shah', email: 'riya@grabgo.app',
      passwordHash: await bcrypt.hash('customer123', 10), role: 'Customer', phone: '+92 300 1234567'
    });
    const vendor = await User.create({
      id: nanoid(), name: 'Logan Carter', email: 'logan@grabgo.app',
      passwordHash: await bcrypt.hash('vendor123', 10), role: 'Vendor', phone: '+92 300 2345678'
    });
    const riderUser = await User.create({
      id: nanoid(), name: 'Amber Rider', email: 'amber@grabgo.app',
      passwordHash: await bcrypt.hash('rider123', 10), role: 'Rider', phone: '+92 300 3456789'
    });
    await User.create({
      id: nanoid(), name: 'Admin User', email: 'admin@grabgo.app',
      passwordHash: await bcrypt.hash('admin123', 10), role: 'Admin', phone: '+92 300 0000000'
    });

    // --- Categories ---
    const cats = await Promise.all([
      Category.create({ id: nanoid(), name: 'Grocery', icon: '🛒', image: 'https://via.placeholder.com/300x200?text=Grocery' }),
      Category.create({ id: nanoid(), name: 'Pharmacy', icon: '💊', image: 'https://via.placeholder.com/300x200?text=Pharmacy' }),
      Category.create({ id: nanoid(), name: 'Bakery', icon: '🍞', image: 'https://via.placeholder.com/300x200?text=Bakery' }),
      Category.create({ id: nanoid(), name: 'Electronics', icon: '📱', image: 'https://via.placeholder.com/300x200?text=Electronics' }),
      Category.create({ id: nanoid(), name: 'Fashion', icon: '👗', image: 'https://via.placeholder.com/300x200?text=Fashion' })
    ]);

    // --- Shops ---
    const shops = await Promise.all([
      Shop.create({
        id: nanoid(), name: 'Fresh Mart Grocery', vendorId: vendor.id,
        category: cats[0].name, description: 'Your one-stop grocery shop',
        address: 'Main Boulevard, Lahore', phone: '+92 42 1234567',
        deliveryTime: '20-30 min', deliveryFee: 50, minOrder: 200,
        image: 'https://via.placeholder.com/400x300?text=Fresh+Mart', rating: 4.5, reviews: 120,
        coordinates: { lat: 31.5204, lng: 74.3587 }, tags: ['grocery', 'fresh'], isActive: true
      }),
      Shop.create({
        id: nanoid(), name: 'City Pharmacy', vendorId: vendor.id,
        category: cats[1].name, description: 'Trusted pharmacy near you',
        address: 'Gulberg Main Market, Lahore', phone: '+92 42 2345678',
        deliveryTime: '15-25 min', deliveryFee: 80, minOrder: 100,
        image: 'https://via.placeholder.com/400x300?text=City+Pharmacy', rating: 4.7, reviews: 85,
        coordinates: { lat: 31.5104, lng: 74.3453 }, tags: ['pharmacy', 'health'], isActive: true
      }),
      Shop.create({
        id: nanoid(), name: 'Sweet Delights Bakery', vendorId: vendor.id,
        category: cats[2].name, description: 'Freshly baked goods daily',
        address: 'DHA Phase 5, Lahore', phone: '+92 42 3456789',
        deliveryTime: '25-35 min', deliveryFee: 60, minOrder: 150,
        image: 'https://via.placeholder.com/400x300?text=Sweet+Delights', rating: 4.8, reviews: 200,
        coordinates: { lat: 31.5000, lng: 74.3700 }, tags: ['bakery', 'cakes'], isActive: true
      })
    ]);

    // --- Products ---
    const productData = [
      { shopIdx: 0, name: 'Fresh Milk 1L', price: 220, stock: 50, catIdx: 0, desc: 'Pure fresh milk' },
      { shopIdx: 0, name: 'Basmati Rice 5kg', price: 850, stock: 30, catIdx: 0, desc: 'Premium basmati rice' },
      { shopIdx: 0, name: 'Cooking Oil 5L', price: 1800, stock: 25, catIdx: 0, desc: 'Pure cooking oil' },
      { shopIdx: 0, name: 'Eggs (12 pack)', price: 360, stock: 40, catIdx: 0, desc: 'Farm fresh eggs' },
      { shopIdx: 1, name: 'Panadol 24 Tabs', price: 120, stock: 100, catIdx: 1, desc: 'Pain relief tablets' },
      { shopIdx: 1, name: 'Vitamin C 60 Tabs', price: 450, stock: 40, catIdx: 1, desc: 'Immunity booster' },
      { shopIdx: 1, name: 'Bandage Roll', price: 80, stock: 60, catIdx: 1, desc: 'Medical bandage roll' },
      { shopIdx: 2, name: 'Chocolate Cake', price: 1200, stock: 10, catIdx: 2, desc: 'Rich chocolate cake' },
      { shopIdx: 2, name: 'Croissant Pack', price: 350, stock: 20, catIdx: 2, desc: 'Fresh butter croissants' },
      { shopIdx: 2, name: 'Garlic Bread', price: 280, stock: 15, catIdx: 2, desc: 'Cheesy garlic bread' }
    ];

    await Promise.all(productData.map(p =>
      Product.create({
        id: nanoid(), shopId: shops[p.shopIdx].id, shopName: shops[p.shopIdx].name,
        name: p.name, description: p.desc, price: p.price, stock: p.stock,
        category: cats[p.catIdx].name,
        image: `https://via.placeholder.com/300x200?text=${encodeURIComponent(p.name)}`,
        rating: 4.0 + Math.random(), reviews: Math.floor(Math.random() * 50), isAvailable: true
      })
    ));

    // --- Rider ---
    await Rider.create({
      id: nanoid(), userId: riderUser.id, name: riderUser.name, phone: riderUser.phone,
      email: riderUser.email, vehicle: { vehicleType: 'Motorbike', plateNumber: 'LE-2024-0001' },
      status: 'available', rating: 4.9, deliveries: 0, earnings: 0,
      location: { lat: 31.5204, lng: 74.3587 }
    });

    // --- Admin Settings ---
    await AdminSettings.create({
      deliveryFee: 50, riderCommission: 15, shopCommission: 10,
      platformFee: 5, minWithdrawal: 500, maxWithdrawal: 50000
    });

    // --- Content ---
    await Content.create({
      type: 'hero',
      data: {
        title: 'Grab & Go - Fast Delivery',
        subtitle: 'Order groceries, pharmacy, bakery & more',
        buttonText: 'Shop Now'
      }
    });

    // --- Promo Codes ---
    await Promise.all([
      PromoCode.create({
        id: nanoid(), code: 'WELCOME10', type: 'percentage', value: 10,
        minOrderAmount: 500, usageLimit: 100, isActive: true,
        startDate: new Date(), endDate: new Date(Date.now() + 90 * 86400000)
      }),
      PromoCode.create({
        id: nanoid(), code: 'FLAT50', type: 'fixed', value: 50,
        minOrderAmount: 300, usageLimit: 50, isActive: true,
        startDate: new Date(), endDate: new Date(Date.now() + 90 * 86400000)
      })
    ]);

    res.json({
      success: true,
      message: 'Database seeded successfully!',
      data: { users: 4, categories: 5, shops: 3, products: 10, riders: 1, promoCodes: 2 },
      logins: {
        customer: { email: 'riya@grabgo.app', password: 'customer123' },
        vendor: { email: 'logan@grabgo.app', password: 'vendor123' },
        rider: { email: 'amber@grabgo.app', password: 'rider123' },
        admin: { email: 'admin@grabgo.app', password: 'admin123' }
      }
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
