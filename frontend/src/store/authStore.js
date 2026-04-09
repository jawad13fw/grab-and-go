import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { authApi } from '../api/endpoints';
import { normalizeRole } from '../utils/roles';

const getStored = () => {
  try {
    const u = localStorage.getItem('user');
    if (!u) return null;

    const parsed = JSON.parse(u);
    const normalizedRole = normalizeRole(parsed?.role);
    return normalizedRole ? { ...parsed, role: normalizedRole } : null;
  } catch {
    return null;
  }
};

const buildSafeUser = (user) => {
  const normalizedRole = normalizeRole(user?.role);
  if (!normalizedRole) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizedRole,
    orders: user.orders ?? 0,
    deliveries: user.deliveries
  };
};

const useAuthStore = create(
  devtools((set, get) => ({
    currentUser: getStored(),

    login: async ({ email, password }) => {
      try {
        const { success, user, message } = await authApi.login({ email, password });
        if (!success) return { success: false, message: message || 'Login failed' };
        const safeUser = buildSafeUser(user);
        if (!safeUser) return { success: false, message: 'Unsupported account role. Please contact support.' };
        localStorage.setItem('user', JSON.stringify(safeUser));
        set({ currentUser: safeUser });
        return { success: true, user: safeUser };
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Login failed';
        return { success: false, message: msg };
      }
    },

    logout: async () => {
      try { await authApi.logout(); } catch { /* ignore */ }
      localStorage.removeItem('user');
      set({ currentUser: null });
    },

    register: async ({ name, email, password, role }) => {
      try {
        const { success, user, message } = await authApi.register({ name, email, password, role });
        if (!success) return { success: false, message: message || 'Registration failed' };
        const safeUser = buildSafeUser(user);
        if (!safeUser) return { success: false, message: 'Unsupported account role. Please contact support.' };
        localStorage.setItem('user', JSON.stringify(safeUser));
        set({ currentUser: safeUser });
        return { success: true, user: safeUser, message: message || 'Registration successful!' };
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Registration failed';
        return { success: false, message: msg };
      }
    },

    // Check session on app start — cookie is sent automatically
    hydrate: async () => {
      try {
        const { success, user } = await authApi.me();
        if (success && user) {
          const safeUser = buildSafeUser(user);
          if (!safeUser) {
            localStorage.removeItem('user');
            set({ currentUser: null });
            return;
          }
          localStorage.setItem('user', JSON.stringify(safeUser));
          set({ currentUser: safeUser });
        } else {
          localStorage.removeItem('user');
          set({ currentUser: null });
        }
      } catch {
        // Cookie expired or invalid — clear local state
        localStorage.removeItem('user');
        set({ currentUser: null });
      }
    },
  }))
);

export default useAuthStore;
