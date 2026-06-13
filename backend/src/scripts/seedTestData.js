import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { connectDB, disconnectDB } from '../db/mongoose.js';
import {
  User,
  Category,
  Shop,
  Product,
  Rider,
  Order,
  AdminSettings,
  Ticket,
  AuditLog,
  Content,
  RiderEarning,
  Withdrawal,
  Cart,
  Review,
  Notification,
  PromoCode
} from '../models/index.js';

const credentials = {
  customer: 'customer123',
  vendor: 'vendor123',
  rider: 'rider123',
  admin: 'admin123'
};

const sharedAddress = {
  id: 'addr-1',
  label: 'Home',
  address: 'C Block, Vehari, Punjab, Pakistan',
  coordinates: { lat: 30.0453, lng: 72.3596 },
  isDefault: true,
  instructions: 'Call on arrival'
};

async function clearCollections() {
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Shop.deleteMany({}),
    Product.deleteMany({}),
    Rider.deleteMany({}),
    Order.deleteMany({}),
    AdminSettings.deleteMany({}),
    Ticket.deleteMany({}),
    AuditLog.deleteMany({}),
    Content.deleteMany({}),
    RiderEarning.deleteMany({}),
    Withdrawal.deleteMany({}),
    Cart.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
    PromoCode.deleteMany({})
  ]);
}

async function seed() {
  await connectDB();
  await clearCollections();

  const users = [
    {
      id: 'user-customer-1',
      name: 'Riya Patel',
      email: 'riya@grabgo.app',
      phone: '+92 300 1111111',
      passwordHash: await bcrypt.hash(credentials.customer, 10),
      role: 'Customer',
      addresses: [sharedAddress],
      favorites: ['shop-grocery-1'],
      ordersCount: 1,
      emailVerified: true
    },
    {
      id: 'user-vendor-1',
      name: 'Logan Diaz',
      email: 'logan@grabgo.app',
      phone: '+92 300 2222222',
      passwordHash: await bcrypt.hash(credentials.vendor, 10),
      role: 'Vendor',
      shopId: 'shop-grocery-1',
      emailVerified: true
    },
    {
      id: 'user-rider-1',
      name: 'Amber Chen',
      email: 'amber@grabgo.app',
      phone: '+92 300 3333333',
      passwordHash: await bcrypt.hash(credentials.rider, 10),
      role: 'Rider',
      riderId: 'rider-1',
      deliveries: 12,
      emailVerified: true
    },
    {
      id: 'user-admin-1',
      name: 'Maya Fowler',
      email: 'admin@grabgo.app',
      phone: '+92 300 4444444',
      passwordHash: await bcrypt.hash(credentials.admin, 10),
      role: 'Admin',
      emailVerified: true
    }
  ];

  const categories = [
    { id: 'grocery', name: 'Grocery', icon: 'ShoppingCart', image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&q=60' },
    { id: 'bakery', name: 'Bakery', icon: 'Cake', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=60' },
    { id: 'pharmacy', name: 'Pharmacy', icon: 'Pill', image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=60' }
  ];

  const shops = [
    {
      id: 'shop-grocery-1',
      name: 'Haji Anwar Karyana & General Store',
      category: 'grocery',
      rating: 4.6,
      reviews: 18,
      deliveryTime: '20-30 min',
      deliveryFee: 40,
      minOrder: 250,
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&q=60',
      tags: ['Daily Groceries', 'Packaged Food', 'Beverages'],
      address: 'Vehari, Punjab, Pakistan',
      phone: '+92 306 3695006',
      hours: '8:00 AM - 10:00 PM',
      coordinates: { lat: 30.0443, lng: 72.3586 },
      vendorId: 'user-vendor-1',
      description: 'Quick everyday grocery store for test orders.'
    },
    {
      id: 'shop-bakery-1',
      name: 'Bites & Bakers',
      category: 'bakery',
      rating: 4.4,
      reviews: 10,
      deliveryTime: '15-25 min',
      deliveryFee: 30,
      minOrder: 200,
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=60',
      tags: ['Bread', 'Cakes', 'Snacks'],
      address: 'Club Road, Vehari',
      phone: '+92 300 5555555',
      hours: '7:00 AM - 11:00 PM',
      coordinates: { lat: 30.0463, lng: 72.3606 },
      vendorId: 'user-vendor-1',
      description: 'Simple bakery shop for browsing and checkout testing.'
    },
    {
      id: 'shop-pharmacy-1',
      name: 'Mian Pharmacy',
      category: 'pharmacy',
      rating: 4.8,
      reviews: 22,
      deliveryTime: '10-20 min',
      deliveryFee: 20,
      minOrder: 150,
      image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=60',
      tags: ['Medicines', 'Health', '24/7'],
      address: 'Vehari, Punjab, Pakistan',
      phone: '+92 300 6666666',
      hours: '24 Hours',
      coordinates: { lat: 30.0433, lng: 72.3596 },
      vendorId: 'user-vendor-1',
      description: 'Pharmacy for testing the pharmacy category flow.'
    }
  ];

  const products = [
    {
      id: 'product-rice-1',
      name: 'Basmati Rice 5kg',
      description: 'Premium basmati rice bag for everyday cooking.',
      price: 1350,
      originalPrice: 1500,
      image: 'https://images.unsplash.com/photo-1517244683847-7456b63c4a34?w=600&q=60',
      images: ['https://images.unsplash.com/photo-1517244683847-7456b63c4a34?w=600&q=60'],
      category: 'grocery',
      shopId: 'shop-grocery-1',
      shopName: 'Haji Anwar Karyana & General Store',
      stock: 20,
      rating: 4.7,
      reviews: 12,
      isAvailable: true,
      tags: ['Rice', 'Staple Food']
    },
    {
      id: 'product-bread-1',
      name: 'Fresh Loaf Bread',
      description: 'Soft fresh bread loaf baked today.',
      price: 180,
      originalPrice: 220,
      image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&q=60',
      images: ['https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&q=60'],
      category: 'bakery',
      shopId: 'shop-bakery-1',
      shopName: 'Bites & Bakers',
      stock: 40,
      rating: 4.5,
      reviews: 9,
      isAvailable: true,
      tags: ['Bread', 'Breakfast']
    },
    {
      id: 'product-medicine-1',
      name: 'Paracetamol 500mg',
      description: 'Common pain relief tablets, test item only.',
      price: 120,
      originalPrice: 150,
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=60',
      images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=60'],
      category: 'pharmacy',
      shopId: 'shop-pharmacy-1',
      shopName: 'Mian Pharmacy',
      stock: 100,
      rating: 4.8,
      reviews: 25,
      isAvailable: true,
      tags: ['Medicine', 'Pain Relief']
    }
  ];

  const riders = [
    {
      id: 'rider-1',
      userId: 'user-rider-1',
      name: 'Amber Chen',
      phone: '+92 300 3333333',
      email: 'amber@grabgo.app',
      vehicle: {
        vehicleType: 'Bike',
        plateNumber: 'VEH-1234'
      },
      status: 'available',
      rating: 4.9,
      location: { lat: 30.0443, lng: 72.3586 }
    }
  ];

  const order = {
    id: 'order-1',
    orderNumber: 'ORD-10001',
    userId: 'user-customer-1',
    customer: {
      name: 'Riya Patel',
      phone: '+92 300 1111111',
      email: 'riya@grabgo.app'
    },
    shopId: 'shop-grocery-1',
    shopName: 'Haji Anwar Karyana & General Store',
    items: [
      {
        productId: 'product-rice-1',
        name: 'Basmati Rice 5kg',
        image: 'https://images.unsplash.com/photo-1517244683847-7456b63c4a34?w=600&q=60',
        price: 1350,
        quantity: 1,
        totalPrice: 1350,
        selectedVariants: []
      }
    ],
    pricing: {
      subtotal: 1350,
      deliveryFee: 40,
      tax: 0,
      discount: 0,
      platformFee: 0,
      emergencyFee: 0,
      total: 1390
    },
    deliveryAddress: {
      label: 'Home',
      address: 'C Block, Vehari, Punjab, Pakistan',
      coordinates: { lat: 30.0453, lng: 72.3596 },
      instructions: 'Call on arrival'
    },
    status: 'confirmed',
    statusHistory: [
      { status: 'pending', timestamp: new Date(Date.now() - 60 * 60 * 1000), updatedBy: 'seed' },
      { status: 'confirmed', timestamp: new Date(Date.now() - 45 * 60 * 1000), updatedBy: 'seed' }
    ],
    rider: {
      id: 'rider-1',
      name: 'Amber Chen',
      phone: '+92 300 3333333',
      vehicleType: 'Bike',
      vehicleNumber: 'VEH-1234',
      rating: 4.9
    },
    riderId: 'rider-1',
    total: 1390,
    payment: {
      method: 'cod',
      status: 'pending'
    },
    placedAt: new Date(Date.now() - 60 * 60 * 1000),
    confirmedAt: new Date(Date.now() - 45 * 60 * 1000),
    updatedAt: new Date()
  };

  const adminSettings = [
    {
      id: 'admin-settings-1',
      deliveryFee: 40,
      riderCommission: 15,
      shopCommission: 10,
      platformFee: 5,
      minWithdrawal: 500,
      maxWithdrawal: 50000
    }
  ];

  const content = [
    { type: 'privacy-policy', data: { title: 'Privacy Policy', body: 'Test privacy policy content.' } },
    { type: 'terms-and-conditions', data: { title: 'Terms & Conditions', body: 'Test terms content.' } }
  ];

  const promoCodes = [
    { id: 'promo-1', code: 'TEST10', type: 'percentage', value: 10, maxDiscountAmount: 200, minOrderAmount: 1000, isActive: true }
  ];

  await Promise.all([
    User.insertMany(users),
    Category.insertMany(categories),
    Shop.insertMany(shops),
    Product.insertMany(products),
    Rider.insertMany(riders),
    Order.insertMany([order]),
    AdminSettings.insertMany(adminSettings),
    Content.insertMany(content),
    PromoCode.insertMany(promoCodes),
    Notification.insertMany([
      {
        id: 'notification-1',
        userId: 'user-customer-1',
        title: 'Sample order ready',
        message: 'Your sample order has been seeded for testing.',
        type: 'order_update',
        isRead: false
      }
    ])
  ]);

  await disconnectDB();
  console.log('Seeded test data successfully.');
  console.log('Test logins:');
  console.log('Customer: riya@grabgo.app / customer123');
  console.log('Vendor: logan@grabgo.app / vendor123');
  console.log('Rider: amber@grabgo.app / rider123');
  console.log('Admin: admin@grabgo.app / admin123');
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  try {
    await disconnectDB();
  } catch {
    // ignore disconnect errors in failure path
  }
  process.exit(1);
});