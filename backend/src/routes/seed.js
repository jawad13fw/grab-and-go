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

// ── Real Vehari, Punjab coordinates (Google Maps verified) ──
// City center: 30.0445, 72.3556
const VEHARI = {
  // Key areas in Vehari with approximate Google Maps coordinates
  collegeRoad:     { lat: 30.0472, lng: 72.3528 },
  multanRoad:      { lat: 30.0428, lng: 72.3488 },
  burewalaRoad:    { lat: 30.0382, lng: 72.3618 },
  iqbalRoad:       { lat: 30.0458, lng: 72.3568 },
  peoplesColony:   { lat: 30.0512, lng: 72.3582 },
  modelBazaar:     { lat: 30.0448, lng: 72.3542 },
  grainMarket:     { lat: 30.0418, lng: 72.3508 },
  jamalpur:        { lat: 30.0498, lng: 72.3448 },
  mailsiRoad:      { lat: 30.0348, lng: 72.3655 },
  ludden:          { lat: 30.0305, lng: 72.3395 },
  chak155WB:       { lat: 30.0295, lng: 72.3405 },
  addaPakhimore:   { lat: 30.0360, lng: 72.3640 },
  cityCenter:      { lat: 30.0445, lng: 72.3556 },
};

// ── SHOP DEFINITIONS (real Vehari shop names, addresses, coordinates) ──
const SHOP_DEFS = [
  // ── GROCERY (5) ──
  { catIdx: 0, name: 'Al-Makkah Shopping Mall', desc: 'Largest multi-category shopping mall in Vehari – groceries, household, and daily essentials',
    address: 'Peoples Colony Road, Near Faisal Town, Vehari', phone: '+92 300 7861234',
    coords: VEHARI.peoplesColony, deliveryTime: '20-30 min', deliveryFee: 40, minOrder: 200,
    rating: 4.6, reviews: 234, tags: ['grocery', 'supermarket', 'household'], hours: '8:00 AM - 11:00 PM' },
  { catIdx: 0, name: 'Model Bazaar Vehari', desc: 'Government-regulated fair-price bazaar with fresh produce, spices, and staples',
    address: 'Near DO Food Office, Main Bazaar Road, Vehari', phone: '+92 301 6789012',
    coords: VEHARI.modelBazaar, deliveryTime: '15-25 min', deliveryFee: 30, minOrder: 150,
    rating: 4.4, reviews: 312, tags: ['grocery', 'fresh', 'vegetables', 'fruits'], hours: '7:00 AM - 10:00 PM' },
  { catIdx: 0, name: 'Imtiaz Store Vehari', desc: 'Complete grocery & household store with branded products at wholesale rates',
    address: 'College Road, Near Al-Aziz Super Market, Vehari', phone: '+92 302 4567890',
    coords: { lat: 30.0475, lng: 72.3522 }, deliveryTime: '25-35 min', deliveryFee: 50, minOrder: 250,
    rating: 4.5, reviews: 189, tags: ['grocery', 'wholesale', 'branded'], hours: '9:00 AM - 10:00 PM' },
  { catIdx: 0, name: 'Haji Anwar Karyana & General Store', desc: 'Trusted neighborhood karyana store serving Vehari for over 25 years',
    address: 'Grain Market, Shop No. 12, Vehari', phone: '+92 303 3456789',
    coords: VEHARI.grainMarket, deliveryTime: '15-20 min', deliveryFee: 25, minOrder: 100,
    rating: 4.3, reviews: 156, tags: ['grocery', 'karyana', 'local'], hours: '7:00 AM - 9:00 PM' },
  { catIdx: 0, name: 'Rashid General Store', desc: 'Your one-stop neighborhood shop for daily groceries and household items',
    address: 'Burewala Road, Near Adda Pakhi More, Vehari', phone: '+92 304 2345678',
    coords: VEHARI.addaPakhimore, deliveryTime: '15-25 min', deliveryFee: 30, minOrder: 100,
    rating: 4.2, reviews: 98, tags: ['grocery', 'general', 'local'], hours: '7:30 AM - 9:30 PM' },

  // ── PHARMACY (4) ──
  { catIdx: 1, name: 'Azeem Pharmacy', desc: 'Full-service pharmacy with medicines, vaccines, insulin, and healthcare products',
    address: 'Iqbal Road, Opposite Bank of Punjab, Vehari', phone: '+92 300 9876543',
    coords: VEHARI.iqbalRoad, deliveryTime: '10-20 min', deliveryFee: 50, minOrder: 100,
    rating: 4.8, reviews: 267, tags: ['pharmacy', 'vaccines', 'healthcare'], hours: '24 Hours' },
  { catIdx: 1, name: 'New Al-Madina Medical Store', desc: 'Reliable medical store near City Police Station with genuine medicines',
    address: 'Near City Police Station, Main Bazaar, Vehari', phone: '+92 301 8765432',
    coords: { lat: 30.0442, lng: 72.3552 }, deliveryTime: '10-15 min', deliveryFee: 40, minOrder: 80,
    rating: 4.6, reviews: 145, tags: ['pharmacy', 'medical', 'genuine'], hours: '8:00 AM - 11:00 PM' },
  { catIdx: 1, name: 'Punjab Medical Store', desc: 'Well-stocked pharmacy on Multan Road with home delivery service',
    address: 'Multan Road, Near Shell Filling Station, Vehari', phone: '+92 302 7654321',
    coords: VEHARI.multanRoad, deliveryTime: '15-25 min', deliveryFee: 60, minOrder: 120,
    rating: 4.5, reviews: 112, tags: ['pharmacy', 'delivery', 'multan road'], hours: '8:00 AM - 10:00 PM' },
  { catIdx: 1, name: 'Allied Pharma & Surgical', desc: 'Specialized pharmacy with surgical supplies, first aid, and wellness products',
    address: 'College Road, D Block, Near Jamia Masjid, Vehari', phone: '+92 303 6543210',
    coords: VEHARI.collegeRoad, deliveryTime: '15-20 min', deliveryFee: 45, minOrder: 100,
    rating: 4.4, reviews: 89, tags: ['pharmacy', 'surgical', 'wellness'], hours: '9:00 AM - 10:00 PM' },

  // ── BAKERY (3) ──
  { catIdx: 2, name: 'Tehzeeb Bakers Vehari', desc: 'Premium bakery chain – fresh cakes, pastries, rusks, and traditional mithai',
    address: 'College Road, Near Lajhna Chowk, Vehari', phone: '+92 300 5432109',
    coords: { lat: 30.0478, lng: 72.3535 }, deliveryTime: '20-30 min', deliveryFee: 50, minOrder: 200,
    rating: 4.7, reviews: 345, tags: ['bakery', 'cakes', 'mithai', 'pastries'], hours: '7:00 AM - 11:00 PM' },
  { catIdx: 2, name: 'New Karachi Bakery', desc: 'Famous for fresh naan khatai, cake rusk, and custom birthday cakes',
    address: 'Main Bazaar Road, Near Model Bazaar, Vehari', phone: '+92 301 4321098',
    coords: { lat: 30.0452, lng: 72.3548 }, deliveryTime: '15-25 min', deliveryFee: 40, minOrder: 150,
    rating: 4.6, reviews: 278, tags: ['bakery', 'naan khatai', 'cakes', 'rusk'], hours: '6:00 AM - 10:00 PM' },
  { catIdx: 2, name: 'Al-Sultan Sweets & Bakers', desc: 'Traditional Pakistani sweets, fresh bread, and festive bakery items',
    address: 'Multan Road, Near Chowk Bazar, Vehari', phone: '+92 302 3210987',
    coords: { lat: 30.0435, lng: 72.3495 }, deliveryTime: '20-30 min', deliveryFee: 45, minOrder: 180,
    rating: 4.5, reviews: 167, tags: ['bakery', 'sweets', 'mithai', 'bread'], hours: '7:00 AM - 9:00 PM' },

  // ── ELECTRONICS (3) ──
  { catIdx: 3, name: 'RN Electronics', desc: 'Home appliances, LED TVs, fans, and electronic gadgets with installment plans',
    address: 'Shop 4, Muhammad Ali Market, Imambargah Road, Vehari', phone: '+92 300 2109876',
    coords: { lat: 30.0455, lng: 72.3562 }, deliveryTime: '30-45 min', deliveryFee: 100, minOrder: 500,
    rating: 4.4, reviews: 134, tags: ['electronics', 'appliances', 'installments'], hours: '10:00 AM - 9:00 PM' },
  { catIdx: 3, name: 'Rehman Electronics & Computers', desc: 'Laptops, desktops, printers, networking, and computer accessories',
    address: 'Multan Road, Near Old Sabzi Mandi, Vehari', phone: '+92 301 1098765',
    coords: { lat: 30.0425, lng: 72.3482 }, deliveryTime: '30-45 min', deliveryFee: 80, minOrder: 300,
    rating: 4.3, reviews: 98, tags: ['electronics', 'computers', 'laptops'], hours: '9:00 AM - 8:00 PM' },
  { catIdx: 3, name: 'Al-Noor Mobile Zone', desc: 'Latest smartphones, mobile accessories, repairs, and SIM services',
    address: 'College Road, Near Al-Aziz Super Market, Vehari', phone: '+92 303 0987654',
    coords: { lat: 30.0468, lng: 72.3530 }, deliveryTime: '20-35 min', deliveryFee: 60, minOrder: 200,
    rating: 4.2, reviews: 201, tags: ['electronics', 'mobile', 'accessories', 'repair'], hours: '10:00 AM - 10:00 PM' },

  // ── FASHION (3) ──
  { catIdx: 4, name: 'Kashmir Fabrics', desc: 'Premium unstitched lawn, cotton, and formal fabrics for men and women',
    address: 'Model Bazaar Road, Near Main Chowk, Vehari', phone: '+92 300 8761234',
    coords: { lat: 30.0448, lng: 72.3545 }, deliveryTime: '25-40 min', deliveryFee: 70, minOrder: 300,
    rating: 4.5, reviews: 156, tags: ['fashion', 'fabric', 'lawn', 'cotton'], hours: '10:00 AM - 9:00 PM' },
  { catIdx: 4, name: 'Al-Makkah Fashion', desc: 'Ready-made garments, shalwar kameez, kurta, and family clothing',
    address: 'Peoples Colony Road, Vehari', phone: '+92 301 7651234',
    coords: { lat: 30.0518, lng: 72.3578 }, deliveryTime: '25-40 min', deliveryFee: 80, minOrder: 400,
    rating: 4.3, reviews: 112, tags: ['fashion', 'clothing', 'ready-made'], hours: '10:00 AM - 9:30 PM' },
  { catIdx: 4, name: 'Ladies Collection', desc: 'Exclusive ladies fashion – fancy suits, bridal wear, and accessories',
    address: 'College Road, D Block, Near Jamia Masjid, Vehari', phone: '+92 302 6541234',
    coords: { lat: 30.0480, lng: 72.3522 }, deliveryTime: '30-45 min', deliveryFee: 90, minOrder: 500,
    rating: 4.6, reviews: 189, tags: ['fashion', 'ladies', 'bridal', 'fancy'], hours: '11:00 AM - 9:00 PM' },
];

// ── PRODUCT DEFINITIONS per shop (realistic Pakistani products + prices in PKR) ──
const PRODUCT_DEFS = [
  // ── Al-Makkah Shopping Mall (Grocery) ──
  { name: 'Olpers Fresh Milk 1L', price: 265, stock: 60, desc: 'Pasteurized fresh milk by Olpers', tags: ['dairy', 'milk'] },
  { name: 'Guard Basmati Rice 5kg', price: 1250, stock: 40, desc: 'Premium long-grain basmati rice', tags: ['rice', 'staple'] },
  { name: 'Dalda Cooking Oil 5L', price: 2450, stock: 30, desc: 'Pure vegetable cooking oil', tags: ['oil', 'cooking'] },
  { name: 'National Biryani Masala 50g', price: 65, stock: 100, desc: 'Aromatic biryani spice mix', tags: ['spice', 'masala'] },
  { name: 'Nestle Everyday Milk Powder 250g', price: 580, stock: 45, desc: 'Instant milk powder', tags: ['dairy', 'powder'] },
  { name: 'Surf Excel 1kg', price: 380, stock: 55, desc: 'Laundry detergent powder', tags: ['cleaning', 'detergent'] },
  { name: 'Lays Classic Salted Chips 74g', price: 110, stock: 80, desc: 'Crispy potato chips', tags: ['snack', 'chips'] },
  { name: 'Tapal Danedar Tea 190g', price: 390, stock: 50, desc: 'Premium granulated tea', tags: ['tea', 'beverage'] },

  // ── Model Bazaar (Grocery) ──
  { name: 'Fresh Tomatoes 1kg', price: 120, stock: 100, desc: 'Farm-fresh red tomatoes', tags: ['vegetable', 'fresh'] },
  { name: 'Fresh Onions 1kg', price: 90, stock: 120, desc: 'Quality white onions', tags: ['vegetable', 'fresh'] },
  { name: 'Fresh Potatoes 1kg', price: 80, stock: 150, desc: 'Local farm potatoes', tags: ['vegetable', 'fresh'] },
  { name: 'Desi Ghee 1kg Tin', price: 1850, stock: 25, desc: 'Pure desi ghee in tin', tags: ['dairy', 'ghee'] },
  { name: 'Farm Fresh Eggs (12)', price: 380, stock: 60, desc: 'Free-range desi eggs', tags: ['dairy', 'eggs'] },
  { name: 'Red Chilli Powder 200g', price: 150, stock: 80, desc: 'Ground red chilli', tags: ['spice'] },
  { name: 'Sugar 1kg', price: 145, stock: 100, desc: 'Refined white sugar', tags: ['staple'] },

  // ── Imtiaz Store (Grocery) ──
  { name: 'Knorr Chicken Noodles 70g', price: 55, stock: 90, desc: 'Instant chicken noodles', tags: ['snack', 'noodles'] },
  { name: 'Himalaya Face Wash 100ml', price: 320, stock: 40, desc: 'Neem face wash for clear skin', tags: ['personal care'] },
  { name: 'Colgate MaxFresh Toothpaste 150g', price: 225, stock: 50, desc: 'Cooling crystal toothpaste', tags: ['personal care'] },
  { name: 'Dawn Bread Large', price: 180, stock: 35, desc: 'Fresh sliced bread', tags: ['bakery', 'bread'] },
  { name: 'Nestle Mineral Water 1.5L', price: 95, stock: 70, desc: 'Pure mineral water', tags: ['beverage', 'water'] },
  { name: 'Harpic Toilet Cleaner 500ml', price: 280, stock: 40, desc: 'Powerplus toilet cleaner', tags: ['cleaning'] },
  { name: 'Lifebuoy Soap 95g', price: 75, stock: 80, desc: 'Germ protection soap', tags: ['personal care'] },

  // ── Haji Anwar Karyana (Grocery) ──
  { name: 'Atta Chakki Fresh 10kg', price: 950, stock: 50, desc: 'Freshly ground whole wheat flour', tags: ['staple', 'flour'] },
  { name: 'Daal Chana 1kg', price: 220, stock: 60, desc: 'Split chickpea lentils', tags: ['lentil', 'staple'] },
  { name: 'Daal Masoor 1kg', price: 280, stock: 55, desc: 'Red lentils', tags: ['lentil', 'staple'] },
  { name: 'White Chickpeas 1kg', price: 260, stock: 50, desc: 'Kabuli chana', tags: ['lentil'] },
  { name: 'Mustard Oil 1L', price: 450, stock: 30, desc: 'Pure sarson ka tel', tags: ['oil'] },
  { name: 'Gur (Jaggery) 1kg', price: 200, stock: 40, desc: 'Natural cane jaggery', tags: ['sweet', 'natural'] },

  // ── Rashid General Store (Grocery) ──
  { name: 'Shan Sindhi Biryani Masala 50g', price: 60, stock: 90, desc: 'Authentic Sindhi biryani spice', tags: ['spice', 'masala'] },
  { name: 'Mitchells Fruit Jam 340g', price: 210, stock: 35, desc: 'Mixed fruit jam', tags: ['spread', 'breakfast'] },
  { name: 'Nestle Milkpak 1L', price: 255, stock: 50, desc: 'UHT treated fresh milk', tags: ['dairy', 'milk'] },
  { name: 'Saeed Ghani Surma', price: 45, stock: 70, desc: 'Traditional herbal kohl', tags: ['beauty', 'traditional'] },
  { name: 'Juice Nestle Fruita 1L', price: 195, stock: 45, desc: 'Mango fruita juice', tags: ['beverage', 'juice'] },
  { name: 'Coca Cola 1.5L', price: 210, stock: 60, desc: 'Refreshing cola drink', tags: ['beverage', 'cold'] },

  // ── Azeem Pharmacy ──
  { name: 'Panadol Extra 24 Tabs', price: 145, stock: 150, desc: 'Paracetamol + caffeine tablets for pain relief', tags: ['medicine', 'pain'] },
  { name: 'Augmentin 625mg 10 Tabs', price: 420, stock: 80, desc: 'Broad-spectrum antibiotic', tags: ['medicine', 'antibiotic'] },
  { name: 'Vitamin C 1000mg 30 Effervescent', price: 650, stock: 45, desc: 'Immunity boosting vitamin C', tags: ['vitamin', 'immunity'] },
  { name: 'ORS Sachets Pack of 10', price: 120, stock: 100, desc: 'Oral rehydration salts', tags: ['medicine', 'hydration'] },
  { name: 'Insulin Glargine Pen', price: 2800, stock: 15, desc: 'Long-acting insulin pen for diabetes', tags: ['medicine', 'diabetes'] },
  { name: 'Digital Thermometer', price: 350, stock: 40, desc: 'Accurate digital thermometer', tags: ['device', 'health'] },
  { name: 'Dettol Antiseptic 125ml', price: 280, stock: 60, desc: 'Trusted antiseptic liquid', tags: ['hygiene', 'antiseptic'] },

  // ── New Al-Madina Medical Store ──
  { name: 'Brufen 400mg 20 Tabs', price: 180, stock: 120, desc: 'Ibuprofen anti-inflammatory tablets', tags: ['medicine', 'pain'] },
  { name: 'Flagyl 400mg 20 Tabs', price: 160, stock: 100, desc: 'Metronidazole antibiotic', tags: ['medicine', 'antibiotic'] },
  { name: 'Blood Pressure Monitor', price: 3500, stock: 12, desc: 'Automatic digital BP machine', tags: ['device', 'health'] },
  { name: 'Surgical Face Masks Box 50', price: 450, stock: 50, desc: '3-ply disposable masks', tags: ['hygiene', 'safety'] },
  { name: 'Multivitamins 60 Tabs', price: 580, stock: 35, desc: 'Daily multivitamin supplement', tags: ['vitamin', 'health'] },
  { name: 'Burnol Cream 20g', price: 95, stock: 80, desc: 'First aid burn cream', tags: ['first aid'] },

  // ── Punjab Medical Store ──
  { name: 'Disprin 10 Tabs', price: 55, stock: 200, desc: 'Soluble aspirin tablets', tags: ['medicine', 'pain'] },
  { name: 'Zyrtec 10mg 14 Tabs', price: 320, stock: 60, desc: 'Antihistamine for allergies', tags: ['medicine', 'allergy'] },
  { name: 'Pregnancy Test Kit', price: 150, stock: 40, desc: 'Home pregnancy test strip', tags: ['device', 'health'] },
  { name: 'Dettol Handwash 200ml', price: 340, stock: 45, desc: 'Liquid hand wash refill', tags: ['hygiene'] },
  { name: 'Strepsils Lozenges 24s', price: 240, stock: 55, desc: 'Sore throat lozenges', tags: ['medicine', 'throat'] },
  { name: 'Calcium + Vitamin D 60 Tabs', price: 490, stock: 30, desc: 'Bone health supplement', tags: ['vitamin', 'bones'] },

  // ── Allied Pharma & Surgical ──
  { name: 'Bandage Roll 10cm', price: 85, stock: 100, desc: 'Elastic crepe bandage', tags: ['surgical', 'first aid'] },
  { name: 'Surgical Gloves Box 100', price: 650, stock: 30, desc: 'Latex-free examination gloves', tags: ['surgical', 'hygiene'] },
  { name: 'Glucometer Kit', price: 1800, stock: 15, desc: 'Blood sugar testing device with strips', tags: ['device', 'diabetes'] },
  { name: 'Cotton Roll 500g', price: 320, stock: 40, desc: 'Medical grade cotton', tags: ['surgical'] },
  { name: 'Betadine Solution 100ml', price: 195, stock: 50, desc: 'Povidone iodine antiseptic', tags: ['antiseptic', 'surgical'] },
  { name: 'Nebulizer Machine', price: 2200, stock: 10, desc: 'Portable compressor nebulizer', tags: ['device', 'respiratory'] },

  // ── Tehzeeb Bakers (Bakery) ──
  { name: 'Fresh Cream Cake 1kg', price: 1500, stock: 8, desc: 'Layered fresh cream birthday cake', tags: ['cake', 'birthday'] },
  { name: 'Chocolate Brownie Pack', price: 450, stock: 20, desc: 'Rich fudge brownies (4 pcs)', tags: ['bakery', 'chocolate'] },
  { name: 'Cake Rusk Pack', price: 280, stock: 35, desc: 'Crispy cake rusk for tea time', tags: ['rusk', 'tea time'] },
  { name: 'Chicken Patties (6 pcs)', price: 360, stock: 25, desc: 'Flaky chicken filled patties', tags: ['bakery', 'savory'] },
  { name: 'Fresh Naan Khatai 12 pcs', price: 320, stock: 30, desc: 'Traditional butter biscuits', tags: ['bakery', 'traditional'] },
  { name: 'Coconut Muffins (4 pcs)', price: 280, stock: 20, desc: 'Soft coconut flavored muffins', tags: ['bakery', 'muffin'] },
  { name: 'Gulab Jamun 500g', price: 380, stock: 15, desc: 'Freshly made syrup-soaked gulab jamun', tags: ['mithai', 'sweet'] },

  // ── New Karachi Bakery (Bakery) ──
  { name: 'Naan Khatai Special 1kg', price: 550, stock: 25, desc: 'Premium desi ghee naan khatai', tags: ['bakery', 'traditional'] },
  { name: 'Fruit Cake 500g', price: 750, stock: 15, desc: 'Rich fruit cake with nuts and dried fruits', tags: ['cake', 'festive'] },
  { name: 'Pista Bakarkhani', price: 180, stock: 30, desc: 'Flaky pistachio layered bread', tags: ['bakery', 'traditional'] },
  { name: 'Birthday Cake Chocolate 2kg', price: 2800, stock: 5, desc: 'Custom chocolate birthday cake', tags: ['cake', 'birthday', 'custom'] },
  { name: 'Tea Cake Pack', price: 220, stock: 40, desc: 'Simple marble tea cake', tags: ['cake', 'tea time'] },
  { name: 'Sohan Halwa 500g', price: 450, stock: 20, desc: 'Traditional Multani sohan halwa', tags: ['mithai', 'traditional'] },

  // ── Al-Sultan Sweets & Bakers ──
  { name: 'Rasgulla 1kg', price: 520, stock: 20, desc: 'Soft spongy rasgullas in syrup', tags: ['mithai', 'sweet'] },
  { name: 'Barfi Assorted 500g', price: 480, stock: 18, desc: 'Mix barfi – pista, badam, coconut', tags: ['mithai', 'festive'] },
  { name: 'Jalebi 500g', price: 280, stock: 25, desc: 'Crispy hot jalebi', tags: ['mithai', 'fresh'] },
  { name: 'Fresh Bread Loaf Large', price: 150, stock: 50, desc: 'Soft sliced white bread', tags: ['bakery', 'bread'] },
  { name: 'Sheer Khurma Mix 500g', price: 350, stock: 15, desc: 'Ready-mix for Eid sheer khurma', tags: ['festive', 'eid'] },
  { name: 'Pateesa 500g', price: 380, stock: 20, desc: 'Flaky sweet pateesa', tags: ['mithai', 'traditional'] },

  // ── RN Electronics ──
  { name: 'Haier LED TV 32 inch', price: 38000, stock: 5, desc: 'HD ready smart LED television', tags: ['tv', 'appliance'] },
  { name: 'Royal Fan 56 inch', price: 4200, stock: 15, desc: 'Energy efficient ceiling fan', tags: ['fan', 'appliance'] },
  { name: 'Anex Blender 1.5L', price: 5500, stock: 12, desc: 'Multi-function kitchen blender', tags: ['kitchen', 'appliance'] },
  { name: 'Westpoint Electric Kettle 1.8L', price: 3800, stock: 18, desc: 'Stainless steel electric kettle', tags: ['kitchen', 'appliance'] },
  { name: 'Dawlance Refrigerator 9144', price: 72000, stock: 3, desc: 'Double door refrigerator 14 cu ft', tags: ['appliance', 'fridge'] },
  { name: 'Extension Board 5 Socket', price: 1200, stock: 25, desc: 'Heavy duty extension with surge protector', tags: ['accessory', 'electrical'] },

  // ── Rehman Electronics & Computers ──
  { name: 'HP Laptop 15s Core i3', price: 95000, stock: 4, desc: '8GB RAM 256GB SSD Windows 11', tags: ['laptop', 'computer'] },
  { name: 'Logitech Wireless Mouse M240', price: 2800, stock: 20, desc: 'Silent Bluetooth mouse', tags: ['accessory', 'computer'] },
  { name: 'USB Flash Drive 64GB', price: 1500, stock: 30, desc: 'High-speed USB 3.0 pendrive', tags: ['storage', 'computer'] },
  { name: 'HP Inkjet Printer 2710', price: 18500, stock: 5, desc: 'All-in-one wireless printer', tags: ['printer', 'computer'] },
  { name: 'Cat6 Ethernet Cable 10m', price: 850, stock: 25, desc: 'High-speed network cable', tags: ['networking', 'cable'] },
  { name: 'Laptop Backpack', price: 2200, stock: 15, desc: 'Water-resistant laptop bag with USB port', tags: ['accessory', 'bag'] },

  // ── Al-Noor Mobile Zone ──
  { name: 'Samsung Galaxy A15 128GB', price: 42000, stock: 8, desc: '6.5 inch AMOLED 50MP camera', tags: ['mobile', 'samsung'] },
  { name: 'Xiaomi Redmi 13C 128GB', price: 32000, stock: 10, desc: '6.74 inch 50MP AI camera', tags: ['mobile', 'xiaomi'] },
  { name: 'Tempered Glass Screen Protector', price: 250, stock: 100, desc: 'Universal glass protector', tags: ['accessory', 'protection'] },
  { name: 'Fast Charger 25W Type-C', price: 1200, stock: 40, desc: 'Quick charge adapter with cable', tags: ['accessory', 'charger'] },
  { name: 'Bluetooth Earbuds TWS', price: 2500, stock: 25, desc: 'Wireless earphones with charging case', tags: ['audio', 'wireless'] },
  { name: 'Power Bank 20000mAh', price: 3500, stock: 20, desc: 'Fast charging power bank', tags: ['accessory', 'battery'] },
  { name: 'Mobile Cover Silicone', price: 450, stock: 60, desc: 'Shockproof silicone phone case', tags: ['accessory', 'protection'] },

  // ── Kashmir Fabrics (Fashion) ──
  { name: 'Lawn Unstitched 3pc Suit', price: 2800, stock: 20, desc: 'Premium printed lawn fabric set', tags: ['fabric', 'lawn', 'women'] },
  { name: 'Wash & Wear Fabric 4m', price: 1800, stock: 25, desc: 'Men\'s formal wash-and-wear cloth', tags: ['fabric', 'formal', 'men'] },
  { name: 'Cotton Bedsheet Double', price: 1500, stock: 30, desc: 'Pure cotton printed bedsheet with 2 pillows', tags: ['home', 'bedsheet'] },
  { name: 'Chiffon Dupatta', price: 650, stock: 40, desc: 'Embroidered chiffon dupatta', tags: ['accessory', 'women'] },
  { name: 'Khaddar Fabric 4m', price: 1400, stock: 20, desc: 'Warm winter khaddar cloth', tags: ['fabric', 'winter'] },

  // ── Al-Makkah Fashion ──
  { name: 'Men Shalwar Kameez Cotton', price: 2200, stock: 25, desc: 'Ready-made cotton shalwar kameez', tags: ['clothing', 'men', 'cotton'] },
  { name: 'Kids Kurta Set', price: 1200, stock: 30, desc: 'Fancy kurta with shalwar for kids', tags: ['clothing', 'kids'] },
  { name: 'Men Waistcoat Formal', price: 1800, stock: 15, desc: 'Elegant formal waistcoat', tags: ['clothing', 'men', 'formal'] },
  { name: 'Women Abaya Black', price: 2500, stock: 20, desc: 'Premium black abaya with belt', tags: ['clothing', 'women'] },
  { name: 'Prayer Mat Jai Namaz', price: 850, stock: 35, desc: 'Soft padded prayer mat', tags: ['accessory', 'prayer'] },
  { name: 'Peshawari Chappal', price: 2800, stock: 12, desc: 'Handcrafted leather Peshawari', tags: ['footwear', 'traditional'] },

  // ── Ladies Collection (Fashion) ──
  { name: 'Bridal Lehenga Set', price: 15000, stock: 5, desc: 'Heavy embroidered bridal lehenga with dupatta', tags: ['bridal', 'fancy', 'women'] },
  { name: 'Party Wear Gown', price: 4500, stock: 10, desc: 'Fancy party wear long gown', tags: ['clothing', 'women', 'party'] },
  { name: 'Embroidered Kurta', price: 1800, stock: 20, desc: 'Hand-embroidered cotton kurta', tags: ['clothing', 'women'] },
  { name: 'Matching Clutch Bag', price: 1200, stock: 15, desc: 'Fancy beaded clutch for events', tags: ['accessory', 'bag', 'women'] },
  { name: 'Artificial Jewelry Set', price: 850, stock: 25, desc: 'Necklace + earrings + bangles set', tags: ['jewelry', 'artificial'] },
  { name: 'Fancy Shawl/Wrap', price: 1500, stock: 18, desc: 'Warm embroidered shawl', tags: ['accessory', 'winter', 'women'] },
];

// Map product index ranges to shop index
const PRODUCT_RANGES = [
  { shopIdx: 0, start: 0, end: 8 },    // Al-Makkah Shopping Mall
  { shopIdx: 1, start: 8, end: 15 },   // Model Bazaar
  { shopIdx: 2, start: 15, end: 22 },  // Imtiaz Store
  { shopIdx: 3, start: 22, end: 28 },  // Haji Anwar Karyana
  { shopIdx: 4, start: 28, end: 34 },  // Rashid General Store
  { shopIdx: 5, start: 34, end: 41 },  // Azeem Pharmacy
  { shopIdx: 6, start: 41, end: 47 },  // New Al-Madina Medical
  { shopIdx: 7, start: 47, end: 53 },  // Punjab Medical Store
  { shopIdx: 8, start: 53, end: 59 },  // Allied Pharma
  { shopIdx: 9, start: 59, end: 66 },  // Tehzeeb Bakers
  { shopIdx: 10, start: 66, end: 72 }, // New Karachi Bakery
  { shopIdx: 11, start: 72, end: 78 }, // Al-Sultan Sweets
  { shopIdx: 12, start: 78, end: 84 }, // RN Electronics
  { shopIdx: 13, start: 84, end: 90 }, // Rehman Electronics
  { shopIdx: 14, start: 90, end: 97 }, // Al-Noor Mobile Zone
  { shopIdx: 15, start: 97, end: 102 },// Kashmir Fabrics
  { shopIdx: 16, start: 102, end: 108 },// Al-Makkah Fashion
  { shopIdx: 17, start: 108, end: 114 },// Ladies Collection
];

// ── Placeholder image generator ──
const shopImg = (name) => `https://placehold.co/600x400/e8d5b7/5a3e1b?text=${encodeURIComponent(name)}&font=poppins`;
const prodImg = (name) => `https://placehold.co/400x300/f0e6d3/4a3520?text=${encodeURIComponent(name.substring(0, 20))}&font=poppins`;

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

    if (existingAdmin && force) {
      await Promise.all([
        User.deleteMany({}), Category.deleteMany({}), Shop.deleteMany({}),
        Product.deleteMany({}), Rider.deleteMany({}), AdminSettings.deleteMany({}),
        Content.deleteMany({}), PromoCode.deleteMany({})
      ]);
    }

    // ── Users ──
    const customer = await User.create({
      id: nanoid(), name: 'Ahmad Ali', email: 'ahmad@grabgo.app',
      passwordHash: await bcrypt.hash('customer123', 10), role: 'Customer', phone: '+92 300 1234567'
    });
    const vendor = await User.create({
      id: nanoid(), name: 'Muhammad Usman', email: 'usman@grabgo.app',
      passwordHash: await bcrypt.hash('vendor123', 10), role: 'Vendor', phone: '+92 300 2345678'
    });
    const riderUser = await User.create({
      id: nanoid(), name: 'Bilal Ahmed', email: 'bilal@grabgo.app',
      passwordHash: await bcrypt.hash('rider123', 10), role: 'Rider', phone: '+92 300 3456789'
    });
    await User.create({
      id: nanoid(), name: 'Admin User', email: 'admin@grabgo.app',
      passwordHash: await bcrypt.hash('admin123', 10), role: 'Admin', phone: '+92 300 0000000'
    });

    // ── Categories ──
    const cats = await Promise.all([
      Category.create({ id: nanoid(), name: 'Grocery', icon: '🛒', image: 'https://placehold.co/300x200/f5e6c8/7c5a2e?text=Grocery&font=poppins' }),
      Category.create({ id: nanoid(), name: 'Pharmacy', icon: '💊', image: 'https://placehold.co/300x200/d4edda/2d6a4f?text=Pharmacy&font=poppins' }),
      Category.create({ id: nanoid(), name: 'Bakery', icon: '🍞', image: 'https://placehold.co/300x200/fde8cd/8b6914?text=Bakery&font=poppins' }),
      Category.create({ id: nanoid(), name: 'Electronics', icon: '📱', image: 'https://placehold.co/300x200/d6e4f0/2c5282?text=Electronics&font=poppins' }),
      Category.create({ id: nanoid(), name: 'Fashion', icon: '👗', image: 'https://placehold.co/300x200/fce4ec/880e4f?text=Fashion&font=poppins' })
    ]);

    // ── Shops ──
    const shops = await Promise.all(SHOP_DEFS.map(s =>
      Shop.create({
        id: nanoid(), name: s.name, vendorId: vendor.id,
        category: cats[s.catIdx].name, description: s.desc,
        address: s.address, phone: s.phone,
        deliveryTime: s.deliveryTime, deliveryFee: s.deliveryFee, minOrder: s.minOrder,
        image: shopImg(s.name), rating: s.rating, reviews: s.reviews,
        coordinates: s.coords, tags: s.tags, hours: s.hours, isActive: true
      })
    ));

    // ── Products ──
    let productCount = 0;
    for (const range of PRODUCT_RANGES) {
      const shopProducts = PRODUCT_DEFS.slice(range.start, range.end);
      await Promise.all(shopProducts.map(p =>
        Product.create({
          id: nanoid(), shopId: shops[range.shopIdx].id, shopName: shops[range.shopIdx].name,
          name: p.name, description: p.desc, price: p.price, stock: p.stock,
          category: cats[SHOP_DEFS[range.shopIdx].catIdx].name,
          image: prodImg(p.name), rating: 4.0 + Math.random() * 0.9,
          reviews: Math.floor(Math.random() * 80) + 5, isAvailable: true, tags: p.tags || []
        })
      ));
      productCount += shopProducts.length;
    }

    // ── Riders (3 riders in different Vehari locations) ──
    await Promise.all([
      Rider.create({
        id: nanoid(), userId: riderUser.id, name: riderUser.name, phone: riderUser.phone,
        email: riderUser.email, vehicle: { vehicleType: 'Motorbike', plateNumber: 'VEH-2024-0001' },
        status: 'available', rating: 4.9, deliveries: 0, earnings: 0,
        location: VEHARI.cityCenter, isOnline: true
      }),
      Rider.create({
        id: nanoid(), userId: riderUser.id, name: 'Kamran Rider', phone: '+92 300 5551234',
        email: 'kamran@grabgo.app', vehicle: { vehicleType: 'Motorbike', plateNumber: 'VEH-2024-0002' },
        status: 'available', rating: 4.7, deliveries: 0, earnings: 0,
        location: VEHARI.collegeRoad, isOnline: true
      }),
      Rider.create({
        id: nanoid(), userId: riderUser.id, name: 'Faisal Rider', phone: '+92 300 5555678',
        email: 'faisal@grabgo.app', vehicle: { vehicleType: 'Motorbike', plateNumber: 'VEH-2024-0003' },
        status: 'available', rating: 4.8, deliveries: 0, earnings: 0,
        location: VEHARI.multanRoad, isOnline: false
      }),
    ]);

    // ── Admin Settings ──
    await AdminSettings.create({
      deliveryFee: 40, riderCommission: 15, shopCommission: 10,
      platformFee: 5, minWithdrawal: 500, maxWithdrawal: 50000
    });

    // ── Content ──
    await Content.create({
      type: 'hero',
      data: {
        title: 'Grab & Go - Fast Delivery in Vehari',
        subtitle: 'Order groceries, pharmacy, bakery, electronics & fashion',
        buttonText: 'Shop Now'
      }
    });

    // ── Promo Codes ──
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
      }),
      PromoCode.create({
        id: nanoid(), code: 'VEHARI25', type: 'percentage', value: 25,
        minOrderAmount: 1000, usageLimit: 200, isActive: true,
        startDate: new Date(), endDate: new Date(Date.now() + 60 * 86400000)
      }),
    ]);

    res.json({
      success: true,
      message: 'Database seeded with Vehari data!',
      data: { users: 4, categories: 5, shops: shops.length, products: productCount, riders: 3, promoCodes: 3 },
      logins: {
        customer: { email: 'ahmad@grabgo.app', password: 'customer123' },
        vendor: { email: 'usman@grabgo.app', password: 'vendor123' },
        rider: { email: 'bilal@grabgo.app', password: 'rider123' },
        admin: { email: 'admin@grabgo.app', password: 'admin123' }
      }
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
