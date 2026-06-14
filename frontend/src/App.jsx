import { useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/layout/Navbar';
import useAuthStore from './store/authStore';
import useCatalogStore from './store/catalogStore';
import useThemeStore from './store/themeStore';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';
import Loader from './components/common/Loader';
import { ToastProvider } from './components/common/ToastProvider';
import { sharedPages, customerPages, vendorPages, riderPages, adminPages } from './modules/pageModules';

// Domain-grouped page modules for clearer structure.
const { Landing, Login, Register, ForgotPassword, ResetPassword, NotFound } = sharedPages;
const {
  Home,
  Categories,
  Shops,
  ShopDetails,
  ProductDetails,
  Cart,
  Checkout,
  Orders,
  RequestDelivery,
  TrackOrder,
  Profile,
  SearchResults,
} = customerPages;
const {
  Dashboard: VendorDashboard,
  Shops: VendorShops,
  Products: VendorProducts,
  Orders: VendorOrders,
  Profile: VendorProfile,
} = vendorPages;
const {
  Dashboard: RiderDashboard,
  Deliveries: RiderDeliveries,
  Profile: RiderProfile,
  AvailableOrders: RiderAvailableOrders,
  OrderDetails: RiderOrderDetails,
  Wallet: RiderWallet,
  Support: RiderSupport,
} = riderPages;
const {
  Dashboard: AdminDashboard,
  Vendors: AdminVendors,
  Orders: AdminOrders,
  UserManagement: AdminUserManagement,
  Payments: AdminPayments,
  LiveTracking: AdminLiveTracking,
  SystemSettings: AdminSystemSettings,
  Reports: AdminReports,
  Support: AdminSupport,
  ContentManagement: AdminContentManagement,
  AuditLogs: AdminAuditLogs,
} = adminPages;

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const logout = useAuthStore((s) => s.logout);
  const currentUser = useAuthStore((s) => s.currentUser);
  const fetchHomeData = useCatalogStore((s) => s.fetchHomeData);
  const initTheme = useThemeStore((s) => s.initTheme);

  // Initialize theme on app load
  useEffect(() => {
    const cleanup = initTheme();
    return cleanup;
  }, [initTheme]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout]);

  // Warm home catalog and recommendations in the background for customers.
  useEffect(() => {
    if (currentUser?.role === 'Customer') {
      fetchHomeData();
    }
  }, [currentUser, fetchHomeData]);

  // Page wrapper with Suspense
  const PageWrapper = ({ children }) => (
    <Suspense fallback={<Loader label="Loading page..." fullScreen />}>
      {children}
    </Suspense>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <Routes>
          <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
          <Route path="/landing" element={<PageWrapper><Landing /></PageWrapper>} />
          <Route path="/home" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/categories" element={<PageWrapper><Categories /></PageWrapper>} />
          <Route path="/shops" element={<PageWrapper><Shops /></PageWrapper>} />
          <Route path="/shops/:shopId" element={<PageWrapper><ShopDetails /></PageWrapper>} />
          <Route path="/products/:productId" element={<PageWrapper><ProductDetails /></PageWrapper>} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <PageWrapper><Cart /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <PageWrapper><Checkout /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <PageWrapper><Orders /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/track-order/:orderId"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <PageWrapper><TrackOrder /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <PageWrapper><Profile /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/request-delivery"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <PageWrapper><RequestDelivery /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route path="/search" element={<PageWrapper><SearchResults /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
          <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
          <Route path="/reset-password" element={<PageWrapper><ResetPassword /></PageWrapper>} />
          <Route
            path="/vendor/dashboard"
            element={
              <RoleRoute allowedRoles={["Vendor"]}>
                <PageWrapper><VendorDashboard /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/vendor/shops"
            element={
              <RoleRoute allowedRoles={["Vendor"]}>
                <PageWrapper><VendorShops /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/vendor/products"
            element={
              <RoleRoute allowedRoles={["Vendor"]}>
                <PageWrapper><VendorProducts /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/vendor/orders"
            element={
              <RoleRoute allowedRoles={["Vendor"]}>
                <PageWrapper><VendorOrders /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/vendor/profile"
            element={
              <RoleRoute allowedRoles={["Vendor"]}>
                <PageWrapper><VendorProfile /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/dashboard"
            element={
              <RoleRoute allowedRoles={["Rider"]}>
                <PageWrapper><RiderDashboard /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/available-orders"
            element={
              <RoleRoute allowedRoles={["Rider"]}>
                <PageWrapper><RiderAvailableOrders /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/order/:orderId"
            element={
              <RoleRoute allowedRoles={["Rider"]}>
                <PageWrapper><RiderOrderDetails /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/order/:orderId/preview"
            element={
              <RoleRoute allowedRoles={["Rider"]}>
                <PageWrapper><RiderOrderDetails /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/deliveries"
            element={
              <RoleRoute allowedRoles={["Rider"]}>
                <PageWrapper><RiderDeliveries /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/wallet"
            element={
              <RoleRoute allowedRoles={["Rider"]}>
                <PageWrapper><RiderWallet /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/support"
            element={
              <RoleRoute allowedRoles={["Rider"]}>
                <PageWrapper><RiderSupport /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/profile"
            element={
              <RoleRoute allowedRoles={["Rider"]}>
                <PageWrapper><RiderProfile /></PageWrapper>
              </RoleRoute>
            }
          />
          {/* Admin Routes - STRICTLY Admin Only */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <PageWrapper><AdminDashboard /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <PageWrapper><AdminUserManagement /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/vendors"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <PageWrapper><AdminVendors /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <PageWrapper><AdminOrders /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <PageWrapper><AdminPayments /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/tracking"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <PageWrapper><AdminLiveTracking /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <PageWrapper><AdminSystemSettings /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <PageWrapper><AdminReports /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/support"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <PageWrapper><AdminSupport /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <PageWrapper><AdminContentManagement /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <RoleRoute allowedRoles={["Admin"]}>
                <PageWrapper><AdminAuditLogs /></PageWrapper>
              </RoleRoute>
            }
          />
          {/* Catch-all route for 404 errors */}
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </main>
      <Footer />
      </div>
    </ToastProvider>
  );
}

export default App;
