import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Sidebar from '../../components/layout/Sidebar';
import { ordersApi, ridersApi } from '../../api/endpoints';
import useRiderStore from '../../store/riderStore';

const riderRoutes = [
  { label: 'Dashboard', path: '/rider/dashboard' },
  { label: 'Available Orders', path: '/rider/available-orders' },
  { label: 'My Deliveries', path: '/rider/deliveries' },
  { label: 'Wallet', path: '/rider/wallet' },
  { label: 'Support', path: '/rider/support' },
  { label: 'Profile', path: '/rider/profile' },
];

const RiderProfile = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const { initializeRiderData } = useRiderStore();
  const [riders, setRiders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ordersApi.list(), ridersApi.list()])
      .then(([ord, r]) => {
        setOrders(Array.isArray(ord) ? ord : (ord?.orders || []));
        setRiders(Array.isArray(r) ? r : (r?.riders || []));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const riderRecord = riders.find((r) => r.name === currentUser?.name || r.userId === currentUser?.id) || riders[0];
  const assignedOrders = orders.filter((o) => o.riderId === riderRecord?.id);

  useEffect(() => {
    if (riderRecord) {
      initializeRiderData({ rider: riderRecord, orders });
    }
  }, [orders, riderRecord, initializeRiderData]);

  if (!currentUser) return null;
  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={riderRoutes} />
      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Rider profile</p>
          <h1 className="text-3xl font-semibold text-slate-900">{currentUser.name || riderRecord?.name}</h1>
          <p className="text-sm text-slate-500">{currentUser.email}</p>
          {riderRecord && (
            <span className="inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {typeof riderRecord.vehicle === 'object' ? riderRecord.vehicle?.type : riderRecord.vehicle} · {riderRecord.isOnline ? 'Online' : 'Offline'}
            </span>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Deliveries</p>
            <p className="text-3xl font-semibold text-slate-900">{assignedOrders.length || currentUser.deliveries || 0}</p>
            <p className="text-sm text-slate-500">Assigned</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Rating</p>
            <p className="text-3xl font-semibold text-slate-900">{(riderRecord?.rating ?? 0).toFixed(1)}</p>
            <p className="text-sm text-slate-500">Community score</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Vehicle</p>
            <p className="text-3xl font-semibold text-slate-900">
              {typeof riderRecord?.vehicle === 'object' ? riderRecord?.vehicle?.type : (riderRecord?.vehicle || 'Bike')}
            </p>
            <p className="text-sm text-slate-500">Preferred mode</p>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Active deliveries</h2>
          {assignedOrders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No active deliveries at the moment.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {assignedOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{order.id}</span>
                    <span>{order.status}</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{order.customer?.name}</p>
                  <p className="text-sm text-slate-500">{order.customer?.address}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Quick actions</h3>
        <div className="space-y-3 text-sm">
          <Button className="w-full" onClick={() => window.open('https://maps.google.com', '_blank')}>
            Open navigation
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => window.open('tel:+923000000000')}>
            Contact support
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => window.open('mailto:support@grabgo.app')}>
            Report issue
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default RiderProfile;
