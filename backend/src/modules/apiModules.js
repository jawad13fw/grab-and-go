import authRoutes from '../routes/auth.js';
import categoriesRoutes from '../routes/categories.js';
import shopsRoutes from '../routes/shops.js';
import productsRoutes from '../routes/products.js';
import ordersRoutes from '../routes/orders.js';
import ridersRoutes from '../routes/riders.js';
import adminRoutes from '../routes/admin.js';
import deliveryRequestsRoutes from '../routes/deliveryRequests.js';
import checkoutRoutes from '../routes/checkout.js';
import cartRoutes from '../routes/cart.js';
import usersRoutes from '../routes/users.js';
import reviewsRoutes from '../routes/reviews.js';
import recommendationsRoutes from '../routes/recommendations.js';
import uploadRoutes from '../routes/upload.js';

// Domain-oriented API registry to keep modules easy to discover and maintain.
export const API_MODULES = [
  { domain: 'user', name: 'auth', basePath: '/api/auth', router: authRoutes },
  { domain: 'user', name: 'users', basePath: '/api/users', router: usersRoutes },
  { domain: 'customer', name: 'cart', basePath: '/api/cart', router: cartRoutes },
  { domain: 'customer', name: 'checkout', basePath: '/api/checkout', router: checkoutRoutes },
  { domain: 'customer', name: 'orders', basePath: '/api/orders', router: ordersRoutes },
  { domain: 'catalog', name: 'categories', basePath: '/api/categories', router: categoriesRoutes },
  { domain: 'catalog', name: 'shops', basePath: '/api/shops', router: shopsRoutes },
  { domain: 'catalog', name: 'products', basePath: '/api/products', router: productsRoutes },
  { domain: 'catalog', name: 'reviews', basePath: '/api/reviews', router: reviewsRoutes },
  { domain: 'catalog', name: 'recommendations', basePath: '/api/recommendations', router: recommendationsRoutes },
  { domain: 'rider', name: 'riders', basePath: '/api/riders', router: ridersRoutes },
  { domain: 'delivery', name: 'deliveryRequests', basePath: '/api/delivery-requests', router: deliveryRequestsRoutes },
  { domain: 'admin', name: 'admin', basePath: '/api/admin', router: adminRoutes },
  { domain: 'shared', name: 'upload', basePath: '/api/upload', router: uploadRoutes },
];
