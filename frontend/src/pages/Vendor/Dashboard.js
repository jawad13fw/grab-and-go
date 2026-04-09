import { useEffect, useState } from 'react';
import { ChartBarIcon, ClipboardDocumentIcon, CurrencyDollarIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import VendorStatCard from '../../components/vendor/VendorStatCard';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { ordersApi, catalogApi } from '../../api/endpoints';
import { calculatePercentChange, getOrderTotal, normalizeOrderStatus } from '../../utils/orderMetrics';

const vendorRoutesBase = [
  { label: 'Dashboard', path: '/vendor/dashboard' },
  { label: 'My Shops', path: '/vendor/shops' },
  { label: 'Products', path: '/vendor/products' },
  { label: 'Orders', path: '/vendor/orders' },
  { label: 'Profile', path: '/vendor/profile' },
];

const VendorDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ordersApi.list(),
      catalogApi.getMyProducts(),
      catalogApi.getMyShops()
    ])
      .then(([ord, prodsData, shopsData]) => {
        setOrders(Array.isArray(ord) ? ord : (ord?.orders || []));
        setProducts(prodsData?.products || []);
        setShops(shopsData?.shops || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const vendorRoutes = vendorRoutesBase.map((r) =>
    r.path === '/vendor/shops' ? { ...r, badge: shops.length } :
    r.path === '/vendor/products' ? { ...r, badge: products.length } :
    r.path === '/vendor/orders' ? { ...r, badge: orders.length } : r
  );

  const currentShopIds = shops.map((shop) => shop.id);
  const vendorOrders = orders.filter((order) => currentShopIds.includes(order.shopId));
  const deliveredOrders = vendorOrders.filter((order) => normalizeOrderStatus(order.status) === 'delivered');
  const completedRate = vendorOrders.length ? Math.round(((deliveredOrders.length / vendorOrders.length) * 100) * 10) / 10 : 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weeklyOrderSeries = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (6 - index));
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    return vendorOrders.filter((order) => {
      const placedAt = new Date(order.placedAt || order.createdAt || order.updatedAt);
      return !Number.isNaN(placedAt.getTime()) && placedAt >= day && placedAt < nextDay;
    });
  }).map((dayOrders) => dayOrders.length);
  const weeklyRevenueSeries = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (6 - index));
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    return vendorOrders.filter((order) => {
      const placedAt = new Date(order.placedAt || order.createdAt || order.updatedAt);
      return !Number.isNaN(placedAt.getTime()) && placedAt >= day && placedAt < nextDay;
    }).reduce((sum, order) => sum + getOrderTotal(order), 0);
  });
  const thisWeekRevenue = weeklyRevenueSeries.reduce((sum, value) => sum + value, 0);
  const previousWeekOrders = vendorOrders.filter((order) => {
    const placedAt = new Date(order.placedAt || order.createdAt || order.updatedAt);
    if (Number.isNaN(placedAt.getTime())) return false;
    const end = new Date(today);
    end.setDate(end.getDate() - 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return placedAt >= start && placedAt < end;
  });
  const previousWeekRevenue = previousWeekOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const revenueTrend = calculatePercentChange(thisWeekRevenue, previousWeekRevenue);
  const orderTrend = calculatePercentChange(vendorOrders.length, previousWeekOrders.length);

  if (loading) return <Loader label="Loading..." />;

  const currentShop = shops[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={vendorRoutes} />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Vendor</p>
            <h1 className="text-3xl font-semibold text-slate-900">
              {currentShop?.name || 'My Business'}
            </h1>
            <p className="text-sm text-slate-500">
              {shops.length} shop{shops.length !== 1 ? 's' : ''} - Manage products and orders
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => window.location.href = '/vendor/shops'}>
              <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
              Manage Shops
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <VendorStatCard label="Revenue (7d)" value={`Rs. ${thisWeekRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} trend={revenueTrend} icon={<CurrencyDollarIcon className="h-6 w-6" />} />
          <VendorStatCard label="Orders" value={String(vendorOrders.length)} trend={orderTrend} icon={<ClipboardDocumentIcon className="h-6 w-6" />} />
          <VendorStatCard label="Conversion" value={`${completedRate.toFixed(1)}%`} trend={calculatePercentChange(deliveredOrders.length, previousWeekOrders.filter((order) => normalizeOrderStatus(order.status) === 'delivered').length)} icon={<ChartBarIcon className="h-6 w-6" />} />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Order flow</h3>
          <div className="mt-6 grid grid-cols-7 gap-2">
            {weeklyOrderSeries.map((value, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="w-full rounded-full bg-slate-100 p-2">
                  <div className="rounded-full bg-primary" style={{ height: `${Math.max(24, value * 8)}px` }} />
                </div>
                <span className="text-xs text-slate-500">Day {index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;

