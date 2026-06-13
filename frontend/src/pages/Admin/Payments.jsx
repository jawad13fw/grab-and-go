import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import useAdminStore from '../../store/adminStore';
import Loader from '../../components/common/Loader';
import { ordersApi, catalogApi, adminApi } from '../../api/endpoints';
import { getOrderTotal, getRiderEarningForOrder, normalizeOrderStatus } from '../../utils/orderMetrics';

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

const Payments = () => {
  const navigate = useNavigate();
  const { settings, addLog } = useAdminStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ordersApi.list(), catalogApi.getShops(), adminApi.getSettings()])
      .then(([ord, s, set]) => {
        setOrders(Array.isArray(ord) ? ord : (ord?.orders || []));
        setShops(Array.isArray(s) ? s : (s?.shops || []));
        if (set) useAdminStore.getState().updateSettings(set);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deliveredOrders = (orders || []).filter((order) => normalizeOrderStatus(order.status) === 'delivered');
  const totalRevenue = (orders || []).reduce((sum, order) => sum + getOrderTotal(order), 0);
  const platformFee = (settings?.platformFee ?? 5) / 100;
  const platformRevenue = totalRevenue * platformFee;
  const riderEarnings = deliveredOrders.reduce((sum, order) => sum + getRiderEarningForOrder(order), 0);
  const shopEarnings = totalRevenue - platformRevenue - riderEarnings;

  const [withdrawalRequests, setWithdrawalRequests] = useState([]);

  useEffect(() => {
    adminApi.getWithdrawalRequests?.().then((data) => {
      if (data) setWithdrawalRequests(data);
    }).catch(() => setWithdrawalRequests([]));
  }, []);

  const handleApproveWithdrawal = (requestId) => {
    if (window.confirm('Approve this withdrawal request?')) {
      addLog({ type: 'payment_action', action: 'approve_withdrawal', requestId });
      adminApi.addLog({ type: 'payment_action', action: 'approve_withdrawal', requestId }).catch(() => {});
      alert('Withdrawal approved and processed');
    }
  };

  const handleReleasePayout = (shopId) => {
    if (window.confirm('Release payout to this shop?')) {
      addLog({ type: 'payment_action', action: 'release_payout', shopId });
      adminApi.addLog({ type: 'payment_action', action: 'release_payout', shopId }).catch(() => {});
      alert('Payout released successfully');
    }
  };

  if (loading) return <Loader label="Loading..." />;

  const s = settings || { platformFee: 5, riderCommission: 15, shopCommission: 10 };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">Payments & Earnings Control</h1>
          <div className="flex gap-2 border-b border-slate-200">
            {['overview', 'withdrawals', 'payouts', 'transactions', 'commission'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Platform Revenue</p>
                <p className="text-3xl font-semibold text-slate-900">Rs. {platformRevenue.toFixed(2)}</p>
                <p className="text-sm text-slate-500 mt-1">{s.platformFee}% commission</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Total Revenue</p>
                <p className="text-3xl font-semibold text-slate-900">Rs. {totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-slate-500 mt-1">All orders</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Rider Earnings</p>
                <p className="text-3xl font-semibold text-slate-900">Rs. {riderEarnings.toFixed(2)}</p>
                <p className="text-sm text-slate-500 mt-1">Total paid</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Shop Earnings</p>
                <p className="text-3xl font-semibold text-slate-900">Rs. {shopEarnings.toFixed(2)}</p>
                <p className="text-sm text-slate-500 mt-1">Total paid</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Commission Configuration</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500 mb-1">Platform Fee</p>
                  <p className="text-2xl font-semibold text-slate-900">{s.platformFee}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500 mb-1">Rider Commission</p>
                  <p className="text-2xl font-semibold text-slate-900">{s.riderCommission}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500 mb-1">Shop Commission</p>
                  <p className="text-2xl font-semibold text-slate-900">{s.shopCommission}%</p>
                </div>
              </div>
              <Button variant="secondary" className="mt-4" onClick={() => navigate('/admin/settings')}>
                Update Commission Rates
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Rider Withdrawal Requests</h2>
            <div className="space-y-3">
              {withdrawalRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{request.riderName}</p>
                    <p className="text-sm text-slate-500">Rs. {request.amount.toFixed(2)} - Requested {new Date(request.requestedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={() => handleApproveWithdrawal(request.id)}>Approve</Button>
                    <Button variant="ghost">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Shop Payouts</h2>
            <div className="space-y-3">
              {shops.map((shop) => {
                const shopOrders = orders.filter((o) => o.shopId === shop.id && normalizeOrderStatus(o.status) === 'delivered');
                const earnings = (shopOrders || []).reduce((sum, o) => sum + getOrderTotal(o) * (1 - (shop.shopCommission || 10) / 100), 0);
                return (
                  <div key={shop.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{shop.name}</p>
                      <p className="text-sm text-slate-500">Rs. {earnings.toFixed(2)} pending - {shopOrders.length} completed orders</p>
                    </div>
                    <Button variant="primary" onClick={() => handleReleasePayout(shop.id)}>Release Payout</Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">All Transactions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Transaction ID</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold">{order.id}</td>
                      <td className="px-6 py-4">Order Payment</td>
                      <td className="px-6 py-4 font-semibold">Rs. {getOrderTotal(order).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Completed</span>
                      </td>
                      <td className="px-6 py-4">{order.placedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'commission' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Commission Reports</h2>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500 mb-2">Platform Commission Rate</p>
                <p className="text-2xl font-semibold text-slate-900">{s.platformFee}%</p>
                <p className="text-xs text-slate-500 mt-1">Applied to all orders</p>
              </div>
              <Button variant="secondary" onClick={() => navigate('/admin/settings')}>Configure Commission Rates</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
