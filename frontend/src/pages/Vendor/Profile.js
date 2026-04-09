import { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { catalogApi, ordersApi } from '../../api/endpoints';
import useAuthStore from '../../store/authStore';

const VendorProfile = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shop, setShop] = useState(null);
  const { currentUser } = useAuthStore();

  useEffect(() => {
    Promise.all([catalogApi.getProducts(), ordersApi.list(), catalogApi.getMyShops?.() || Promise.resolve([])])
      .then(([prods, ord, shops]) => {
        setProducts(Array.isArray(prods) ? prods : (prods?.products || []));
        setOrders(Array.isArray(ord) ? ord : (ord?.orders || []));
        setShop(Array.isArray(shops) ? (shops[0] || null) : ((shops?.shops || [])[0] || null));
      })
      .catch(() => {});
  }, []);

  const vendorProducts = products.filter((p) => p.vendorId === currentUser?.id || p.shopId?.startsWith('vehari'));
  const vendorRoutes = [
    { label: 'Dashboard', path: '/vendor/dashboard' },
    { label: 'Products', path: '/vendor/products', badge: vendorProducts.length },
    { label: 'Orders', path: '/vendor/orders', badge: orders.length },
    { label: 'Profile', path: '/vendor/profile' },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={vendorRoutes} />
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Vendor profile</p>
          <h1 className="text-3xl font-semibold text-slate-900">{shop?.name || currentUser?.name || 'My Shop'}</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Store name" defaultValue={shop?.name || ''} />
          <Input label="Support email" defaultValue={currentUser?.email || ''} />
          <Input label="Phone" defaultValue={shop?.phone || ''} />
          <Input label="Address" defaultValue={shop?.address || ''} />
        </div>
        <Input label="Store description" defaultValue={shop?.description || ''} />
        <Button className="w-full md:w-auto">Save changes</Button>
      </div>
    </div>
  );
};

export default VendorProfile;
