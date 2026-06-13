import { useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import useAdminStore from '../../store/adminStore';

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

const SystemSettings = () => {
  const { settings, updateSettings, addLog } = useAdminStore();
  const [formData, setFormData] = useState(settings || {
    deliveryFee: 2.5,
    riderCommission: 15,
    shopCommission: 10,
    platformFee: 5,
    minWithdrawal: 10,
    maxWithdrawal: 1000,
  });
  const [activeTab, setActiveTab] = useState('fees');

  const handleSave = () => {
    updateSettings(formData);
    addLog({
      type: 'settings_action',
      action: 'update_settings',
      changes: formData,
    });
    alert('Settings saved successfully');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">System Settings</h1>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            {['fees', 'commissions', 'withdrawals', 'promos', 'policies'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Fees */}
        {activeTab === 'fees' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Delivery Fee Rules</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Base Delivery Fee (Rs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.deliveryFee}
                  onChange={(e) => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        )}

        {/* Commissions */}
        {activeTab === 'commissions' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Commission Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Platform Fee (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.platformFee}
                  onChange={(e) => setFormData({ ...formData, platformFee: parseFloat(e.target.value) })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Rider Commission (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.riderCommission}
                  onChange={(e) => setFormData({ ...formData, riderCommission: parseFloat(e.target.value) })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Shop Commission (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.shopCommission}
                  onChange={(e) => setFormData({ ...formData, shopCommission: parseFloat(e.target.value) })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        )}

        {/* Withdrawals */}
        {activeTab === 'withdrawals' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Withdrawal Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Minimum Withdrawal (Rs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minWithdrawal}
                  onChange={(e) => setFormData({ ...formData, minWithdrawal: parseFloat(e.target.value) })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Maximum Withdrawal (Rs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxWithdrawal}
                  onChange={(e) => setFormData({ ...formData, maxWithdrawal: parseFloat(e.target.value) })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        )}

        {/* Promo Codes */}
        {activeTab === 'promos' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Promo Codes & Discounts</h2>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500 mb-2">Create New Promo Code</p>
                <Button variant="secondary">Add Promo Code</Button>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">Active Promo Codes</p>
                <p className="text-sm text-slate-500">No active promo codes</p>
              </div>
            </div>
          </div>
        )}

        {/* Policies */}
        {activeTab === 'policies' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Platform Policies</h2>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">Terms & Conditions</p>
                <p className="text-sm text-slate-500 mb-3">Manage platform terms and conditions</p>
                <Button variant="secondary" onClick={() => window.location.href = '/admin/content'}>
                  Edit in Content Management
                </Button>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">Privacy Policy</p>
                <p className="text-sm text-slate-500 mb-3">Manage privacy policy</p>
                <Button variant="secondary" onClick={() => window.location.href = '/admin/content'}>
                  Edit in Content Management
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;
