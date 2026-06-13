import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { ordersApi } from '../api/endpoints';

const Profile = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    ordersApi.list()
      .then((data) => setOrders(Array.isArray(data) ? data : (data?.orders || [])))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const customerOrders = orders;

  if (!currentUser) return null;
  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Profile</p>
          <h1 className="text-3xl font-semibold text-slate-900">{currentUser.name}</h1>
          <p className="text-sm text-slate-500">{currentUser.email}</p>
          <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {currentUser.role}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Orders</p>
            <p className="text-3xl font-semibold text-slate-900">
              {customerOrders.length || currentUser.orders || 0}
            </p>
            <p className="text-sm text-slate-500">Total completed</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Member since</p>
            <p className="text-3xl font-semibold text-slate-900">2024</p>
            <p className="text-sm text-slate-500">Account</p>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Recent activity</h2>
          {customerOrders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No orders associated with this profile yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {customerOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{order.id}</span>
                    <span>{order.status}</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">₨{order.total}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Quick links</h3>
        <div className="space-y-3 text-sm">
          <Button className="w-full" onClick={() => navigate('/orders')}>
            View orders
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/cart')}>
            Open cart
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/categories')}>
            Browse categories
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
