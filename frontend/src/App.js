import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/layout/Navbar';
import useAuthStore from './store/authStore';
import useCatalogStore from './store/catalogStore';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';
import Loader from './components/common/Loader';

// Lazy load pages for better performance
const Landing = lazy(() => import('./pages/Landing'));
const Home = lazy(() => import('./pages/Home'));
const Categories = lazy(() => import('./pages/Categories'));
const Shops = lazy(() => import('./pages/Shops'));
const ShopDetails = lazy(() => import('./pages/ShopDetails'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const RequestDelivery = lazy(() => import('./pages/RequestDelivery'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Vendor pages
const VendorDashboard = lazy(() => import('./pages/Vendor/Dashboard'));
const VendorShops = lazy(() => import('./pages/Vendor/Shops'));
const VendorProducts = lazy(() => import('./pages/Vendor/Products'));
const VendorOrders = lazy(() => import('./pages/Vendor/Orders'));
const VendorProfile = lazy(() => import('./pages/Vendor/Profile'));

// Rider pages
const RiderDashboard = lazy(() => import('./pages/Rider/Dashboard'));
const RiderDeliveries = lazy(() => import('./pages/Rider/Deliveries'));
const RiderProfile = lazy(() => import('./pages/Rider/Profile'));
const RiderAvailableOrders = lazy(() => import('./pages/Rider/AvailableOrders'));
const RiderOrderDetails = lazy(() => import('./pages/Rider/OrderDetails'));
const RiderWallet = lazy(() => import('./pages/Rider/Wallet'));
const RiderSupport = lazy(() => import('./pages/Rider/Support'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/Admin/Users'));
const AdminVendors = lazy(() => import('./pages/Admin/Vendors'));
const AdminOrders = lazy(() => import('./pages/Admin/Orders'));
const AdminUserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const AdminPayments = lazy(() => import('./pages/Admin/Payments'));
const AdminLiveTracking = lazy(() => import('./pages/Admin/LiveTracking'));
const AdminSystemSettings = lazy(() => import('./pages/Admin/SystemSettings'));
const AdminReports = lazy(() => import('./pages/Admin/Reports'));
const AdminSupport = lazy(() => import('./pages/Admin/Support'));
const AdminContentManagement = lazy(() => import('./pages/Admin/ContentManagement'));
const AdminAuditLogs = lazy(() => import('./pages/Admin/AuditLogs'));

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const logout = useAuthStore((s) => s.logout);
  const currentUser = useAuthStore((s) => s.currentUser);
  const fetchHomeData = useCatalogStore((s) => s.fetchHomeData);

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <Routes>
          <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
          <Route path="/landing" element={<PageWrapper><Landing /></PageWrapper>} />
          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><Home /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><Categories /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shops"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><Shops /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shops/:shopId"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><ShopDetails /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:productId"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><ProductDetails /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><Cart /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><Checkout /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><Orders /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/track-order/:orderId"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><TrackOrder /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><Profile /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/request-delivery"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><RequestDelivery /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <PageWrapper><SearchResults /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
          <Route
            path="/vendor/dashboard"
            element={
              <RoleRoute allowedRoles={['Vendor']}>
                <PageWrapper><VendorDashboard /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/vendor/shops"
            element={
              <RoleRoute allowedRoles={['Vendor']}>
                <PageWrapper><VendorShops /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/vendor/products"
            element={
              <RoleRoute allowedRoles={['Vendor']}>
                <PageWrapper><VendorProducts /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/vendor/orders"
            element={
              <RoleRoute allowedRoles={['Vendor']}>
                <PageWrapper><VendorOrders /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/vendor/profile"
            element={
              <RoleRoute allowedRoles={['Vendor']}>
                <PageWrapper><VendorProfile /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/dashboard"
            element={
              <RoleRoute allowedRoles={['Rider']}>
                <PageWrapper><RiderDashboard /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/available-orders"
            element={
              <RoleRoute allowedRoles={['Rider']}>
                <PageWrapper><RiderAvailableOrders /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/order/:orderId"
            element={
              <RoleRoute allowedRoles={['Rider']}>
                <PageWrapper><RiderOrderDetails /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/order/:orderId/preview"
            element={
              <RoleRoute allowedRoles={['Rider']}>
                <PageWrapper><RiderOrderDetails /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/deliveries"
            element={
              <RoleRoute allowedRoles={['Rider']}>
                <PageWrapper><RiderDeliveries /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/wallet"
            element={
              <RoleRoute allowedRoles={['Rider']}>
                <PageWrapper><RiderWallet /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/support"
            element={
              <RoleRoute allowedRoles={['Rider']}>
                <PageWrapper><RiderSupport /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/rider/profile"
            element={
              <RoleRoute allowedRoles={['Rider']}>
                <PageWrapper><RiderProfile /></PageWrapper>
              </RoleRoute>
            }
          />
          {/* Admin Routes - STRICTLY Admin Only */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <PageWrapper><AdminDashboard /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <PageWrapper><AdminUserManagement /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/vendors"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <PageWrapper><AdminVendors /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <PageWrapper><AdminOrders /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <PageWrapper><AdminPayments /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/tracking"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <PageWrapper><AdminLiveTracking /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <PageWrapper><AdminSystemSettings /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <PageWrapper><AdminReports /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/support"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <PageWrapper><AdminSupport /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <RoleRoute allowedRoles={['Admin']}>
                <PageWrapper><AdminContentManagement /></PageWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <RoleRoute allowedRoles={['Admin']}>
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
  );
}

export default App;
