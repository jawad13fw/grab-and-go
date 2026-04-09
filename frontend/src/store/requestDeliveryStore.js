import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { deliveryRequestsApi } from '../api/endpoints';
import { parseApiError } from '../utils/errorHelpers';

const getMsg = (err, fallback) => (err.parsedError || parseApiError(err)).message || fallback;

const useRequestDeliveryStore = create(
  devtools((set, get) => ({
    requests: [],
    isLoading: false,
    error: null,

    // Load requests from server
    loadRequests: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await deliveryRequestsApi.list();
        if (res.success) {
          set({ requests: res.requests || [] });
        }
      } catch (err) {
        set({ error: getMsg(err, 'Failed to load delivery requests. Please refresh the page.') });
      } finally {
        set({ isLoading: false });
      }
    },

    // Create a new delivery request
    addRequest: async (request) => {
      set({ isLoading: true, error: null });
      try {
        const res = await deliveryRequestsApi.create(request);
        if (res.success && res.request) {
          set((state) => ({
            requests: [res.request, ...state.requests],
          }));
          return { success: true, request: res.request };
        }
        return { success: false, message: res.message };
      } catch (err) {
        const msg = getMsg(err, 'Failed to create delivery request. Please check your details and try again.');
        set({ error: msg });
        return { success: false, message: msg };
      } finally {
        set({ isLoading: false });
      }
    },

    updateRequestStatus: (requestId, status) =>
      set((state) => ({
        requests: state.requests.map((r) =>
          r.id === requestId ? { ...r, status } : r
        ),
      })),
  }))
);

export default useRequestDeliveryStore;
