import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import useAdminStore from '../../store/adminStore';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import { adminApi, ordersApi, ridersApi, catalogApi } from '../../api/endpoints';

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

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('customers');
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [riders, setRiders] = useState([]);
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { blockUser, approveRider, suspendShop, addLog } = useAdminStore();

  const fetchUsers = async (page = 1, role = 'All') => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (role && role !== 'All') params.role = role;
      
      const response = await adminApi.getUsers(params);
      
      if (response.pagination) {
        setUsers(response.users || []);
        setPagination(response.pagination);
      } else {
        // Fallback for backward compatibility
        setUsers(response || []);
        setPagination(null);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    Promise.all([ridersApi.list(), catalogApi.getShops(), ordersApi.list()])
      .then(([r, s, o]) => {
        setRiders(Array.isArray(r) ? r : (r?.riders || []));
        setShops(Array.isArray(s) ? s : (s?.shops || []));
        setOrders(Array.isArray(o) ? o : (o?.orders || []));
      })
      .catch(() => {});
    
    fetchUsers(currentPage, activeTab);
  }, [currentPage, activeTab]);

  // For backward compatibility, filter users if no pagination
  const customers = useMemo(() => {
    if (pagination) return users; // Already filtered on backend
    return users.filter((u) => u.role === 'Customer');
  }, [users, pagination]);
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleBlockCustomer = (userId) => {
    if (window.confirm('Are you sure you want to block this customer?')) {
      blockUser(userId);
      addLog({ type: 'user_action', action: 'block_customer', userId });
      alert('Customer blocked successfully');
    }
  };

  const handleApproveRider = (riderId) => {
    approveRider(riderId);
    addLog({ type: 'user_action', action: 'approve_rider', riderId });
    alert('Rider approved successfully');
  };

  const handleDeactivateRider = (riderId) => {
    if (window.confirm('Are you sure you want to deactivate this rider?')) {
      addLog({ type: 'user_action', action: 'deactivate_rider', riderId });
      alert('Rider deactivated successfully');
    }
  };

  const handleApproveShop = (shopId) => {
    addLog({ type: 'shop_action', action: 'approve_shop', shopId });
    alert('Shop approved successfully');
  };

  const handleSuspendShop = (shopId) => {
    if (window.confirm('Are you sure you want to suspend this shop?')) {
      suspendShop(shopId);
      alert('Shop suspended successfully');
    }
  };

  const getCustomerOrderHistory = (customerId) =>
    orders.filter((o) => o.userId === customerId || o.customer?.name === customerId);

  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">User Management</h1>
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => handleTabChange('customers')}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'customers' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Customers ({pagination ? pagination.totalItems : customers.length})
            </button>
            <button
              onClick={() => handleTabChange('riders')}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'riders' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Riders ({riders.length})
            </button>
            <button
              onClick={() => handleTabChange('shops')}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'shops' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Shops ({shops.length})
            </button>
          </div>
        </div>

        {activeTab === 'customers' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Customer Management</h2>
              <Button variant="secondary">Export List</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Total Orders</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {customers.map((customer) => {
                    const orderHistory = getCustomerOrderHistory(customer.id);
                    return (
                      <tr key={customer.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-semibold text-slate-900">{customer.name}</td>
                        <td className="px-6 py-4">{customer.email}</td>
                        <td className="px-6 py-4">{orderHistory.length}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => alert(`Order History: ${orderHistory.map((o) => o.id).join(', ') || 'No orders'}`)}>View Orders</Button>
                            <Button variant="ghost" onClick={() => handleBlockCustomer(customer.id)}>Block</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {pagination && (
              <Pagination 
                pagination={pagination} 
                onPageChange={handlePageChange}
                className="mt-6"
              />
            )}
          </div>
        )}

        {activeTab === 'riders' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Rider Management</h2>
              <Button variant="secondary">Export List</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {riders.map((rider) => {
                const riderOrders = orders.filter((o) => o.riderId === rider.id);
                const completedOrders = riderOrders.filter((o) => o.status === 'Delivered');
                return (
                  <div key={rider.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-1">{typeof rider.vehicle === 'object' ? rider.vehicle?.type : rider.vehicle}</p>
                        <h3 className="text-lg font-semibold text-slate-900">{rider.name}</h3>
                        <p className="text-sm text-slate-500">{rider.phone}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rider.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {rider.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                      <div>
                        <p className="text-slate-500">Deliveries</p>
                        <p className="font-semibold text-slate-900">{completedOrders.length}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Rating</p>
                        <p className="font-semibold text-slate-900">4.9</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Status</p>
                        <p className="font-semibold text-slate-900">Verified</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => handleApproveRider(rider.id)} className="flex-1">Approve</Button>
                      <Button variant="ghost" onClick={() => alert('View Documents - Feature coming soon')} className="flex-1">Verify Docs</Button>
                      <Button variant="ghost" onClick={() => handleDeactivateRider(rider.id)} className="flex-1">Deactivate</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'shops' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Shop Management</h2>
              <Button variant="secondary">Invite Shop</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {shops.map((shop) => {
                const shopOrders = orders.filter((o) => o.shopId === shop.id);
                return (
                  <div key={shop.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-1">{shop.category}</p>
                        <h3 className="text-lg font-semibold text-slate-900">{shop.name}</h3>
                        <p className="text-sm text-slate-500">{shop.address}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                      <div>
                        <p className="text-slate-500">Rating</p>
                        <p className="font-semibold text-slate-900">{shop.rating}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Orders</p>
                        <p className="font-semibold text-slate-900">{shopOrders.length}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Verified</p>
                        <p className="font-semibold text-slate-900">Yes</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => handleApproveShop(shop.id)} className="flex-1">Approve</Button>
                      <Button variant="ghost" onClick={() => alert('Verify Ownership - Feature coming soon')} className="flex-1">Verify Owner</Button>
                      <Button variant="ghost" onClick={() => handleSuspendShop(shop.id)} className="flex-1">Suspend</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
