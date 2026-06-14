import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import {
  User,
  Category,
  Shop,
  Product,
  Rider,
  Order,
  AdminSettings,
  Content,
  PromoCode,
  Notification
} from '../models/index.js';

const router = Router();

// Secret key to protect the seed endpoint
const SEED_SECRET = process.env.SEED_SECRET || 'seed-grabgo-2024';

router.post('/', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== SEED_SECRET) {
      return res.status(403).json({ success: false, message: 'Invalid seed secret' });
    }

    // Check if already seeded
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      return res.json({ success: true, message: 'Database already seeded', skipped: true });
    }

    const credentials = {
      customer: 'customer123',
      vendor: 'vendor123',
      rider: 'rider123',
      admin: 'admin123'
    };

    // Create users
    const users = await Promise.all([
      User.create({
        id: nanoid(),
        name: 'Riya Shah',
        email: 'riya@grabgo.app',
        passwordHash: await bcrypt.hash(credentials.customer, 10),
        role: 'Customer',
        phone: '+92 300 1234567'
      }),
      User.create({
        id: nanoid(),
        name: 'Logan Carter',
        email: 'logan@grabgo.app',
        passwordHash: await bcrypt.hash(credentials.vendor, 10),
        role: 'Vendor',
        phone: '+92 300 2345678'
      }),
      User.create({
        id: nanoid(),
        name: 'Amber Rider',
        email: 'amber@grabgo.app',
        passwordHash: await bcrypt.hash(credentials.rider, 10),
        role: 'Rider',
        phone: '+92 300 3456789'
      }),
      User.create({
        id: nanoid(),
        name: 'Admin User',
        email: 'admin@grabgo.app',
        passwordHash: await bcrypt.hash(credentials.admin, 10),
        role: 'Admin',
        phone: '+92 300 0000000'
      })
    ]);

    // Create categories
    const categories = await Promise.all([
      Category.create({ id: nanoid(), name: 'Grocery', slug: 'grocery', description: 'Fresh groceries delivered', color: '#22c55e' }),
      Category.create({ id: nanoid(), name: 'Pharmacy', slug: 'pharmacy', description: 'Medicines & health products', color: '#3b82f6' }),
      Category.create({ id: nanoid(), name: 'Bakery', slug: 'bakery', description: 'Fresh bread & pastries', color: '#f59e0b' }),
      Category.create({ id: nanoid(), name: 'Electronics', slug: 'electronics', description: 'Gadgets & accessories', color: '#8b5cf6' }),
      Category.create({ id: nanoid(), name: 'Fashion', slug: 'fashion', description: 'Clothing & accessories', color: '#ec4899' })
    ]);

    // Create shops
    const vendorUser = users[1];
    const shops = await Promise.all([
      Shop.create({
        id: nanoid(),
        name: 'Fresh Mart Grocery',
        description: 'Your one-stop grocery shop',
        vendorId: vendorUser.id,
        categoryId: categories[0].id,
        address: 'Main Boulevard, Lahore',
        location: { type: 'Point', coordinates: [74.3587, 31.5204] },
        phone: '+92 42 1234567',
        isOpen: true,
        rating: 4.5,
        deliveryFee: 50,
        minOrder: 200
      }),
      Shop.create({
        id: nanoid(),
        name: 'City Pharmacy',
        description: 'Trusted pharmacy near you',
        vendorId: vendorUser.id,
        categoryId: categories[1].id,
        address: 'Gulberg Main Market, Lahore',
        location: { type: 'Point', coordinates: [74.3453, 31.5104] },
        phone: '+92 42 2345678',
        isOpen: true,
        rating: 4.7,
        deliveryFee: 80,
        minOrder: 100
      }),
      Shop.create({
        id: nanoid(),
        name: 'Sweet Delights Bakery',
        description: 'Freshly baked goods daily',
        vendorId: vendorUser.id,
        categoryId: categories[2].id,
        address: 'DHA Phase 5, Lahore',
        location: { type: 'Point', coordinates: [74.3700, 31.5000] },
        phone: '+92 42 3456789',
        isOpen: true,
        rating: 4.8,
        deliveryFee: 60,
        minOrder: 150
      })
    ]);

    // Create products
    await Promise.all([
      Product.create({ id: nanoid(), shopId: shops[0].id, name: 'Fresh Milk 1L', price: 220, stock: 50, categoryId: categories[0].id, description: 'Pure fresh milk' }),
      Product.create({ id: nanoid(), shopId: shops[0].id, name: 'Basmati Rice 5kg', price: 850, stock: 30, categoryId: categories[0].id, description: 'Premium basmati rice' }),
      Product.create({ id: nanoid(), shopId: shops[0].id, name: 'Cooking Oil 5L', price: 1800, stock: 25, categoryId: categories[0].id, description: 'Pure cooking oil' }),
      Product.create({ id: nanoid(), shopId: shops[1].id, name: 'Panadol 24 Tabs', price: 120, stock: 100, categoryId: categories[1].id, description: 'Pain relief tablets' }),
      Product.create({ id: nanoid(), shopId: shops[1].id, name: 'Vitamin C 60 Tabs', price: 450, stock: 40, categoryId: categories[1].id, description: 'Immunity booster' }),
      Product.create({ id: nanoid(), shopId: shops[2].id, name: 'Chocolate Cake', price: 1200, stock: 10, categoryId: categories[2].id, description: 'Rich chocolate cake' }),
      Product.create({ id: nanoid(), shopId: shops[2].id, name: 'Croissant Pack', price: 350, stock: 20, categoryId: categories[2].id, description: 'Fresh butter croissants' })
    ]);

    // Create rider
    const riderUser = users[2];
    await Rider.create({
      id: nanoid(),
      userId: riderUser.id,
      name: riderUser.name,
      phone: riderUser.phone,
      vehicle: 'Motorbike',
      isOnline: true,
      location: { type: 'Point', coordinates: [74.3587, 31.5204] },
      rating: 4.9,
      totalDeliveries: 0,
      earnings: 0
    });

    // Admin settings
    await AdminSettings.create({
      id: nanoid(),
      commissionRate: 10,
      deliveryFee: 50,
      currency: 'PKR',
      minOrderAmount: 100,
      maxDeliveryDistance: 50,
      maintenanceMode: false,
      supportEmail: 'support@grabgo.app',
      supportPhone: '+92 300 0000000'
    });

    // Content
    await Content.create({
      id: nanoid(),
      heroTitle: 'Grab & Go - Fast Delivery',
      heroSubtitle: 'Order groceries, pharmacy, bakery & more',
      heroButtonText: 'Shop Now',
      footerText: '© 2024 Grab & Go. All rights reserved.'
    });

    // Promo codes
    await Promise.all([
      PromoCode.create({ id: nanoid(), code: 'WELCOME10', discount: 10, type: 'percentage', minOrder: 500, maxUses: 100, isActive: true }),
      PromoCode.create({ id: nanoid(), code: 'FLAT50', discount: 50, type: 'fixed', minOrder: 300, maxUses: 50, isActive: true })
    ]);

    res.json({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        users: users.length,
        categories: categories.length,
        shops: shops.length,
        products: 7,
        riders: 1,
        settings: 1,
        promoCodes: 2
      },
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
