import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import useRiderStore from '../../store/riderStore';
import useAuthStore from '../../store/authStore';
import { ridersApi, catalogApi } from '../../api/endpoints';

const riderRoutes = [
  { label: 'Dashboard', path: '/rider/dashboard' },
  { label: 'Available Orders', path: '/rider/available-orders' },
  { label: 'My Deliveries', path: '/rider/deliveries' },
  { label: 'Wallet', path: '/rider/wallet' },
  { label: 'Support', path: '/rider/support' },
  { label: 'Profile', path: '/rider/profile' },
];

const AvailableOrders = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { isOnline } = useRiderStore();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);

  useEffect(() => {
    if (!isOnline) return;
    Promise.all([ridersApi.getAvailableOrders(), catalogApi.getShops()])
      .then(([ord, s]) => {
        const normalizedOrders = Array.isArray(ord) ? ord : (ord?.orders || []);
        setAvailableOrders(normalizedOrders);
        setShops(Array.isArray(s) ? s : (s?.shops || []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOnline]);

  const formatDistance = (order) => {
    const distance = order?.tracking?.distance;
    if (typeof distance !== 'number') return 'N/A';
    return `${distance.toFixed(1)} km`;
  };

  const formatEta = (order) => {
    if (!order?.tracking?.eta) return 'N/A';
    const etaDate = new Date(order.tracking.eta);
    if (Number.isNaN(etaDate.getTime())) return 'N/A';
    return etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleAcceptOrder = async (orderId) => {
    if (!isOnline) {
      alert('Please go online first to accept orders');
      return;
    }
    setAcceptingOrderId(orderId);
    try {
      const { ordersApi } = await import('../../api/endpoints');
      await ordersApi.accept(orderId);
      navigate(`/rider/order/${orderId}`);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to accept order');
    } finally {
      setAcceptingOrderId(null);
    }
  };

  if (!isOnline) {
    return (
      <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
        <Sidebar routes={riderRoutes} />
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Go Online to See Orders</h2>
          <p className="text-slate-500 mb-6">
            You need to be online to view and accept available orders.
          </p>
          <Button onClick={() => navigate('/rider/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={riderRoutes} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Available Orders</h1>
            <p className="text-sm text-slate-500 mt-1">
              {availableOrders.length} unassigned {availableOrders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>
        </div>

        {availableOrders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <p className="text-slate-500">No available orders at the moment.</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/rider/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {availableOrders.map((order) => {
              const shop = shops.find((s) => s.id === order.shopId);
              const isAccepting = acceptingOrderId === order.id;
              return (
                <div
                  key={order.id}
                  className={`rounded-3xl border p-6 shadow-sm ${order.isEmergency ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-xs uppercase tracking-wide font-semibold ${order.isEmergency ? 'text-amber-700' : 'text-primary'}`}>
                          Order {order.id}
                        </p>
                        {order.isEmergency && (
                          <span className="rounded-full bg-amber-500 px-2 py-1 text-xs font-semibold text-white animate-pulse">
                            FAST DELIVERY
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{shop?.name}</h3>
                      <p className="text-sm text-slate-500">{shop?.address}</p>
                      {order.isEmergency && (
                        <p className="text-xs text-amber-700 font-semibold mt-1">
                          Priority: 15-30 min delivery required
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-slate-900">Rs. {order.total}</p>
                      <p className="text-xs text-slate-500">Order Amount</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 mb-4">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Distance</p>
                      <p className="text-lg font-semibold text-slate-900">{formatDistance(order)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">ETA</p>
                      <p className="text-lg font-semibold text-slate-900">{formatEta(order)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Items</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {(order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className={`flex-1 ${order.isEmergency ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={isAccepting}
                    >
                      {isAccepting ? 'Accepting...' : order.isEmergency ? 'Accept Fast Delivery' : 'Accept Order'}
                    </Button>
                    <Button variant="ghost" onClick={() => navigate(`/rider/order/${order.id}/preview`)}>
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableOrders;
