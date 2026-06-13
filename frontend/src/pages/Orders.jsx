import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import useAuthStore from '../store/authStore';
import { ordersApi, deliveryRequestsApi, catalogApi } from '../api/endpoints';

const Orders = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [products, setProducts] = useState([]);
  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productMap = useMemo(
    () => ((products || [])).reduce((acc, p) => ({ ...acc, [p.id]: p }), {}),
    [products]
  );

  const fetchOrders = async (page = 1) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const [ordersRes, productsRes, requestsRes] = await Promise.all([
        ordersApi.list({ page, limit: 10 }),
        catalogApi.getProducts(),
        deliveryRequestsApi.list().catch(() => []),
      ]);
      
      if (ordersRes?.pagination) {
        setOrders(ordersRes.orders || []);
        setPagination(ordersRes.pagination);
      } else {
        // Fallback for backward compatibility
        setOrders(Array.isArray(ordersRes) ? ordersRes : []);
        setPagination(null);
      }
      
      setProducts(Array.isArray(productsRes) ? productsRes : []);
      setDeliveryRequests(
        Array.isArray(requestsRes)
          ? requestsRes
          : Array.isArray(requestsRes?.requests)
            ? requestsRes.requests
            : []
      );
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
      setPagination(null);
      setProducts([]);
      setDeliveryRequests([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentUser, currentPage]);
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const firstOrderId = orders[0]?.id;

  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary">History</p>
          <h1 className="text-3xl font-semibold text-slate-900">Orders</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link className="text-sm font-semibold text-primary hover:underline" to="/request-delivery">
            Request delivery
          </Link>
          {firstOrderId && (
            <Link className="text-sm font-semibold text-primary hover:underline" to={`/track-order/${firstOrderId}`}>
              Track latest
            </Link>
          )}
        </div>
      </div>

      {deliveryRequests.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Your delivery requests</h2>
          {deliveryRequests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col gap-4 rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              {(() => {
                const requestDescription = req.whatToOrder || req.packageDetails?.description || 'Delivery request';
                const pickupAddress = req.pickupAddress || req.pickup?.address || '-';
                const dropoffAddress = req.deliveryAddress || req.dropoff?.address || '-';
                const requestFee = Number(req.deliveryFee || 0);
                const requestOrderValue = Number(req.orderValue || 0);
                const requestTotal = Number(req.total ?? (requestOrderValue + requestFee));

                return (
                  <>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary">{req.status}</p>
                <h3 className="text-xl font-semibold text-slate-900">{req.id}</h3>
                <p className="text-sm text-slate-600 mt-1">{requestDescription}</p>
                <p className="text-xs text-slate-500 mt-1">
                  From: {pickupAddress} → To: {dropoffAddress}
                </p>
                {req.natureLabel && (
                  <span className="inline-block mt-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                    {req.natureLabel}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-right">
                <p className="text-lg font-semibold text-slate-900">Rs. {requestTotal.toFixed(2)}</p>
                <p className="text-xs text-slate-500">Order: Rs. {requestOrderValue.toFixed(2)} + delivery: Rs. {requestFee.toFixed(2)}</p>
              </div>
                  </>
                );
              })()}
            </div>
          ))}
        </section>
      )}

      <section className="space-y-4">
        {deliveryRequests.length > 0 && <h2 className="text-lg font-semibold text-slate-900">Shop orders</h2>}
        {orders.map((order) => {
          const orderItems = Array.isArray(order.items) ? order.items : Array.isArray(order.products) ? order.products : [];
          const orderTotal = Number(order.total ?? order.pricing?.total ?? 0);
          return (
            <div
              key={order.id}
              className={`flex flex-col gap-4 rounded-3xl border p-6 shadow-sm md:flex-row md:items-center md:justify-between ${
                order.isEmergency
                  ? 'border-amber-300 bg-amber-50/50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-xs uppercase tracking-[0.3em] ${order.isEmergency ? 'text-amber-700' : 'text-primary'}`}>
                    {order.status}
                  </p>
                  {order.isEmergency && (
                    <span className="rounded-full bg-amber-500 px-2 py-1 text-xs font-semibold text-white">
                      FAST DELIVERY
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{order.id}</h3>
                <p className="text-sm text-slate-500">
                  {(orderItems || [])
                    .map((item) => {
                      const product = productMap[item.productId] || item;
                      return `${product?.name || 'Item'} x${item.quantity || 1}`;
                    })
                    .join(', ')}
                </p>
                {order.isEmergency && (
                  <p className="text-xs text-amber-700 mt-1 font-semibold">
                    Fast Delivery - 15-30 min ETA
                  </p>
                )}
              </div>
              <div className="flex flex-col text-sm text-slate-500">
                <span>{order.customer?.name}</span>
                <span>{order.customer?.address}</span>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-lg font-semibold text-slate-900">Rs. {orderTotal.toLocaleString()}</p>
                <p className="text-xs text-slate-500">
                  {order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Card'}
                </p>
                <Link to={`/track-order/${order.id}`} className="text-sm font-medium text-primary">
                  Track order →
                </Link>
              </div>
            </div>
          );
        })}
        
        {pagination && (
          <Pagination 
            pagination={pagination} 
            onPageChange={handlePageChange}
            className="mt-8"
          />
        )}
      </section>
      {orders.length === 0 && deliveryRequests.length === 0 && (
        <p className="text-slate-500 text-center py-8">No orders yet.</p>
      )}
    </div>
  );
};

export default Orders;
