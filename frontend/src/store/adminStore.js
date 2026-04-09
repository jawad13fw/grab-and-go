import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { adminApi } from '../api/endpoints';
import { parseApiError } from '../utils/errorHelpers';

const getMsg = (err, fallback) => (err.parsedError || parseApiError(err)).message || fallback;

const useAdminStore = create(
  devtools((set, get) => ({
    // System Settings
    settings: {
      deliveryFee: 2.5,
      riderCommission: 15,
      shopCommission: 10,
      platformFee: 5,
      minWithdrawal: 10,
      maxWithdrawal: 1000,
    },
    isLoading: false,
    error: null,

    // Fetch settings from server
    loadSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await adminApi.getSettings();
        if (res.success && res.settings) {
          set({ settings: res.settings });
        }
      } catch (err) {
        set({ error: getMsg(err, 'Failed to load settings. Please refresh the page.') });
      } finally {
        set({ isLoading: false });
      }
    },

    updateSettings: async (newSettings) => {
      set({ isLoading: true, error: null });
      try {
        const res = await adminApi.updateSettings(newSettings);
        if (res.success && res.settings) {
          set({ settings: res.settings });
        }
      } catch (err) {
        set({ error: getMsg(err, 'Failed to save settings. Please check your changes and try again.') });
      } finally {
        set({ isLoading: false });
      }
    },

    // Analytics
    analytics: null,
    loadAnalytics: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await adminApi.getAnalytics();
        if (res.success) {
          set({ analytics: res.analytics || res });
        }
      } catch (err) {
        set({ error: getMsg(err, 'Failed to load analytics data. Please try again.') });
      } finally {
        set({ isLoading: false });
      }
    },

    // Users
    users: [],
    loadUsers: async (params) => {
      set({ isLoading: true, error: null });
      try {
        const res = await adminApi.getUsers(params);
        if (res.success) {
          set({ users: res.users || [] });
        }
      } catch (err) {
        set({ error: getMsg(err, 'Failed to load users. Please try again.') });
      } finally {
        set({ isLoading: false });
      }
    },

    // Tickets
    tickets: [],
    loadTickets: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await adminApi.getTickets();
        if (res.success) {
          set({ tickets: res.tickets || [] });
        }
      } catch (err) {
        set({ error: getMsg(err, 'Failed to load tickets. Please try again.') });
      } finally {
        set({ isLoading: false });
      }
    },

    // Content Management
    content: { faqs: [], terms: '', privacy: '', helpCenter: '' },
    loadContent: async () => {
      try {
        const res = await adminApi.getContent();
        if (res.success && res.content) {
          set({ content: res.content });
        }
      } catch (err) {
        console.error('Failed to load content:', err);
      }
    },

    updateContent: async (type, contentValue) => {
      set({ isLoading: true, error: null });
      try {
        const res = await adminApi.updateContent({ type, content: contentValue });
        if (res.success && res.content) {
          set({ content: res.content });
          return { success: true, content: res.content };
        }
        return { success: false, message: 'Content update failed.' };
      } catch (err) {
        const message = getMsg(err, 'Failed to update content. Please try again.');
        set({ error: message });
        return { success: false, message };
      } finally {
        set({ isLoading: false });
      }
    },

    // Audit Logs
    logs: [],
    loadLogs: async () => {
      try {
        const res = await adminApi.getLogs();
        if (res.success) {
          set({ logs: res.logs || [] });
        }
      } catch (err) {
        console.error('Failed to load logs:', err);
      }
    },

    addLog: async (log) => {
      try {
        await adminApi.addLog(log);
      } catch (err) {
        console.error('Failed to create log:', err);
      }
    },
  }))
);

export default useAdminStore;
