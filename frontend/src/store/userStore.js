import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { api } from '../api/client';

// API functions using the shared axios client (sends httpOnly cookie automatically)
const userApi = {
  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put('/api/users/profile', data);
    return response.data;
  },
  getAddresses: async () => {
    const response = await api.get('/api/users/addresses');
    return response.data;
  },
  addAddress: async (data) => {
    const response = await api.post('/api/users/addresses', data);
    return response.data;
  },
  updateAddress: async (id, data) => {
    const response = await api.put(`/api/users/addresses/${id}`, data);
    return response.data;
  },
  deleteAddress: async (id) => {
    const response = await api.delete(`/api/users/addresses/${id}`);
    return response.data;
  },
  getFavorites: async () => {
    const response = await api.get('/api/users/favorites');
    return response.data;
  },
  addFavorite: async (shopId) => {
    const response = await api.post('/api/users/favorites', { shopId });
    return response.data;
  },
  removeFavorite: async (shopId) => {
    const response = await api.delete(`/api/users/favorites/${shopId}`);
    return response.data;
  }
};

const useUserStore = create(
  persist(
    devtools((set, get) => ({
      // Profile State
      profile: null,
      addresses: [],
      favorites: [],
      
      // Loading States
      isLoadingProfile: false,
      isLoadingAddresses: false,
      isLoadingFavorites: false,
      
      // Error States
      profileError: null,
      addressesError: null,
      favoritesError: null,

      // Profile Actions
      loadProfile: async () => {
        set({ isLoadingProfile: true, profileError: null });
        try {
          const response = await userApi.getProfile();
          if (response.success) {
            set({ profile: response.data.user, isLoadingProfile: false });
          } else {
            set({ profileError: response.message, isLoadingProfile: false });
          }
        } catch (error) {
          set({ profileError: error.message, isLoadingProfile: false });
        }
      },

      updateProfile: async (data) => {
        set({ isLoadingProfile: true, profileError: null });
        try {
          const response = await userApi.updateProfile(data);
          if (response.success) {
            set({ profile: response.data.user, isLoadingProfile: false });
            return { success: true };
          } else {
            set({ profileError: response.message, isLoadingProfile: false });
            return { success: false, error: response.message };
          }
        } catch (error) {
          set({ profileError: error.message, isLoadingProfile: false });
          return { success: false, error: error.message };
        }
      },

      // Address Actions
      loadAddresses: async () => {
        set({ isLoadingAddresses: true, addressesError: null });
        try {
          const response = await userApi.getAddresses();
          if (response.success) {
            set({ addresses: response.data.addresses, isLoadingAddresses: false });
          } else {
            set({ addressesError: response.message, isLoadingAddresses: false });
          }
        } catch (error) {
          set({ addressesError: error.message, isLoadingAddresses: false });
        }
      },

      addAddress: async (addressData) => {
        set({ isLoadingAddresses: true, addressesError: null });
        try {
          const newAddress = {
            id: `addr-${nanoid(8)}`,
            ...addressData,
            isDefault: get().addresses.length === 0 ? true : addressData.isDefault
          };

          // If setting as default, unset others
          let updatedAddresses = get().addresses;
          if (newAddress.isDefault) {
            updatedAddresses = updatedAddresses.map(addr => ({
              ...addr,
              isDefault: false
            }));
          }

          const response = await userApi.addAddress(newAddress);
          if (response.success) {
            set({
              addresses: [...updatedAddresses, newAddress],
              isLoadingAddresses: false
            });
            return { success: true, address: newAddress };
          } else {
            set({ addressesError: response.message, isLoadingAddresses: false });
            return { success: false, error: response.message };
          }
        } catch (error) {
          set({ addressesError: error.message, isLoadingAddresses: false });
          return { success: false, error: error.message };
        }
      },

      updateAddress: async (addressId, addressData) => {
        set({ isLoadingAddresses: true, addressesError: null });
        try {
          let updatedAddresses = get().addresses.map(addr => {
            if (addr.id === addressId) {
              return { ...addr, ...addressData };
            }
            // If setting this as default, unset others
            if (addressData.isDefault && addr.id !== addressId) {
              return { ...addr, isDefault: false };
            }
            return addr;
          });

          const response = await userApi.updateAddress(addressId, addressData);
          if (response.success) {
            set({ addresses: updatedAddresses, isLoadingAddresses: false });
            return { success: true };
          } else {
            set({ addressesError: response.message, isLoadingAddresses: false });
            return { success: false, error: response.message };
          }
        } catch (error) {
          set({ addressesError: error.message, isLoadingAddresses: false });
          return { success: false, error: error.message };
        }
      },

      deleteAddress: async (addressId) => {
        set({ isLoadingAddresses: true, addressesError: null });
        try {
          const address = get().addresses.find(a => a.id === addressId);
          const remainingAddresses = get().addresses.filter(a => a.id !== addressId);
          
          // If deleting default, set first remaining as default
          if (address?.isDefault && remainingAddresses.length > 0) {
            remainingAddresses[0].isDefault = true;
          }

          const response = await userApi.deleteAddress(addressId);
          if (response.success) {
            set({ addresses: remainingAddresses, isLoadingAddresses: false });
            return { success: true };
          } else {
            set({ addressesError: response.message, isLoadingAddresses: false });
            return { success: false, error: response.message };
          }
        } catch (error) {
          set({ addressesError: error.message, isLoadingAddresses: false });
          return { success: false, error: error.message };
        }
      },

      setDefaultAddress: async (addressId) => {
        return get().updateAddress(addressId, { isDefault: true });
      },

      getDefaultAddress: () => {
        return get().addresses.find(a => a.isDefault) || get().addresses[0];
      },

      // Favorites Actions
      loadFavorites: async () => {
        set({ isLoadingFavorites: true, favoritesError: null });
        try {
          const response = await userApi.getFavorites();
          if (response.success) {
            set({ favorites: response.data.favorites, isLoadingFavorites: false });
          } else {
            set({ favoritesError: response.message, isLoadingFavorites: false });
          }
        } catch (error) {
          set({ favoritesError: error.message, isLoadingFavorites: false });
        }
      },

      addFavorite: async (shopId) => {
        try {
          const response = await userApi.addFavorite(shopId);
          if (response.success) {
            set({ favorites: [...get().favorites, shopId] });
            return { success: true };
          }
          return { success: false, error: response.message };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      removeFavorite: async (shopId) => {
        try {
          const response = await userApi.removeFavorite(shopId);
          if (response.success) {
            set({ favorites: get().favorites.filter(id => id !== shopId) });
            return { success: true };
          }
          return { success: false, error: response.message };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      isFavorite: (shopId) => {
        return get().favorites.includes(shopId);
      },

      toggleFavorite: async (shopId) => {
        if (get().isFavorite(shopId)) {
          return get().removeFavorite(shopId);
        } else {
          return get().addFavorite(shopId);
        }
      },

      // Clear all user data (on logout)
      clearUserData: () => {
        set({
          profile: null,
          addresses: [],
          favorites: [],
          profileError: null,
          addressesError: null,
          favoritesError: null
        });
      }
    })),
    {
      name: 'user-storage',
      partialize: (state) => ({
        addresses: state.addresses,
        favorites: state.favorites
      })
    }
  )
);

export default useUserStore;

