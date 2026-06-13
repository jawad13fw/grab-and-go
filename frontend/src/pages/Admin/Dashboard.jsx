import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { ordersApi, adminApi, catalogApi } from '../../api/endpoints';
import Loader from '../../components/common/Loader';
import AdminStatCard from '../../components/admin/AdminStatCard';

const adminRoutes = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'User Management', path: '/admin/users' },
  { label: 'Orders', path: '/admin/orders' },
  { label: 'Payments', path: '/admin/payments' },
  { label: 'Live Tracking', path: '/admin/tracking' },
  { label: 'System Settings', path: '/admin/settings' },
  { label: 'Reports', path: '/admin/reports' },
  { label: 'Support', path: '/admin/support' },
  { label: 'Content', path: '/admin/content' },
  { label: 'Audit Logs', path: '/admin/logs' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Backend admin analytics endpoint is `/api/admin/analytics`
    // (this UI previously called a non-existent `adminApi.getStats()` which breaks rendering)
    Promise.all([adminApi.getAnalytics(), ordersApi.list(), catalogApi.getShops()])
      .then(([analytics, orders, shops]) => {
        setStats({
          ...(analytics || {}),
          ordersCount: orders?.length || 0,
          shopsCount: shops?.length || 0,
          // Keep `recentActivity` optional; ensure the UI never crashes.
          recentActivity: analytics?.recentActivity || [],
          activeRiders: analytics?.activeRiders ?? 0,
        });
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading admin dashboard..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of platform activity and health.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <AdminStatCard label="Total Orders" value={stats?.ordersCount || 0} />
          <AdminStatCard label="Total Shops" value={stats?.shopsCount || 0} />
          <AdminStatCard label="Active Riders" value={stats?.activeRiders || 0} />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {(stats?.recentActivity || []).map((act) => (
              <div key={act.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                <div>
                  <p className="text-sm text-slate-500">{act.type}</p>
                  <p className="font-semibold text-slate-900">{act.message}</p>
                </div>
                <div className="text-sm text-slate-500">{new Date(act.time).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
