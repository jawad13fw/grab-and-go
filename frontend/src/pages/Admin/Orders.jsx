import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import useAdminStore from '../../store/adminStore';
import Loader from '../../components/common/Loader';
import { ordersApi, adminApi, ridersApi, catalogApi } from '../../api/endpoints';

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

const ORDER_STATUSES = ['All', 'Pending', 'Preparing', 'Assigned', 'Arrived at Pickup', 'Picked Order', 'Out for delivery', 'On the way', 'Delivered', 'Cancelled'];

const AdminOrders = () => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addLog } = useAdminStore();

  useEffect(() => {
    Promise.all([ordersApi.list(), catalogApi.getShops(), ridersApi.list()])
      .then(([ord, s, r]) => {
        setOrders(Array.isArray(ord) ? ord : (ord?.orders || []));
        setShops(Array.isArray(s) ? s : (s?.shops || []));
        setRiders(Array.isArray(r) ? r : (r?.riders || []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = statusFilter === 'All' ? (orders || []) : (orders || []).filter((o) => o.status === statusFilter);
  const shopMap = (shops || []).reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
  const riderMap = (riders || []).reduce((acc, r) => ({ ...acc, [r.id]: r }), {});

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Update order ${orderId} status to "${newStatus}"?`)) return;
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      addLog({ type: 'order_action', action: 'update_status', orderId, newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      setSelectedOrder(null);
      alert('Order status updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleResolveDispute = (orderId) => {
    const resolution = window.prompt('Enter dispute resolution notes:');
    if (resolution) {
      addLog({ type: 'order_action', action: 'resolve_dispute', orderId, resolution });
      alert('Dispute resolved and logged');
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Order ID', 'Customer', 'Shop', 'Rider', 'Total', 'Status', 'Placed At'].join(','),
      ...filteredOrders.map((order) => [
        order.id,
        order.customer?.name || '',
        shopMap[order.shopId]?.name || 'N/A',
        riderMap[order.riderId]?.name || 'Unassigned',
        order.total,
        order.status,
        order.placedAt,
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">All Orders Management</h1>
            <p className="text-sm text-slate-500 mt-1">{filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExportCSV}>Export CSV</Button>
            <Button variant="secondary" onClick={() => alert('Export PDF - Feature coming soon')}>Export PDF</Button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${statusFilter === status ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Shop</th>
                <th className="px-6 py-3">Rider</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Placed At</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredOrders.map((order) => {
                const shop = shopMap[order.shopId];
                const rider = riderMap[order.riderId];
                return (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        {order.id}
                        {order.isEmergency && (
                          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">FAST DELIVERY</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{order.customer?.name}</td>
                    <td className="px-6 py-4">{shop?.name || 'N/A'}</td>
                    <td className="px-6 py-4">{rider?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 font-semibold">
                      Rs. {order.total}
                      {order.isEmergency && <span className="ml-2 text-xs text-amber-600">+ Fast Delivery Fee</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                          order.status?.includes('delivery') || order.status?.includes('way') ? 'bg-blue-100 text-blue-700' :
                          order.isEmergency ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{order.placedAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setSelectedOrder(order)}>View</Button>
                        <Button variant="ghost" onClick={() => handleResolveDispute(order.id)}>Resolve</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-500 hover:text-slate-900 text-2xl leading-none">&times;</button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Order ID</p>
                  <p className="font-semibold text-slate-900">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Customer</p>
                  <p className="font-semibold text-slate-900">{selectedOrder.customer?.name}</p>
                  <p className="text-sm text-slate-500">{selectedOrder.customer?.address}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Current Status</p>
                  <p className="font-semibold text-slate-900">{selectedOrder.status}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {ORDER_STATUSES.filter((s) => s !== 'All').map((status) => (
                      <Button key={status} variant="ghost" onClick={() => handleUpdateStatus(selectedOrder.id, status)} className="text-xs">
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
