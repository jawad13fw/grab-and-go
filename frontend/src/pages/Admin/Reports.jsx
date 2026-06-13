import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { ordersApi, ridersApi, catalogApi, adminApi } from '../../api/endpoints';

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

const Reports = () => {
  const [reportType, setReportType] = useState('rider');
  const [dateRange, setDateRange] = useState('week');
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ordersApi.list(), ridersApi.list(), catalogApi.getShops(), adminApi.getUsers()])
      .then(([ord, r, s, u]) => {
        setOrders(Array.isArray(ord) ? ord : (ord?.orders || []));
        setRiders(Array.isArray(r) ? r : (r?.riders || []));
        setShops(Array.isArray(s) ? s : (s?.shops || []));
        setUsers(Array.isArray(u) ? u : (u?.users || []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleExport = (format) => {
    alert(`Exporting ${reportType} report as ${format.toUpperCase()}...`);
  };

  const riderPerformance = riders.map((rider) => {
    const riderOrders = orders.filter((o) => o.riderId === rider.id);
    const completed = riderOrders.filter((o) => o.status === 'Delivered').length;
    return { name: rider.name, deliveries: completed, rating: 4.9, earnings: completed * 5 };
  });

  const shopSales = (shops || []).map((shop) => {
    const shopOrders = (orders || []).filter((o) => o.shopId === shop.id);
    const revenue = (shopOrders || []).reduce((sum, o) => sum + (o.total || 0), 0);
    return { name: shop.name, orders: shopOrders.length, revenue };
  });

  const customerActivity = (users || [])
    .filter((u) => u.role === 'Customer')
    .map((customer) => {
      const customerOrders = (orders || []).filter((o) => o.userId === customer.id || o.customer?.name === customer.name);
      return {
        name: customer.name,
        totalOrders: customerOrders.length,
        totalSpent: (customerOrders || []).reduce((sum, o) => sum + (o.total || 0), 0),
      };
    });

  const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-slate-900">Reports & Analytics</h1>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => handleExport('csv')}>Export CSV</Button>
              <Button variant="secondary" onClick={() => handleExport('pdf')}>Export PDF</Button>
              <Button variant="secondary" onClick={() => handleExport('excel')}>Export Excel</Button>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            {['rider', 'shop', 'customer', 'revenue'].map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${reportType === type ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {type} Report
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${dateRange === range ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {reportType === 'rider' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Rider Performance Report</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Rider Name</th>
                    <th className="px-6 py-3">Deliveries</th>
                    <th className="px-6 py-3">Rating</th>
                    <th className="px-6 py-3">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {riderPerformance.map((rider, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{rider.name}</td>
                      <td className="px-6 py-4">{rider.deliveries}</td>
                      <td className="px-6 py-4">{rider.rating}</td>
                      <td className="px-6 py-4 font-semibold">Rs. {rider.earnings.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'shop' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Shop Sales Analytics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Shop Name</th>
                    <th className="px-6 py-3">Total Orders</th>
                    <th className="px-6 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {shopSales.map((shop, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{shop.name}</td>
                      <td className="px-6 py-4">{shop.orders}</td>
                      <td className="px-6 py-4 font-semibold">Rs. {shop.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'customer' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Customer Activity Report</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Customer Name</th>
                    <th className="px-6 py-3">Total Orders</th>
                    <th className="px-6 py-3">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {customerActivity.map((customer, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{customer.name}</td>
                      <td className="px-6 py-4">{customer.totalOrders}</td>
                      <td className="px-6 py-4 font-semibold">Rs. {customer.totalSpent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'revenue' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Revenue Summary</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Total Revenue</p>
                  <p className="text-3xl font-semibold text-slate-900">Rs. {totalRevenue.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Platform Fee</p>
                  <p className="text-3xl font-semibold text-slate-900">Rs. {(totalRevenue * 0.05).toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Orders</p>
                  <p className="text-3xl font-semibold text-slate-900">{orders.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
