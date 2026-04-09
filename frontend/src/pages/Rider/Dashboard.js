import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import useLiveLocation from '../../hooks/useLiveLocation';
import useAuthStore from '../../store/authStore';
import useRiderStore from '../../store/riderStore';
import Loader from '../../components/common/Loader';
import { ordersApi, ridersApi } from '../../api/endpoints';
import { normalizeLocationOrDefault } from '../../utils/location';

const riderRoutes = [
  { label: 'Dashboard', path: '/rider/dashboard' },
  { label: 'Available Orders', path: '/rider/available-orders' },
  { label: 'My Deliveries', path: '/rider/deliveries' },
  { label: 'Wallet', path: '/rider/wallet' },
  { label: 'Support', path: '/rider/support' },
  { label: 'Profile', path: '/rider/profile' },
];

const RiderDashboard = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [rider, setRider] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOnline, toggleOnlineStatus, stats, earnings, initializeRiderData } = useRiderStore();

  useEffect(() => {
    Promise.all([ordersApi.list(), ridersApi.list()])
      .then(([ord, ridersResponse]) => {
        const normalizedOrders = Array.isArray(ord) ? ord : (ord?.orders || []);
        const riders = Array.isArray(ridersResponse) ? ridersResponse : (ridersResponse?.riders || []);

        setOrders(normalizedOrders);
        const r = riders.find((x) => x.userId === currentUser?.id || x.name === currentUser?.name) || riders[0] || null;
        setRider(r);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [currentUser]);

  const assignedOrders = orders.filter((o) => o.riderId === rider?.id);
  const terminalStatuses = ['delivered', 'cancelled'];
  const ongoingOrders = assignedOrders.filter((o) => !terminalStatuses.includes((o.status || '').toLowerCase()));
  const completedToday = assignedOrders.filter((o) => (o.status || '').toLowerCase() === 'delivered').length;

  useEffect(() => {
    if (rider) {
      initializeRiderData({ rider, orders });
    }
  }, [orders, rider, initializeRiderData]);

  const location = useLiveLocation(rider?.id, rider?.location);
  const mapLocation = normalizeLocationOrDefault(location);

  const handleToggleOnline = async () => {
    await toggleOnlineStatus();
  };

  if (loading) return <Loader label="Loading..." />;

  const displayRider = rider || { id: currentUser?.id, name: currentUser?.name || 'Rider', vehicle: { type: 'Bike', plateNumber: 'N/A' } };
  const vehicleType = typeof displayRider.vehicle === 'object' ? displayRider.vehicle?.type : displayRider.vehicle;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={riderRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Hello {currentUser?.name || displayRider.name}
              </h1>
              <p className="text-sm text-slate-500">
                Vehicle: {vehicleType || 'Bike'} - Status:{' '}
                <span className={isOnline ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </p>
            </div>
            <Button
              variant={isOnline ? 'secondary' : 'primary'}
              onClick={handleToggleOnline}
              className="min-w-[120px]"
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Completed Today</p>
              <p className="text-3xl font-semibold text-slate-900">{stats.completedToday}</p>
              <p className="text-sm text-slate-500">Deliveries</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Ongoing</p>
              <p className="text-3xl font-semibold text-slate-900">{stats.ongoing}</p>
              <p className="text-sm text-slate-500">Active deliveries</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Earnings Today</p>
              <p className="text-3xl font-semibold text-slate-900">Rs. {earnings.today.toFixed(2)}</p>
              <p className="text-sm text-slate-500">Total: Rs. {earnings.total.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Rating</p>
              <p className="text-3xl font-semibold text-slate-900">{stats.rating}</p>
              <p className="text-sm text-slate-500">Community score</p>
            </div>
          </div>
        </div>

        {ongoingOrders.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Active Deliveries</h2>
            <div className="space-y-3">
              {ongoingOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => navigate(`/rider/order/${order.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-primary font-semibold">{order.status}</p>
                      <p className="text-lg font-semibold text-slate-900">Order {order.id}</p>
                      <p className="text-sm text-slate-500">{order.customer?.name} - Rs. {order.total}</p>
                    </div>
                    <Button variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/rider/order/${order.id}`); }}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Location</h2>
          <MapContainer
            center={[mapLocation.lat, mapLocation.lng]}
            zoom={13}
            style={{ height: '320px', borderRadius: '16px', overflow: 'hidden' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[mapLocation.lat, mapLocation.lng]}>
              <Popup>Your Location</Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Button variant="secondary" className="w-full" onClick={() => navigate('/rider/available-orders')}>
            View Available Orders
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/rider/wallet')}>
            View Earnings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;

