import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, Polyline } from 'react-leaflet';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import useLiveLocation from '../../hooks/useLiveLocation';
import useRiderStore from '../../store/riderStore';
import useAuthStore from '../../store/authStore';
import Loader from '../../components/common/Loader';
import { ordersApi, ridersApi, catalogApi } from '../../api/endpoints';
import { useOrderStatus } from '../../hooks/useSocket';
import { normalizeLocationOrDefault } from '../../utils/location';
import { getRiderEarningForOrder } from '../../utils/orderMetrics';

const riderRoutes = [
  { label: 'Dashboard', path: '/rider/dashboard' },
  { label: 'Available Orders', path: '/rider/available-orders' },
  { label: 'My Deliveries', path: '/rider/deliveries' },
  { label: 'Wallet', path: '/rider/wallet' },
  { label: 'Support', path: '/rider/support' },
  { label: 'Profile', path: '/rider/profile' },
];

const DELIVERY_STATUSES = [
  { key: 'arrived', label: 'Arrived at Pickup', icon: 'PIN' },
  { key: 'picked', label: 'Picked Order', icon: 'BOX' },
  { key: 'onway', label: 'On the Way', icon: 'CAR' },
  { key: 'delivered', label: 'Delivered', icon: 'OK' },
];

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { updateEarnings, updateStats } = useRiderStore();
  const [order, setOrder] = useState(null);
  const [rider, setRider] = useState(null);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('Assigned');
  const [navigationMode, setNavigationMode] = useState(false);
  const [turnByTurnDirections, setTurnByTurnDirections] = useState([]);
  const [statusError, setStatusError] = useState(null);

  const isPreviewMode = location.pathname.endsWith('/preview');

  useEffect(() => {
    if (!orderId) return;
    ordersApi.get(orderId)
      .then((ord) => {
        setOrder(ord);
        setCurrentStatus(ord?.status || 'Assigned');
        return Promise.all([
          ridersApi.list(),
          ord?.shopId ? catalogApi.getShop(ord.shopId) : null,
          catalogApi.getProducts(),
        ]).then(([ridersResponse, s, p]) => {
          const riders = Array.isArray(ridersResponse)
            ? ridersResponse
            : (ridersResponse?.riders || []);
          const r = riders.find((x) => x.id === ord?.riderId || x.userId === currentUser?.id) || riders[0] || null;
          setRider(r);
          setShop(s || null);
          setProducts(Array.isArray(p) ? p : (p?.products || []));
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId, currentUser]);

  const riderLocation = useLiveLocation(rider?.id, rider?.location, order?.id);
  const safeRiderLocation = normalizeLocationOrDefault(riderLocation);
  const shopPosition = normalizeLocationOrDefault(shop?.location, {
    lat: safeRiderLocation.lat - 0.01,
    lng: safeRiderLocation.lng - 0.01,
  });
  const customerPosition = normalizeLocationOrDefault(order?.deliveryAddress, {
    lat: safeRiderLocation.lat + 0.02,
    lng: safeRiderLocation.lng + 0.02,
  });
  
  // Setup real-time order status updates
  const { updateStatus } = useOrderStatus(orderId);
  const isAssignedToCurrentRider = Boolean(rider?.id && order?.riderId === rider.id);

  useEffect(() => {
    if (navigationMode) {
      setTurnByTurnDirections([
        { instruction: 'Head north on Main St', distance: '0.2 km' },
        { instruction: 'Turn right onto Oak Ave', distance: '0.5 km' },
        { instruction: 'Continue straight for 1.2 km', distance: '1.2 km' },
        { instruction: 'Destination on the right', distance: '0.1 km' },
      ]);
    }
  }, [navigationMode]);

  if (loading) return <Loader label="Loading..." />;
  if (!order) {
    return (
      <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
        <Sidebar routes={riderRoutes} />
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Order Not Found</h2>
          <Button onClick={() => navigate('/rider/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (order.riderId && order.riderId !== rider?.id) {
    return (
      <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
        <Sidebar routes={riderRoutes} />
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-slate-500 mb-6">This order is not assigned to you.</p>
          <Button onClick={() => navigate('/rider/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const productMap = (products || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
  const maskCustomerName = (name) => {
    const parts = (name || '').split(' ');
    if (parts.length > 1) return `${parts[0][0]}. ${parts[parts.length - 1]}`;
    return `${(name || '')[0]}***`;
  };

  const handleStatusUpdate = async (statusKey) => {
    setStatusError(null);

    if (isPreviewMode) {
      setStatusError('This is preview mode. Accept the order first from Available Orders to update delivery status.');
      return;
    }

    if (!isAssignedToCurrentRider) {
      setStatusError('You can update status only after this order is assigned to your rider profile.');
      return;
    }

    const statusMap = {
      arrived: 'confirmed',
      picked: 'out_for_delivery',
      onway: 'out_for_delivery',
      delivered: 'delivered',
    };
    const newStatus = statusMap[statusKey];
    if (!newStatus) return;
    setCurrentStatus(newStatus);
    
    try {
      // Update status via Socket.io for real-time updates
      updateStatus(newStatus);
      
      // Also update via REST API for persistence
      await ordersApi.updateStatus(order.id, newStatus);
      
      if (statusKey === 'delivered') {
        const deliveryEarning = getRiderEarningForOrder(order);
        updateEarnings(deliveryEarning);
        updateStats({ completedToday: useRiderStore.getState().stats.completedToday + 1 });
        // Show success message (could be replaced with toast notification)
        console.log(`Order delivered! You earned Rs. ${deliveryEarning.toFixed(2)}`);
        navigate('/rider/dashboard');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      // Show error message (could be replaced with toast notification)
      setStatusError(err.response?.data?.message || 'Failed to update status');
      console.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleStartNavigation = () => {
    setNavigationMode(true);
    const destination = currentStatus === 'Assigned' || currentStatus === 'Arrived at Pickup' ? shopPosition : customerPosition;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`, '_blank');
  };

  const safeCustomerPosition = normalizeLocationOrDefault(customerPosition, {
    lat: safeRiderLocation.lat + 0.02,
    lng: safeRiderLocation.lng + 0.02,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={riderRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs uppercase tracking-wide text-primary font-semibold">{currentStatus}</p>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Live</span>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">Order {order.id}</h1>
            </div>
            <Button variant="secondary" onClick={() => navigate('/rider/dashboard')}>
              Back to Dashboard
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Customer</p>
              <p className="text-lg font-semibold text-slate-900">{maskCustomerName(order.customer?.name)}</p>
              <p className="text-sm text-slate-500 mt-1">Phone: {(order.customer?.phone || '').replace(/\d(?=\d{4})/g, '*')}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Order Total</p>
              <p className="text-2xl font-semibold text-slate-900">Rs. {order.total}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-2">Pickup Location</p>
              <p className="text-lg font-semibold text-slate-900">{shop?.name}</p>
              <p className="text-sm text-slate-500">{shop?.address}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-2">Delivery Location</p>
              <p className="text-lg font-semibold text-slate-900">{order.customer?.address}</p>
              <p className="text-sm text-slate-500">Customer Address</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 mb-6">
            <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-3">Order Items</p>
            <div className="space-y-2">
              {(order.products || []).map((item, index) => {
                const product = productMap[item.productId];
                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{product?.name || 'Item'} x {item.quantity}</span>
                    <span className="text-slate-900 font-semibold">Rs. {Number((product?.price || 0) * item.quantity).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold mb-2">Special Instructions</p>
            <p className="text-sm text-amber-900">{order.specialInstructions || 'No special instructions. Please handle with care.'}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Live Navigation</h2>
            <Button onClick={handleStartNavigation} variant="primary">
              {navigationMode ? 'Navigation Active' : 'Start Navigation'}
            </Button>
          </div>
          {navigationMode && turnByTurnDirections.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm font-semibold text-slate-900 mb-2">Turn-by-Turn Directions:</p>
              {turnByTurnDirections.map((dir, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <span className="text-lg">{dir.instruction}</span>
                  <span className="text-xs text-slate-500 ml-auto">{dir.distance}</span>
                </div>
              ))}
            </div>
          )}
          <MapContainer
            center={[safeRiderLocation.lat, safeRiderLocation.lng]}
            zoom={13}
            style={{ height: '400px', borderRadius: '16px', overflow: 'hidden' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[shopPosition.lat, shopPosition.lng]}>
              <Popup>Pickup: {shop?.name}</Popup>
            </Marker>
            <Marker position={[safeRiderLocation.lat, safeRiderLocation.lng]}>
              <Popup>Your Location</Popup>
            </Marker>
            <Marker position={[safeCustomerPosition.lat, safeCustomerPosition.lng]}>
              <Popup>Delivery: {order.customer?.address}</Popup>
            </Marker>
            <Polyline
              positions={[
                [shopPosition.lat, shopPosition.lng],
                [safeRiderLocation.lat, safeRiderLocation.lng],
                [safeCustomerPosition.lat, safeCustomerPosition.lng],
              ]}
              color="#10b981"
            />
          </MapContainer>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Update Delivery Status</h2>
          {statusError && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {statusError}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {DELIVERY_STATUSES.map((status) => {
              const isActive =
                currentStatus === status.label ||
                (status.key === 'arrived' && currentStatus === 'Assigned') ||
                (status.key === 'picked' && currentStatus === 'Arrived at Pickup') ||
                (status.key === 'onway' && currentStatus === 'Picked Order') ||
                (status.key === 'delivered' && currentStatus === 'Out for delivery');
              const isCompleted = DELIVERY_STATUSES.findIndex((s) => s.label === currentStatus) > DELIVERY_STATUSES.findIndex((s) => s.key === status.key);
              return (
                <Button
                  key={status.key}
                  variant={isCompleted ? 'secondary' : isActive ? 'primary' : 'ghost'}
                  onClick={() => handleStatusUpdate(status.key)}
                  disabled={(isCompleted && status.key !== 'delivered') || isPreviewMode || !isAssignedToCurrentRider}
                  className="justify-start"
                >
                  <span className="mr-2">{status.icon}</span>
                  {status.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
