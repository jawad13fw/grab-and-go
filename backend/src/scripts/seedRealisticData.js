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
  PromoCode,
} from '../models/index.js';

const SCALE = Number(process.env.SEED_SCALE || 1);

const COUNTS = {
  customers: Math.max(120, Math.floor(120 * SCALE)),
  vendors: Math.max(22, Math.floor(22 * SCALE)),
  riders: Math.max(45, Math.floor(45 * SCALE)),
  shops: Math.max(55, Math.floor(55 * SCALE)),
  orders: Math.max(900, Math.floor(900 * SCALE)),
};

const PASSWORDS = {
  admin: 'admin123',
  customer: 'customer123',
  vendor: 'vendor123',
  rider: 'rider123',
  generated: 'Test@1234',
};

const CITIES = [
  {
    city: 'Lahore',
    province: 'Punjab',
    center: { lat: 31.5204, lng: 74.3587 },
    areas: ['DHA Phase 6', 'Johar Town', 'Model Town', 'Gulberg', 'Wapda Town'],
  },
  {
    city: 'Karachi',
    province: 'Sindh',
    center: { lat: 24.8607, lng: 67.0011 },
    areas: ['Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad', 'PECHS', 'Defence'],
  },
  {
    city: 'Islamabad',
    province: 'ICT',
    center: { lat: 33.6844, lng: 73.0479 },
    areas: ['F-7', 'F-10', 'G-11', 'I-8', 'Bahria Town'],
  },
  {
    city: 'Faisalabad',
    province: 'Punjab',
    center: { lat: 31.4504, lng: 73.135 },
    areas: ['D Ground', 'Madina Town', 'People Colony', 'Canal Road', 'Samanabad'],
  },
  {
    city: 'Rawalpindi',
    province: 'Punjab',
    center: { lat: 33.5651, lng: 73.0169 },
    areas: ['Saddar', 'Bahria Town', 'Satellite Town', 'Chaklala', 'PWD'],
  },
  {
    city: 'Multan',
    province: 'Punjab',
    center: { lat: 30.1575, lng: 71.5249 },
    areas: ['Cantt', 'Gulgasht', 'Bosan Road', 'Shah Rukn-e-Alam', 'New Multan'],
  },
];

const FIRST_NAMES = ['Ali', 'Ayesha', 'Fatima', 'Hassan', 'Hira', 'Imran', 'Usman', 'Noor', 'Ahmed', 'Zara', 'Bilal', 'Sana', 'Hamza', 'Mariam', 'Omar', 'Laiba', 'Arham', 'Areeba', 'Daniyal', 'Iqra'];
const LAST_NAMES = ['Khan', 'Malik', 'Raza', 'Bhatti', 'Qureshi', 'Siddiqui', 'Sheikh', 'Javed', 'Farooq', 'Nawaz', 'Hashmi', 'Chaudhry', 'Butt', 'Iqbal', 'Mehmood'];

const CATEGORY_CONFIG = [
  { id: 'grocery', name: 'Grocery', icon: 'ShoppingCart', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=60' },
  { id: 'bakery', name: 'Bakery', icon: 'Cake', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=60' },
  { id: 'pharmacy', name: 'Pharmacy', icon: 'Pill', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=60' },
  { id: 'electronics', name: 'Electronics', icon: 'DevicePhoneMobileIcon', image: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=800&q=60' },
  { id: 'fashion', name: 'Fashion', icon: 'SparklesIcon', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=60' },
  { id: 'restaurant', name: 'Restaurant', icon: 'FireIcon', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=60' },
];

const SHOP_BRANDS = {
  grocery: ['Fresh Basket', 'Metro Mart', 'Daily Needs', 'Green Cart', 'Urban Grocer'],
  bakery: ['Crust & Crumb', 'Bake House Co.', 'Morning Oven', 'Sweet Rise', 'Golden Bakery'],
  pharmacy: ['City Meds', 'Care Pharmacy', 'Health Hub', 'Wellness Point', 'Life Pharmacy'],
  electronics: ['Tech Horizon', 'Device Depot', 'SmartWare', 'NextGen Electronics', 'Circuit Point'],
  fashion: ['Thread Culture', 'Urban Vogue', 'Classic Wear', 'Style Avenue', 'Nimra Collection'],
  restaurant: ['Spice Kitchen', 'Tandoor Express', 'Burger District', 'Lahori Taste', 'Rice Bowl'],
};

const PRODUCT_LIBRARY = {
  grocery: [
    { name: 'Basmati Rice 5kg', min: 1100, max: 1850, tags: ['Rice', 'Staple'] },
    { name: 'Flour 10kg', min: 1200, max: 1900, tags: ['Atta', 'Baking'] },
    { name: 'Cooking Oil 5L', min: 2200, max: 3400, tags: ['Oil', 'Kitchen'] },
    { name: 'Sugar 2kg', min: 320, max: 470, tags: ['Sugar', 'Kitchen'] },
    { name: 'Milk 1L', min: 190, max: 320, tags: ['Dairy'] },
    { name: 'Eggs (Dozen)', min: 280, max: 440, tags: ['Breakfast'] },
    { name: 'Lentils 1kg', min: 320, max: 650, tags: ['Daal', 'Protein'] },
    { name: 'Mineral Water 1.5L', min: 90, max: 160, tags: ['Beverage'] },
  ],
  bakery: [
    { name: 'Sourdough Bread', min: 220, max: 480, tags: ['Bread'] },
    { name: 'Chocolate Cake (1lb)', min: 950, max: 2200, tags: ['Cake', 'Dessert'] },
    { name: 'Butter Croissant', min: 170, max: 390, tags: ['Pastry'] },
    { name: 'Chicken Patties (2pc)', min: 280, max: 540, tags: ['Snack'] },
    { name: 'Multigrain Loaf', min: 240, max: 420, tags: ['Healthy'] },
    { name: 'Cupcakes (Box of 6)', min: 650, max: 1400, tags: ['Dessert'] },
    { name: 'Brownie Slice', min: 220, max: 450, tags: ['Dessert'] },
  ],
  pharmacy: [
    { name: 'Paracetamol 500mg', min: 95, max: 190, tags: ['Medicine', 'Pain Relief'] },
    { name: 'Vitamin C Tablets', min: 420, max: 980, tags: ['Supplements'] },
    { name: 'Digital Thermometer', min: 650, max: 1800, tags: ['Health Device'] },
    { name: 'Hand Sanitizer 250ml', min: 260, max: 590, tags: ['Hygiene'] },
    { name: 'Cough Syrup 120ml', min: 240, max: 520, tags: ['Cold'] },
    { name: 'Blood Pressure Monitor', min: 3900, max: 9800, tags: ['Health Device'] },
    { name: 'First Aid Box', min: 850, max: 2200, tags: ['Emergency'] },
  ],
  electronics: [
    { name: 'USB-C Fast Charger 25W', min: 1300, max: 3500, tags: ['Mobile Accessory'] },
    { name: 'Wireless Earbuds', min: 3200, max: 14500, tags: ['Audio'] },
    { name: 'Bluetooth Speaker', min: 2800, max: 11000, tags: ['Audio'] },
    { name: 'Power Bank 20000mAh', min: 2800, max: 8400, tags: ['Battery'] },
    { name: 'Smart Watch', min: 5600, max: 32000, tags: ['Wearable'] },
    { name: 'LED Smart Bulb', min: 640, max: 1900, tags: ['Smart Home'] },
    { name: 'Laptop Cooling Pad', min: 1800, max: 5200, tags: ['Laptop Accessory'] },
  ],
  fashion: [
    { name: 'Men Cotton Kurta', min: 1900, max: 4800, tags: ['Men', 'Traditional'] },
    { name: 'Women Lawn Suit', min: 2800, max: 9500, tags: ['Women', 'Summer'] },
    { name: 'Casual Denim Jacket', min: 3600, max: 12000, tags: ['Outerwear'] },
    { name: 'Formal Shirt', min: 1800, max: 5200, tags: ['Men', 'Formal'] },
    { name: 'Sneakers', min: 3200, max: 14000, tags: ['Footwear'] },
    { name: 'Leather Handbag', min: 2900, max: 9800, tags: ['Women', 'Bags'] },
    { name: 'Sports Track Pants', min: 1500, max: 4200, tags: ['Activewear'] },
  ],
  restaurant: [
    { name: 'Chicken Biryani', min: 320, max: 720, tags: ['Rice', 'Meal'] },
    { name: 'Beef Burger', min: 450, max: 980, tags: ['Fast Food'] },
    { name: 'Chicken Karahi', min: 1400, max: 3200, tags: ['Desi'] },
    { name: 'Family Pizza', min: 1450, max: 3600, tags: ['Pizza'] },
    { name: 'Zinger Wrap', min: 390, max: 860, tags: ['Fast Food'] },
    { name: 'Club Sandwich', min: 420, max: 940, tags: ['Snack'] },
    { name: 'Cold Coffee', min: 290, max: 680, tags: ['Beverage'] },
  ],
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.round((Math.random() * (max - min) + min) * 10) / 10;
const pick = (arr) => arr[randomInt(0, arr.length - 1)];
const sample = (arr, count) => {
  const clone = [...arr];
  const out = [];
  while (clone.length && out.length < count) {
    out.push(clone.splice(randomInt(0, clone.length - 1), 1)[0]);
  }
  return out;
};

const geoOffset = (point, delta = 0.08) => ({
  lat: Number((point.lat + (Math.random() - 0.5) * delta).toFixed(6)),
  lng: Number((point.lng + (Math.random() - 0.5) * delta).toFixed(6)),
});

const makePhone = () => `+92 3${randomInt(0, 4)}${randomInt(10000000, 99999999)}`;
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const makeImage = (seed, width = 800, height = 600) => `https://picsum.photos/seed/${seed}/${width}/${height}`;

const makeName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

const makeAddress = (cityInfo) => {
  const area = pick(cityInfo.areas);
  const block = `${String.fromCharCode(65 + randomInt(0, 8))}-${randomInt(1, 15)}`;
  return {
    label: pick(['Home', 'Work', 'Other']),
    address: `${block}, ${area}, ${cityInfo.city}, ${cityInfo.province}, Pakistan`,
    coordinates: geoOffset(cityInfo.center, 0.11),
    instructions: pick(['Leave at door', 'Call on arrival', 'Ring the bell once']),
  };
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
    PromoCode.deleteMany({}),
  ]);
}

function makeStatusTimeline(placedAt) {
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
  const cancelledStatuses = ['pending', 'confirmed', 'preparing', 'cancelled'];
  const shouldCancel = Math.random() < 0.08;
  const line = shouldCancel ? cancelledStatuses : statuses;

  const history = [];
  let current = new Date(placedAt);
  for (const status of line) {
    history.push({ status, timestamp: new Date(current), updatedBy: 'seed-realistic' });
    current = new Date(current.getTime() + randomInt(8, 40) * 60000);
  }

  return {
    finalStatus: line[line.length - 1],
    history,
  };
}

async function seed() {
  await connectDB();
  await clearCollections();

  const generatedAt = new Date();
  const hashed = {
    admin: await bcrypt.hash(PASSWORDS.admin, 10),
    customer: await bcrypt.hash(PASSWORDS.customer, 10),
    vendor: await bcrypt.hash(PASSWORDS.vendor, 10),
    rider: await bcrypt.hash(PASSWORDS.rider, 10),
    generated: await bcrypt.hash(PASSWORDS.generated, 10),
  };

  const categories = CATEGORY_CONFIG.map((item) => ({ ...item }));

  const users = [];
  const customers = [];
  const vendors = [];
  const riderUsers = [];

  const adminUser = {
    id: 'user-admin-1',
    name: 'Maya Fowler',
    email: 'admin@grabgo.app',
    phone: '+92 300 4444444',
    passwordHash: hashed.admin,
    role: 'Admin',
    emailVerified: true,
    phoneVerified: true,
  };
  users.push(adminUser);

  const fixedCustomer = {
    id: 'user-customer-1',
    name: 'Riya Patel',
    email: 'riya@grabgo.app',
    phone: '+92 300 1111111',
    passwordHash: hashed.customer,
    role: 'Customer',
    addresses: [{ id: 'addr-fixed-1', ...makeAddress(pick(CITIES)), isDefault: true }],
    favorites: [],
    ordersCount: 0,
    emailVerified: true,
    phoneVerified: true,
  };
  users.push(fixedCustomer);
  customers.push(fixedCustomer);

  const fixedVendor = {
    id: 'user-vendor-1',
    name: 'Logan Diaz',
    email: 'logan@grabgo.app',
    phone: '+92 300 2222222',
    passwordHash: hashed.vendor,
    role: 'Vendor',
    shopId: null,
    emailVerified: true,
    phoneVerified: true,
  };
  users.push(fixedVendor);
  vendors.push(fixedVendor);

  const fixedRiderUser = {
    id: 'user-rider-1',
    name: 'Amber Chen',
    email: 'amber@grabgo.app',
    phone: '+92 300 3333333',
    passwordHash: hashed.rider,
    role: 'Rider',
    riderId: 'rider-1',
    deliveries: 0,
    emailVerified: true,
    phoneVerified: true,
  };
  users.push(fixedRiderUser);
  riderUsers.push(fixedRiderUser);

  for (let i = 2; i <= COUNTS.customers; i += 1) {
    const cityInfo = pick(CITIES);
    const name = makeName();
    const user = {
      id: `user-customer-${i}`,
      name,
      email: `${slug(name)}.${i}@mail.grabandgo.pk`,
      phone: makePhone(),
      passwordHash: hashed.generated,
      role: 'Customer',
      addresses: [
        { id: `addr-c-${i}-1`, ...makeAddress(cityInfo), label: 'Home', isDefault: true },
        { id: `addr-c-${i}-2`, ...makeAddress(cityInfo), label: 'Work', isDefault: false },
      ],
      favorites: [],
      ordersCount: 0,
      emailVerified: true,
      phoneVerified: randomInt(0, 1) === 1,
      lastLoginAt: new Date(Date.now() - randomInt(1, 45) * 24 * 60 * 60 * 1000),
    };
    users.push(user);
    customers.push(user);
  }

  for (let i = 2; i <= COUNTS.vendors; i += 1) {
    const name = makeName();
    const user = {
      id: `user-vendor-${i}`,
      name,
      email: `${slug(name)}.${i}@vendors.grabandgo.pk`,
      phone: makePhone(),
      passwordHash: hashed.generated,
      role: 'Vendor',
      shopId: null,
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: new Date(Date.now() - randomInt(1, 20) * 24 * 60 * 60 * 1000),
    };
    users.push(user);
    vendors.push(user);
  }

  for (let i = 2; i <= COUNTS.riders; i += 1) {
    const name = makeName();
    const riderId = `rider-${i}`;
    const user = {
      id: `user-rider-${i}`,
      name,
      email: `${slug(name)}.${i}@riders.grabandgo.pk`,
      phone: makePhone(),
      passwordHash: hashed.generated,
      role: 'Rider',
      riderId,
      deliveries: 0,
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: new Date(Date.now() - randomInt(0, 10) * 24 * 60 * 60 * 1000),
    };
    users.push(user);
    riderUsers.push(user);
  }

  const riders = riderUsers.map((u, idx) => {
    const cityInfo = CITIES[idx % CITIES.length];
    return {
      id: u.riderId,
      userId: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      vehicle: {
        vehicleType: pick(['Bike', 'Scooter', 'Car']),
        plateNumber: `PK-${randomInt(1000, 9999)}`,
      },
      status: idx % 5 === 0 ? 'offline' : pick(['available', 'available', 'busy']),
      rating: randomFloat(4.1, 4.9),
      deliveries: 0,
      earnings: 0,
      location: geoOffset(cityInfo.center, 0.15),
    };
  });

  const shops = [];
  const vendorById = new Map(vendors.map((v) => [v.id, v]));
  for (let i = 1; i <= COUNTS.shops; i += 1) {
    const category = CATEGORY_CONFIG[i % CATEGORY_CONFIG.length].id;
    const cityInfo = pick(CITIES);
    const vendor = vendors[(i - 1) % vendors.length];
    const brand = pick(SHOP_BRANDS[category]);
    const area = pick(cityInfo.areas);
    const name = `${brand} ${area}`;
    const id = `shop-${category}-${i}`;

    const shop = {
      id,
      name,
      category,
      rating: randomFloat(4.0, 4.9),
      reviews: randomInt(50, 2400),
      deliveryTime: `${randomInt(15, 45)}-${randomInt(46, 70)} min`,
      deliveryFee: randomInt(50, 180),
      minOrder: randomInt(300, 2500),
      image: makeImage(`shop-${category}-${i}`, 1200, 720),
      banner: makeImage(`shop-banner-${category}-${i}`, 1400, 600),
      tags: sample(['Fast delivery', 'Top rated', 'Best sellers', 'Family packs', 'Budget deals', 'Premium quality'], 3),
      address: `${randomInt(10, 99)} ${area}, ${cityInfo.city}, ${cityInfo.province}, Pakistan`,
      phone: makePhone(),
      hours: pick(['9:00 AM - 11:00 PM', '10:00 AM - 12:00 AM', '24 Hours', '8:00 AM - 10:00 PM']),
      coordinates: geoOffset(cityInfo.center, 0.12),
      vendorId: vendor.id,
      description: `${brand} serves ${cityInfo.city} with reliable ${category} delivery and consistent quality products.`,
      isActive: true,
    };

    shops.push(shop);

    if (!vendorById.get(vendor.id).shopId) {
      vendorById.get(vendor.id).shopId = id;
    }
  }

  const products = [];
  const productsByShop = new Map();
  for (const shop of shops) {
    const baseProducts = PRODUCT_LIBRARY[shop.category] || PRODUCT_LIBRARY.grocery;
    const perShopCount = randomInt(14, 24);
    const list = [];

    for (let i = 0; i < perShopCount; i += 1) {
      const template = baseProducts[i % baseProducts.length];
      const variantNo = i + 1;
      const price = randomInt(template.min, template.max);
      const originalPrice = randomInt(price, Math.round(price * 1.3));
      const product = {
        id: `prod-${shop.id}-${variantNo}`,
        name: `${template.name} ${variantNo > baseProducts.length ? `(${pick(['Value Pack', 'Premium', 'Family Size', 'Lite'])})` : ''}`.trim(),
        description: `${template.name} from ${shop.name}. Fresh stock, quick delivery, and quality checked for daily use.`,
        price,
        originalPrice,
        image: makeImage(`product-${shop.id}-${variantNo}`),
        images: [
          makeImage(`product-${shop.id}-${variantNo}`),
          makeImage(`product-${shop.id}-${variantNo}-2`),
        ],
        category: shop.category,
        shopId: shop.id,
        shopName: shop.name,
        stock: randomInt(8, 260),
        rating: randomFloat(3.8, 4.9),
        reviews: randomInt(8, 800),
        isAvailable: Math.random() > 0.06,
        tags: template.tags,
      };
      products.push(product);
      list.push(product);
    }

    productsByShop.set(shop.id, list);
  }

  const orderCountByUser = new Map(customers.map((u) => [u.id, 0]));
  const deliveriesByRider = new Map(riders.map((r) => [r.id, 0]));
  const earningsByRider = new Map(riders.map((r) => [r.id, 0]));

  const orders = [];
  for (let i = 1; i <= COUNTS.orders; i += 1) {
    const customer = pick(customers);
    const shop = pick(shops);
    const shopProducts = productsByShop.get(shop.id) || [];
    const itemCount = Math.min(shopProducts.length, randomInt(1, 4));
    const chosen = sample(shopProducts, itemCount);
    const placedAt = new Date(Date.now() - randomInt(0, 120) * 24 * 60 * 60 * 1000 - randomInt(0, 18) * 60 * 60 * 1000);

    const items = chosen.map((p) => {
      const quantity = randomInt(1, 3);
      return {
        productId: p.id,
        name: p.name,
        image: p.image,
        price: p.price,
        quantity,
        selectedVariants: [],
        totalPrice: p.price * quantity,
      };
    });

    const subtotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
    const discount = Math.random() < 0.18 ? Math.round(subtotal * randomFloat(0.05, 0.2)) : 0;
    const deliveryFee = shop.deliveryFee;
    const platformFee = Math.round(subtotal * 0.01);
    const tax = Math.round(subtotal * 0.03);
    const total = subtotal + deliveryFee + platformFee + tax - discount;

    const { finalStatus, history } = makeStatusTimeline(placedAt);
    const hasRider = ['ready', 'out_for_delivery', 'delivered'].includes(finalStatus) || Math.random() < 0.2;
    const rider = hasRider ? pick(riders) : null;

    if (finalStatus === 'delivered' && rider) {
      deliveriesByRider.set(rider.id, (deliveriesByRider.get(rider.id) || 0) + 1);
      earningsByRider.set(rider.id, (earningsByRider.get(rider.id) || 0) + Math.round(total * 0.12));
    }

    orderCountByUser.set(customer.id, (orderCountByUser.get(customer.id) || 0) + 1);

    const deliveryAddress = (customer.addresses || [])[0] || makeAddress(pick(CITIES));

    const order = {
      id: `order-${nanoid(10)}`,
      orderNumber: `ORD-${100000 + i}`,
      userId: customer.id,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
      shopId: shop.id,
      shopName: shop.name,
      items,
      pricing: {
        subtotal,
        deliveryFee,
        tax,
        discount,
        promoCode: discount > 0 ? pick(['SAVE10', 'DEAL15', 'WEEKEND20']) : undefined,
        platformFee,
        emergencyFee: 0,
        total,
      },
      deliveryAddress: {
        label: deliveryAddress.label,
        address: deliveryAddress.address,
        coordinates: deliveryAddress.coordinates,
        instructions: deliveryAddress.instructions,
      },
      status: finalStatus,
      statusHistory: history,
      rider: rider
        ? {
          id: rider.id,
          name: rider.name,
          phone: rider.phone,
          vehicleType: rider.vehicle?.vehicleType,
          vehicleNumber: rider.vehicle?.plateNumber,
          rating: rider.rating,
        }
        : undefined,
      riderId: rider ? rider.id : undefined,
      total,
      payment: {
        method: pick(['cod', 'card', 'wallet', 'jazzcash']),
        status: finalStatus === 'delivered' ? 'completed' : pick(['pending', 'pending', 'completed']),
      },
      placedAt,
      confirmedAt: history.find((h) => h.status === 'confirmed')?.timestamp,
      preparingAt: history.find((h) => h.status === 'preparing')?.timestamp,
      readyAt: history.find((h) => h.status === 'ready')?.timestamp,
      pickedUpAt: history.find((h) => h.status === 'out_for_delivery')?.timestamp,
      deliveredAt: history.find((h) => h.status === 'delivered')?.timestamp,
      cancelledAt: history.find((h) => h.status === 'cancelled')?.timestamp,
      updatedAt: history[history.length - 1]?.timestamp || placedAt,
      specialInstructions: Math.random() < 0.22 ? pick(['No onions please', 'Call before arrival', 'Pack separately', 'Leave at reception']) : undefined,
      isEmergency: Math.random() < 0.02,
    };

    orders.push(order);
  }

  for (const customer of customers) {
    customer.ordersCount = orderCountByUser.get(customer.id) || 0;
    customer.favorites = sample(shops.map((s) => s.id), randomInt(1, 5));
  }

  for (const rider of riders) {
    rider.deliveries = deliveriesByRider.get(rider.id) || 0;
    rider.earnings = earningsByRider.get(rider.id) || 0;

    const riderUser = riderUsers.find((u) => u.riderId === rider.id);
    if (riderUser) {
      riderUser.deliveries = rider.deliveries;
    }
  }

  const deliveredOrders = orders.filter((o) => o.status === 'delivered' && o.riderId);
  const reviews = deliveredOrders.slice(0, Math.floor(deliveredOrders.length * 0.42)).map((order) => ({
    id: `rev-${nanoid(10)}`,
    orderId: order.id,
    userId: order.userId,
    shopId: order.shopId,
    riderId: order.riderId,
    shopRating: randomInt(3, 5),
    riderRating: randomInt(3, 5),
    shopReview: {
      comment: pick([
        'Fresh and well packed items.',
        'Delivery was quick and accurate.',
        'Quality matched expectations.',
        'Good value for money.',
      ]),
      tags: sample(['Fresh', 'Fast delivery', 'Great packaging', 'Value', 'Friendly support'], 2),
    },
    riderReview: {
      comment: pick([
        'Rider was polite and on time.',
        'Smooth handover, no issues.',
        'Excellent service and communication.',
      ]),
      tags: sample(['On time', 'Polite', 'Professional'], 2),
    },
    helpful: randomInt(0, 28),
    isVisible: true,
    createdAt: new Date(order.deliveredAt || order.updatedAt || Date.now()),
    updatedAt: new Date(order.deliveredAt || order.updatedAt || Date.now()),
  }));

  const carts = sample(customers, Math.min(customers.length, 70)).map((customer, idx) => {
    const shop = pick(shops);
    const items = sample(productsByShop.get(shop.id) || [], randomInt(1, 3)).map((product) => {
      const quantity = randomInt(1, 2);
      return {
        productId: product.id,
        shopId: shop.id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
        selectedVariants: [],
        totalPrice: product.price * quantity,
        addedAt: new Date(Date.now() - randomInt(0, 96) * 60 * 60 * 1000),
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const deliveryFee = shop.deliveryFee;
    const tax = Math.round(subtotal * 0.03);

    return {
      id: `cart-${idx + 1}`,
      userId: customer.id,
      shopId: shop.id,
      shopName: shop.name,
      items,
      pricing: {
        subtotal,
        deliveryFee,
        tax,
        discount: 0,
        total: subtotal + deliveryFee + tax,
      },
    };
  });

  const notifications = orders.slice(0, 500).map((order, idx) => ({
    id: `not-seed-${idx + 1}`,
    userId: order.userId,
    type: 'order_update',
    title: `Order ${order.orderNumber} update`,
    message: `Your order from ${order.shopName} is currently ${String(order.status).replaceAll('_', ' ')}.`,
    data: {
      orderId: order.id,
      shopId: order.shopId,
      screen: 'TrackOrder',
    },
    priority: ['cancelled'].includes(order.status) ? 'high' : 'normal',
    isRead: Math.random() < 0.45,
    createdAt: new Date(order.updatedAt || order.placedAt),
    updatedAt: new Date(order.updatedAt || order.placedAt),
  }));

  const promoCodes = [
    { id: 'promo-save10', code: 'SAVE10', type: 'percentage', value: 10, minOrderAmount: 1000, maxDiscountAmount: 300, usageLimit: null, usedCount: randomInt(40, 900), isActive: true },
    { id: 'promo-deal15', code: 'DEAL15', type: 'percentage', value: 15, minOrderAmount: 1800, maxDiscountAmount: 600, usageLimit: 5000, usedCount: randomInt(30, 1500), isActive: true },
    { id: 'promo-weekend20', code: 'WEEKEND20', type: 'percentage', value: 20, minOrderAmount: 2500, maxDiscountAmount: 900, usageLimit: 2000, usedCount: randomInt(10, 700), isActive: true },
    { id: 'promo-flat200', code: 'FLAT200', type: 'fixed', value: 200, minOrderAmount: 1600, usageLimit: null, usedCount: randomInt(25, 800), isActive: true },
    { id: 'promo-newuser', code: 'NEWUSER', type: 'fixed', value: 250, minOrderAmount: 1200, usageLimit: 100000, usedCount: randomInt(100, 5000), isActive: true },
  ];

  const content = [
    {
      type: 'privacy',
      data: 'We collect only the data needed to process orders, deliver items, and improve service quality. Personal data is encrypted in transit and access is role-restricted.',
    },
    {
      type: 'terms',
      data: 'By placing an order, you agree to the platform terms including pricing, refund eligibility, and delivery policies. Shops remain responsible for product quality and availability.',
    },
    {
      type: 'helpCenter',
      data: 'For support, open a ticket from your profile. Typical resolution time is under 24 hours. For urgent delivery issues, use in-app live support.',
    },
    {
      type: 'faqs',
      data: [
        { question: 'How do I track my order?', answer: 'Open Orders and select Track Order to view live status and rider location.' },
        { question: 'How do refunds work?', answer: 'Refunds are initiated automatically for eligible cancellations and processed to the original method.' },
        { question: 'Can I schedule deliveries?', answer: 'Scheduled delivery support is available for selected shops and categories.' },
      ],
    },
  ];

  const adminSettings = [{
    deliveryFee: 80,
    riderCommission: 15,
    shopCommission: 10,
    platformFee: 5,
    minWithdrawal: 1500,
    maxWithdrawal: 150000,
  }];

  await Promise.all([
    Category.insertMany(categories),
    User.insertMany(users),
    Rider.insertMany(riders),
    Shop.insertMany(shops),
    Product.insertMany(products),
    Order.insertMany(orders),
    Review.insertMany(reviews),
    Cart.insertMany(carts),
    Notification.insertMany(notifications),
    PromoCode.insertMany(promoCodes),
    Content.insertMany(content),
    AdminSettings.insertMany(adminSettings),
  ]);

  console.log('Realistic dataset seeded successfully.');
  console.log(`Generated at: ${generatedAt.toISOString()}`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Vendors: ${vendors.length}`);
  console.log(`Riders: ${riders.length}`);
  console.log(`Shops: ${shops.length}`);
  console.log(`Products: ${products.length}`);
  console.log(`Orders: ${orders.length}`);
  console.log(`Reviews: ${reviews.length}`);
  console.log(`Notifications: ${notifications.length}`);
  console.log('Test logins:');
  console.log('Admin: admin@grabgo.app / admin123');
  console.log('Customer: riya@grabgo.app / customer123');
  console.log('Vendor: logan@grabgo.app / vendor123');
  console.log('Rider: amber@grabgo.app / rider123');
  console.log('Generated users password: Test@1234');

  await disconnectDB();
}

seed().catch(async (error) => {
  console.error('Realistic seed failed:', error);
  try {
    await disconnectDB();
  } catch {
    // ignore disconnect errors in failure path
  }
  process.exit(1);
});
