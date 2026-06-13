import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ridersApi } from '../api/endpoints';
import useAuthStore from './authStore';
import { parseApiError } from '../utils/errorHelpers';
import { calculateRiderAnalytics } from '../utils/orderMetrics';

const getMsg = (err, fallback) => (err.parsedError || parseApiError(err)).message || fallback;

const useRiderStore = create(
  devtools((set, get) => ({
    // Rider availability status
    isOnline: false,
    isLoading: false,
    error: null,

    toggleOnlineStatus: async () => {
      const currentStatus = get().isOnline;
      set({ isLoading: true, error: null });
      try {
        const res = await ridersApi.setOnline(!currentStatus);
        const isSuccessful = typeof res?.success === 'boolean' ? res.success : Boolean(res?.id || res?.userId || res?.status);
        if (isSuccessful) {
          set({ isOnline: !currentStatus });
        }
      } catch (err) {
        set({ error: getMsg(err, 'Failed to update your availability status. Please try again.') });
      } finally {
        set({ isLoading: false });
      }
      return !currentStatus;
    },
    setOnlineStatus: (status) => set({ isOnline: status }),

    // Earnings data
    earnings: {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      perDelivery: 0,
      bonus: 0,
    },

    // Delivery statistics
    stats: {
      completedToday: 0,
      completedTotal: 0,
      ongoing: 0,
      rating: 0,
    },

    updateEarnings: (amount) => {
      const currentEarnings = get().earnings;
      set({
        earnings: {
          ...currentEarnings,
          total: currentEarnings.total + amount,
          today: currentEarnings.today + amount,
        },
      });
    },

    updateStats: (stats) => {
      set((state) => ({
        stats: { ...state.stats, ...stats },
      }));
    },

    // Available orders for rider to accept
    availableOrders: [],
    loadAvailableOrders: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await ridersApi.getAvailableOrders();
        const orders = Array.isArray(res) ? res : (res?.orders || []);
        set({ availableOrders: orders });
      } catch (err) {
        set({ error: getMsg(err, 'Failed to load available orders. Please try again.') });
      } finally {
        set({ isLoading: false });
      }
    },

    // Update rider location
    updateLocation: async (lat, lng) => {
      try {
        await ridersApi.updateLocation(lat, lng);
      } catch (err) {
        console.error('Failed to update location:', err);
      }
    },

    // Withdrawal requests
    withdrawals: [],
    addWithdrawalRequest: (amount) => {
      const request = {
        id: `withdrawal-${Date.now()}`,
        amount,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };
      set((state) => ({
        withdrawals: [...state.withdrawals, request],
        earnings: {
          ...state.earnings,
          total: state.earnings.total - amount,
        },
      }));
      return request;
    },

    // Transactions history
    transactions: [],
    addTransaction: (transaction) => {
      set((state) => ({
        transactions: [transaction, ...state.transactions],
      }));
    },

    // Initialize rider data from current user
    initializeRiderData: ({ rider = null, orders = [] } = {}) => {
      const currentUser = useAuthStore.getState().currentUser;
      if (currentUser && currentUser.role === 'Rider') {
        const analytics = calculateRiderAnalytics({
          orders,
          riderId: rider?.id || currentUser?.id,
          riderRecord: rider,
        });
        set({
          isOnline: analytics.isOnline,
          earnings: analytics.earnings,
          stats: {
            ...analytics.stats,
          },
          transactions: analytics.transactions,
        });
      }
    },
  }))
);

export default useRiderStore;







