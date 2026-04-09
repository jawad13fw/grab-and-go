import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserGroupIcon, ShoppingBagIcon, TruckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import AdminStatCard from '../../components/admin/AdminStatCard';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { adminApi, ridersApi, catalogApi } from '../../api/endpoints';
import { useSocket } from '../../hooks/useSocket';

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
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [riders, setRiders] = useState([]);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const socket = useSocket();

  const refreshDashboardData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [a, r, s, u] = await Promise.all([
        adminApi.getAnalytics(),
        ridersApi.list(),
        catalogApi.getShops(),
        adminApi.getUsers({ page: 1, limit: 200 }),
      ]);

      setAnalytics(a || {});
      setRiders(Array.isArray(r) ? r : (r?.riders || []));
      setShops(Array.isArray(s) ? s : (s?.shops || []));
      setUsers(Array.isArray(u) ? u : (u?.users || []));
      setLastUpdated(new Date());
    } catch (_) {
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboardData(true);

    const interval = setInterval(() => {
      refreshDashboardData(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshDashboardData]);

  useEffect(() => {
    if (!socket) return;

    const handleAnalyticsUpdated = () => {
      refreshDashboardData(false);
    };

    socket.on('analytics_updated', handleAnalyticsUpdated);

    return () => {
      socket.off('analytics_updated', handleAnalyticsUpdated);
    };
  }, [socket, refreshDashboardData]);

  const onlineRiders = riders.filter((r) => r.isOnline).length;
  const userList = users;

  if (loading) return <Loader label="Loading..." />;

  const a = analytics || {};
  const ordersToday = a.ordersToday ?? 0;
  const revenueToday = a.revenueToday ?? 0;
  const pendingOrders = a.statusBreakdown?.pending ?? 0;
  const inProgressOrders = a.statusBreakdown?.inProgress ?? 0;
  const deliveredOrders = a.statusBreakdown?.delivered ?? 0;
  const cancelledOrders = a.statusBreakdown?.cancelled ?? 0;
  const orderTrends = a.orderTrends?.length ? a.orderTrends : Array(7).fill(0);
  const revenueTrends = a.revenueTrends?.length ? a.revenueTrends : Array(7).fill(0);
  const activeOrders = a.activeOrders ?? (pendingOrders + inProgressOrders);
  const totalCustomers = a.customers ?? userList.filter((u) => u.role === 'Customer').length;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Admin control</p>
          <h1 className="text-3xl font-semibold text-slate-900">Platform overview</h1>
          <p className="mt-2 text-xs text-slate-500">
            {lastUpdated ? `Live data • Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Live data'}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <AdminStatCard title="Total Customers" value={totalCustomers} change={a.userGrowth ?? 0} icon={<UserGroupIcon className="h-6 w-6" />} />
          <AdminStatCard title="Total Shops" value={shops.length} change={a.shopGrowth ?? 0} icon={<ShoppingBagIcon className="h-6 w-6" />} />
          <AdminStatCard title="Total Riders" value={riders.length} change={a.riderGrowth ?? 0} icon={<TruckIcon className="h-6 w-6" />} />
          <AdminStatCard title="Orders Today" value={ordersToday} change={a.orderGrowth ?? 0} icon={<ShoppingBagIcon className="h-6 w-6" />} />
          <AdminStatCard title="Revenue Today" value={`Rs. ${revenueToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} change={a.revenueGrowth ?? 0} icon={<CurrencyDollarIcon className="h-6 w-6" />} />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Status Overview</h3>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { label: 'Pending', count: pendingOrders, color: 'bg-amber-100 text-amber-700' },
              { label: 'In Progress', count: inProgressOrders, color: 'bg-blue-100 text-blue-700' },
              { label: 'Delivered', count: deliveredOrders, color: 'bg-emerald-100 text-emerald-700' },
              { label: 'Cancelled', count: cancelledOrders, color: 'bg-rose-100 text-rose-700' },
              { label: 'Active', count: activeOrders, color: 'bg-slate-100 text-slate-700' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 p-4 text-center">
                <p className="text-3xl font-semibold text-slate-900">{stat.count}</p>
                <p className={`text-xs font-semibold uppercase tracking-wide mt-1 ${stat.color} rounded-full px-2 py-1 inline-block`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Trend (7 days)</h3>
            <div className="mt-6 flex items-end gap-2">
              {orderTrends.map((value, index) => (
                <div key={index} className="flex-1">
                  <div className="rounded-t-2xl bg-primary transition-all hover:bg-primary/80" style={{ height: `${Math.max(20, value * 3)}px` }} title={`${value} orders`} />
                  <p className="mt-2 text-center text-xs text-slate-500">Day {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trend (7 days)</h3>
            <div className="mt-6 flex items-end gap-2">
              {revenueTrends.map((value, index) => {
                return (
                  <div key={index} className="flex-1">
                    <div className="rounded-t-2xl bg-emerald-500 transition-all hover:bg-emerald-600" style={{ height: `${Math.max(20, value / 10)}px` }} title={`Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                    <p className="mt-2 text-center text-xs text-slate-500">Day {index + 1}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Operational Snapshot</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Avg Delivery Time</p>
              <p className="text-2xl font-semibold text-slate-900">{(a.averageDeliveryTimeMinutes ?? 0).toFixed(1)} min</p>
              <p className="text-xs text-emerald-600 mt-1">Based on delivered orders</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Delivery Success Rate</p>
              <p className="text-2xl font-semibold text-slate-900">{(a.deliverySuccessRate ?? 0).toFixed(1)}%</p>
              <p className="text-xs text-emerald-600 mt-1">Delivered vs total orders</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Active Riders</p>
              <p className="text-2xl font-semibold text-slate-900">{a.activeRiders ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">Online or available</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Active Orders</p>
              <p className="text-2xl font-semibold text-slate-900">{activeOrders}</p>
              <p className="text-xs text-emerald-600 mt-1">In progress right now</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Online riders</p>
            <p className="text-3xl font-semibold text-slate-900">{onlineRiders}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Vendors</p>
            <p className="text-3xl font-semibold text-slate-900">{shops.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Orders delivered</p>
            <p className="text-3xl font-semibold text-slate-900">{deliveredOrders}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Button variant="secondary" className="w-full" onClick={() => navigate('/admin/users')}>Manage Users</Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/admin/orders')}>View All Orders</Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/admin/payments')}>Payments Control</Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/admin/tracking')}>Live Tracking</Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

