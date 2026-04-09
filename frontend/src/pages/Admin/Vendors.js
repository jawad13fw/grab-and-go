import { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { catalogApi, adminApi } from '../../api/endpoints';

const adminRoutes = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Vendors', path: '/admin/vendors' },
  { label: 'Orders', path: '/admin/orders' },
];

const AdminVendors = () => {
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([catalogApi.getShops(), adminApi.getUsers()])
      .then(([s, u]) => {
        setShops(Array.isArray(s) ? s : (s?.shops || []));
        setUsers(Array.isArray(u) ? u : (u?.users || []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const vendorRoutes = adminRoutes.map((r) =>
    r.path === '/admin/users' ? { ...r, badge: users.length } :
    r.path === '/admin/vendors' ? { ...r, badge: shops.length } : r
  );

  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={vendorRoutes} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Vendors</h1>
          <Button>Invite vendor</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {shops.map((shop) => (
            <div key={shop.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-primary">{shop.category}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{shop.name}</h3>
                  <p className="text-sm text-slate-500">{shop.address}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                <span>Rating {shop.rating}</span>
                <span>ETA {shop.eta}</span>
              </div>
            </div>
          ))}
        </div>
        {shops.length === 0 && <p className="text-slate-500">No vendors yet.</p>}
      </div>
    </div>
  );
};

export default AdminVendors;
