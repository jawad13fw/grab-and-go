import { api } from './client';

export const authApi = {
  login: (body) => api.post('/api/auth/login', body).then((r) => r.data),
  register: (body) => api.post('/api/auth/register', body).then((r) => r.data),
  logout: () => api.post('/api/auth/logout').then((r) => r.data),
  me: () => api.get('/api/auth/me').then((r) => r.data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token, password) => api.post('/api/auth/reset-password', { token, password }).then((r) => r.data),
};

export const catalogApi = {
  getCategories: () => api.get('/api/categories').then((r) => r.data),
  getShops: (params = {}) => api.get('/api/shops', { params }).then((r) => r.data),
  searchShops: (params = {}) => api.get('/api/shops/search', { params }).then((r) => r.data),
  getShop: (id) => api.get(`/api/shops/${id}`).then((r) => r.data),
  getProducts: (params = {}) => api.get('/api/products', { params }).then((r) => r.data),
  searchProducts: (params = {}) => api.get('/api/products/search', { params }).then((r) => r.data),
  getProduct: (id) => api.get(`/api/products/${id}`).then((r) => r.data),
  getRecommendations: () => api.get('/api/recommendations').then((r) => r.data),
  // Vendor APIs
  getMyShops: (params = {}) => api.get('/api/shops/my-shops', { params }).then((r) => r.data),
  createShop: (body) => api.post('/api/shops', body).then((r) => r.data),
  updateShop: (id, body) => api.put(`/api/shops/${id}`, body).then((r) => r.data),
  deleteShop: (id) => api.delete(`/api/shops/${id}`).then((r) => r.data),
  getMyProducts: (params = {}) => api.get('/api/products/my-products', { params }).then((r) => r.data),
  createProduct: (body) => api.post('/api/products', body).then((r) => r.data),
  updateProduct: (id, body) => api.put(`/api/products/${id}`, body).then((r) => r.data),
  deleteProduct: (id) => api.delete(`/api/products/${id}`).then((r) => r.data),
};

export const ordersApi = {
  getAll: () => api.get('/api/orders').then((r) => r.data),
  list: (params = {}) => api.get('/api/orders', { params }).then((r) => r.data),
  get: (id) => api.get(`/api/orders/${id}`).then((r) => r.data),
  create: (body) => api.post('/api/orders', body).then((r) => r.data),
  updateStatus: (id, status) => api.patch(`/api/orders/${id}/status`, { status }).then((r) => r.data),
  accept: (id) => api.post(`/api/orders/${id}/accept`).then((r) => r.data),
};

export const reviewsApi = {
  getShopReviews: (shopId) => api.get(`/api/reviews/shop/${shopId}`).then((r) => r.data),
  create: (body) => api.post('/api/reviews', body).then((r) => r.data),
  update: (id, body) => api.put(`/api/reviews/${id}`, body).then((r) => r.data),
  delete: (id) => api.delete(`/api/reviews/${id}`).then((r) => r.data),
};

export const ridersApi = {
  list: () => api.get('/api/riders').then((r) => r.data),
  setOnline: (isOnline) => api.patch('/api/riders/online', { isOnline }).then((r) => r.data),
  updateLocation: (lat, lng) => api.post('/api/riders/location', { lat, lng }).then((r) => r.data),
  getAvailableOrders: () => api.get('/api/riders/available-orders').then((r) => r.data),
};

export const adminApi = {
  getAnalytics: () => api.get('/api/admin/analytics').then((r) => r.data),
  getUsers: (params = {}) => api.get('/api/admin/users', { params }).then((r) => r.data),
  getSettings: () => api.get('/api/admin/settings').then((r) => r.data),
  updateSettings: (body) => api.patch('/api/admin/settings', body).then((r) => r.data),
  getTickets: () => api.get('/api/admin/tickets').then((r) => r.data),
  addLog: (body) => api.post('/api/admin/logs', body).then((r) => r.data),
  getLogs: () => api.get('/api/admin/logs').then((r) => r.data),
  getContent: () => api.get('/api/admin/content').then((r) => r.data),
  updateContent: (body) => api.patch('/api/admin/content', body).then((r) => r.data),
  getRiderLocations: () => api.get('/api/admin/rider-locations').then((r) => r.data),
};

export const contentApi = {
  list: () => api.get('/api/admin/content').then((r) => r.data),
  upsert: (type, content) => api.patch('/api/admin/content', { type, content }).then((r) => r.data),
};

export const deliveryRequestsApi = {
  list: () => api.get('/api/delivery-requests').then((r) => r.data),
  create: (body) => api.post('/api/delivery-requests', body).then((r) => r.data),
};

export const checkoutApi = {
  createPaymentIntent: (body) => api.post('/api/checkout/create-payment-intent', body).then((r) => r.data),
  create: (body) => api.post('/api/checkout', body).then((r) => r.data),
};

export const cartApi = {
  getCart: () => api.get('/api/cart').then((r) => r.data),
  addItem: (body) => api.post('/api/cart/items', body).then((r) => r.data),
  updateItem: (productId, body) => api.put(`/api/cart/items/${productId}`, body).then((r) => r.data),
  removeItem: (productId, body) => api.delete(`/api/cart/items/${productId}`, { data: body }).then((r) => r.data),
  applyPromo: (code) => api.post('/api/cart/apply-promo', { code }).then((r) => r.data),
  removePromo: () => api.delete('/api/cart/promo').then((r) => r.data),
  clearCart: () => api.delete('/api/cart').then((r) => r.data),
};

export const uploadApi = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/api/upload', formData, {
      headers: { 'Content-Type': false },
    }).then((r) => r.data);
  },
};

