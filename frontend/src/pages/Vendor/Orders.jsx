import { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { ordersApi, catalogApi } from '../../api/endpoints';

const vendorRoutesBase = [
  { label: 'Dashboard', path: '/vendor/dashboard' },
  { label: 'Products', path: '/vendor/products' },
  { label: 'Orders', path: '/vendor/orders' },
  { label: 'Profile', path: '/vendor/profile' },
];

const VENDOR_NEXT_STATUS = {
  pending: ['confirmed'],
  assigned: ['confirmed'],
  confirmed: ['preparing', 'ready'],
  preparing: ['ready'],
  ready: [],
  out_for_delivery: [],
  delivered: [],
  cancelled: [],
};

const formatStatusLabel = (status) => String(status || 'pending')
  .split('_')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ord, prods] = await Promise.all([ordersApi.list(), catalogApi.getProducts()]);
      setOrders(Array.isArray(ord) ? ord : (ord?.orders || []));
      setProducts(Array.isArray(prods) ? prods : (prods?.products || []));
    } catch {
      setOrders([]);
      setProducts([]);
      setFeedback({ type: 'error', message: 'Failed to load orders. Please refresh.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!newStatus || updatingOrderId) return;

    setUpdatingOrderId(orderId);
    setFeedback(null);
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((order) => (
        order.id === orderId ? { ...order, status: newStatus } : order
      )));
      setFeedback({ type: 'success', message: `Order ${orderId} moved to ${formatStatusLabel(newStatus)}.` });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to update order status. Please try again.'
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const productMap = (products || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
  const vendorRoutes = vendorRoutesBase.map((r) =>
    r.path === '/vendor/orders' ? { ...r, badge: orders.length } : r
  );

  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={vendorRoutes} />
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Incoming orders</h1>
        {feedback && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {feedback.message}
          </div>
        )}
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-primary">{formatStatusLabel(order.status)}</p>
                    {order.isEmergency && (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">Fast Delivery</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{order.id}</h3>
                  <p className="text-sm text-slate-500">
                    {(order.items || order.products || [])
                      .map((entry) => {
                        const product = productMap[entry.productId];
                        return `${entry?.name || product?.name || 'Item'} x${entry.quantity || 1}`;
                      })
                      .join(', ') || 'No item details'}
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  <p>{order.customer?.name}</p>
                  <p>{order.deliveryAddress?.address || '-'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    defaultValue=""
                    disabled={updatingOrderId === order.id || (VENDOR_NEXT_STATUS[String(order.status || '').toLowerCase()] || []).length === 0}
                    onChange={(event) => {
                      const nextStatus = event.target.value;
                      if (!nextStatus) return;
                      handleStatusUpdate(order.id, nextStatus);
                      event.target.value = '';
                    }}
                  >
                    <option value="" disabled>
                      {(VENDOR_NEXT_STATUS[String(order.status || '').toLowerCase()] || []).length > 0
                        ? 'Update status'
                        : 'Waiting for rider/system'}
                    </option>
                    {(VENDOR_NEXT_STATUS[String(order.status || '').toLowerCase()] || []).map((status) => (
                      <option key={status} value={status}>{formatStatusLabel(status)}</option>
                    ))}
                  </select>
                  <Button variant="secondary" onClick={loadData} disabled={updatingOrderId === order.id}>Refresh</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {orders.length === 0 && <p className="text-slate-500">No orders yet.</p>}
      </div>
    </div>
  );
};

export default VendorOrders;
