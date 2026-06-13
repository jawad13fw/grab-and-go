import { lazy } from 'react';

export const sharedPages = {
  Landing: lazy(() => import('../pages/Landing')),
  Login: lazy(() => import('../pages/Login')),
  Register: lazy(() => import('../pages/Register')),
  NotFound: lazy(() => import('../pages/NotFound')),
};

export const customerPages = {
  Home: lazy(() => import('../pages/Home')),
  Categories: lazy(() => import('../pages/Categories')),
  Shops: lazy(() => import('../pages/Shops')),
  ShopDetails: lazy(() => import('../pages/ShopDetails')),
  ProductDetails: lazy(() => import('../pages/ProductDetails')),
  Cart: lazy(() => import('../pages/Cart')),
  Checkout: lazy(() => import('../pages/Checkout')),
  Orders: lazy(() => import('../pages/Orders')),
  RequestDelivery: lazy(() => import('../pages/RequestDelivery')),
  TrackOrder: lazy(() => import('../pages/TrackOrder')),
  Profile: lazy(() => import('../pages/Profile')),
  SearchResults: lazy(() => import('../pages/SearchResults')),
};

export const vendorPages = {
  Dashboard: lazy(() => import('../pages/Vendor/Dashboard')),
  Shops: lazy(() => import('../pages/Vendor/Shops')),
  Products: lazy(() => import('../pages/Vendor/Products')),
  Orders: lazy(() => import('../pages/Vendor/Orders')),
  Profile: lazy(() => import('../pages/Vendor/Profile')),
};

export const riderPages = {
  Dashboard: lazy(() => import('../pages/Rider/Dashboard')),
  Deliveries: lazy(() => import('../pages/Rider/Deliveries')),
  Profile: lazy(() => import('../pages/Rider/Profile')),
  AvailableOrders: lazy(() => import('../pages/Rider/AvailableOrders')),
  OrderDetails: lazy(() => import('../pages/Rider/OrderDetails')),
  Wallet: lazy(() => import('../pages/Rider/Wallet')),
  Support: lazy(() => import('../pages/Rider/Support')),
};

export const adminPages = {
  Dashboard: lazy(() => import('../pages/Admin/Dashboard')),
  Users: lazy(() => import('../pages/Admin/Users')),
  Vendors: lazy(() => import('../pages/Admin/Vendors')),
  Orders: lazy(() => import('../pages/Admin/Orders')),
  UserManagement: lazy(() => import('../pages/Admin/UserManagement')),
  Payments: lazy(() => import('../pages/Admin/Payments')),
  LiveTracking: lazy(() => import('../pages/Admin/LiveTracking')),
  SystemSettings: lazy(() => import('../pages/Admin/SystemSettings')),
  Reports: lazy(() => import('../pages/Admin/Reports')),
  Support: lazy(() => import('../pages/Admin/Support')),
  ContentManagement: lazy(() => import('../pages/Admin/ContentManagement')),
  AuditLogs: lazy(() => import('../pages/Admin/AuditLogs')),
};
