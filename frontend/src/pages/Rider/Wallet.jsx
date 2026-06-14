import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import useRiderStore from '../../store/riderStore';
import useAuthStore from '../../store/authStore';
import Loader from '../../components/common/Loader';
import { ordersApi, ridersApi } from '../../api/endpoints';

const riderRoutes = [
  { label: 'Dashboard', path: '/rider/dashboard' },
  { label: 'Available Orders', path: '/rider/available-orders' },
  { label: 'My Deliveries', path: '/rider/deliveries' },
  { label: 'Wallet', path: '/rider/wallet' },
  { label: 'Support', path: '/rider/support' },
  { label: 'Profile', path: '/rider/profile' },
];

const Wallet = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const { earnings, withdrawals, transactions, addWithdrawalRequest, initializeRiderData } = useRiderStore();
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ordersApi.list(), ridersApi.list()])
      .then(([ord, ridersResponse]) => {
        const normalizedOrders = Array.isArray(ord) ? ord : (ord?.orders || []);
        const riders = Array.isArray(ridersResponse) ? ridersResponse : (ridersResponse?.riders || []);
        const riderRecord = riders.find((r) => r.userId === currentUser?.id || r.name === currentUser?.name) || riders[0] || null;
        initializeRiderData({ rider: riderRecord, orders: normalizedOrders });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser, initializeRiderData]);

  const allTransactions = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const handleWithdrawal = (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalAmount);

    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > earnings.total) {
      alert('Insufficient balance');
      return;
    }

    if (amount < 10) {
      alert('Minimum withdrawal amount is Rs. 10');
      return;
    }

    addWithdrawalRequest(amount);
    setWithdrawalAmount('');
    setShowWithdrawalForm(false);
    alert(`Withdrawal request of Rs. ${amount.toFixed(2)} submitted successfully!`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    loading ? <Loader label="Loading..." /> : (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={riderRoutes} />
      <div className="space-y-6">
        {/* Earnings Summary */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-6">Wallet & Earnings</h1>

          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Total Earnings</p>
              <p className="text-3xl font-semibold text-slate-900">Rs. {earnings.total.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Today</p>
              <p className="text-3xl font-semibold text-slate-900">Rs. {earnings.today.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">This Week</p>
              <p className="text-3xl font-semibold text-slate-900">Rs. {earnings.thisWeek.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Per Delivery</p>
              <p className="text-3xl font-semibold text-slate-900">Rs. {earnings.perDelivery.toFixed(2)}</p>
            </div>
          </div>

          {/* Withdrawal Section */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Withdraw Earnings</h3>
                <p className="text-sm text-slate-500">Minimum withdrawal: Rs. 10</p>
              </div>
              <Button
                variant={showWithdrawalForm ? 'secondary' : 'primary'}
                onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
              >
                {showWithdrawalForm ? 'Cancel' : 'Request Withdrawal'}
              </Button>
            </div>

            {showWithdrawalForm && (
              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    min="10"
                    max={earnings.total}
                    step="0.01"
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    Submit Request
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setWithdrawalAmount(earnings.total.toString())}
                  >
                    Use Max
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Pending Withdrawals */}
        {withdrawals.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Pending Withdrawals</h2>
            <div className="space-y-3">
              {withdrawals
                .filter((w) => w.status === 'pending')
                .map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          Rs. {withdrawal.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-amber-700">
                          Requested: {formatDate(withdrawal.requestedAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900 uppercase">
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Transaction History</h2>
          <div className="space-y-3">
            {allTransactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No transactions yet</p>
            ) : (
              allTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-full p-3 ${transaction.type === 'delivery'
                          ? 'bg-emerald-100'
                          : transaction.type === 'bonus'
                            ? 'bg-blue-100'
                            : 'bg-amber-100'
                        }`}
                    >
                      {transaction.type === 'delivery' ? '📦' : transaction.type === 'bonus' ? '🎁' : '💰'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${transaction.amount > 0 ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}Rs. {transaction.amount.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs ${transaction.status === 'completed'
                          ? 'text-emerald-600'
                          : transaction.status === 'pending'
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Per-Delivery Earnings Breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Earnings Breakdown</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Base Rate per Delivery</p>
                <p className="text-xs text-slate-500">Standard delivery fee</p>
              </div>
              <p className="text-lg font-semibold text-slate-900">Rs. {earnings.perDelivery.toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Bonus Earnings</p>
                <p className="text-xs text-slate-500">On-time and performance bonuses</p>
              </div>
              <p className="text-lg font-semibold text-slate-900">Rs. {earnings.bonus.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  );
};

export default Wallet;
