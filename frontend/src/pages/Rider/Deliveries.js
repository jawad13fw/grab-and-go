import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import RiderDeliveryCard from '../../components/rider/RiderDeliveryCard';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import useAuthStore from '../../store/authStore';
import { ordersApi, ridersApi, catalogApi } from '../../api/endpoints';

const riderRoutes = [
  { label: 'Dashboard', path: '/rider/dashboard' },
  { label: 'Available Orders', path: '/rider/available-orders' },
  { label: 'My Deliveries', path: '/rider/deliveries' },
  { label: 'Wallet', path: '/rider/wallet' },
  { label: 'Support', path: '/rider/support' },
  { label: 'Profile', path: '/rider/profile' },
];

const RiderDeliveries = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ordersApi.list(),
      ridersApi.list(),
      catalogApi.getShops(),
      catalogApi.getProducts(),
    ])
      .then(([ord, r, s, p]) => {
        setOrders(Array.isArray(ord) ? ord : (ord?.orders || []));
        setRiders(Array.isArray(r) ? r : (r?.riders || []));
        setShops(Array.isArray(s) ? s : (s?.shops || []));
        setProducts(Array.isArray(p) ? p : (p?.products || []));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const rider = riders.find((r) => r.name === currentUser?.name || r.userId === currentUser?.id) || riders[0];
  const assignedOrders = orders.filter((o) => o.riderId === rider?.id);
  const activeOrders = assignedOrders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status));
  const completedOrders = assignedOrders.filter((o) => o.status === 'Delivered');
  const productMap = (products || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
  const shopMap = (shops || []).reduce((acc, s) => ({ ...acc, [s.id]: s }), {});

  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={riderRoutes} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My Deliveries</h1>
            <p className="text-sm text-slate-500 mt-1">
              {assignedOrders.length} total {assignedOrders.length === 1 ? 'delivery' : 'deliveries'}
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/rider/available-orders')}>
            View Available Orders
          </Button>
        </div>

        {activeOrders.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Active Deliveries</h2>
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const shop = shopMap[order.shopId];
                const productSummary = (order.products || [])
                  .map((entry) => `${productMap[entry.productId]?.name || 'Item'} x${entry.quantity}`)
                  .join(', ');
                return (
                  <div key={order.id} onClick={() => navigate(`/rider/order/${order.id}`)} className="cursor-pointer">
                    <RiderDeliveryCard order={order} shop={shop} productSummary={productSummary} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Completed Deliveries</h2>
            <div className="space-y-4">
              {completedOrders.map((order) => {
                const shop = shopMap[order.shopId];
                const productSummary = (order.products || [])
                  .map((entry) => `${productMap[entry.productId]?.name || 'Item'} x${entry.quantity}`)
                  .join(', ');
                return (
                  <div key={order.id} onClick={() => navigate(`/rider/order/${order.id}`)} className="cursor-pointer opacity-75">
                    <RiderDeliveryCard order={order} shop={shop} productSummary={productSummary} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {assignedOrders.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <p className="text-slate-500 mb-4">No deliveries assigned yet.</p>
            <Button onClick={() => navigate('/rider/available-orders')}>
              View Available Orders
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDeliveries;

