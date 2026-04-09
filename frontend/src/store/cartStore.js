import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { cartApi } from '../api/endpoints';
import { parseApiError } from '../utils/errorHelpers';

const getErrMsg = (error, fallback) => {
  const parsed = error.parsedError || parseApiError(error);
  return parsed.message || fallback;
};

const calculateItemTotal = (price, quantity, variants = []) => {
  const safeVariants = variants || [];
  const variantPrice = safeVariants.reduce((sum, v) => sum + (v?.priceAdjustment || 0), 0);
  return ((price || 0) + variantPrice) * (quantity || 0);
};

const useCartStore = create(
  persist(
    devtools((set, get) => ({
      // State
      cartId: null,
      shopId: null,
      shopName: null,
      items: [],
      pricing: {
        subtotal: 0,
        deliveryFee: 0,
        tax: 0,
        discount: 0,
        total: 0
      },
      promoCode: null,
      isLoading: false,
      error: null,
      isSynced: false,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Load cart from server
      loadCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await cartApi.getCart();
          const cart = response.data?.cart;
          
          if (cart && cart.items && cart.items.length > 0) {
            set({
              cartId: cart.id,
              shopId: cart.shopId,
              shopName: cart.shopName,
              items: cart.items,
              pricing: cart.pricing,
              promoCode: cart.promoCode,
              isSynced: true
            });
          } else {
            set({
              cartId: null,
              shopId: null,
              shopName: null,
              items: [],
              pricing: { subtotal: 0, deliveryFee: 0, tax: 0, discount: 0, total: 0 },
              promoCode: null,
              isSynced: true
            });
          }
        } catch (error) {
          set({ error: getErrMsg(error, 'Failed to load your cart. Please refresh the page.'), isSynced: false });
        } finally {
          set({ isLoading: false });
        }
      },

      // Add item to cart
      addItem: async (product, quantity = 1, selectedVariants = []) => {
        set({ isLoading: true, error: null });
        try {
          const response = await cartApi.addItem({
            productId: product.id,
            quantity,
            selectedVariants
          });
          
          const cart = response.data?.cart;
          set({
            cartId: cart.id,
            shopId: cart.shopId,
            shopName: cart.shopName,
            items: cart.items,
            pricing: cart.pricing,
            promoCode: cart.promoCode,
            isSynced: true
          });
          
          return { success: true };
        } catch (error) {
          const msg = getErrMsg(error, 'Failed to add item to cart. Please try again.');
          set({ error: msg, isSynced: false });
          return { success: false, error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // Update item quantity
      updateQuantity: async (productId, quantity, selectedVariants = []) => {
        if (quantity <= 0) {
          return get().removeItem(productId, selectedVariants);
        }
        
        set({ isLoading: true, error: null });
        try {
          const response = await cartApi.updateItem(productId, { quantity, selectedVariants });
          const cart = response.data?.cart;
          
          set({
            items: cart.items,
            pricing: cart.pricing,
            isSynced: true
          });
          
          return { success: true };
        } catch (error) {
          const msg = getErrMsg(error, 'Failed to update cart. Please try again.');
          set({ error: msg, isSynced: false });
          return { success: false, error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // Remove item from cart
      removeItem: async (productId, selectedVariants = []) => {
        set({ isLoading: true, error: null });
        try {
          const response = await cartApi.removeItem(productId, { selectedVariants });
          const cart = response.data?.cart;
          
          set({
            shopId: cart.shopId,
            shopName: cart.shopName,
            items: cart.items,
            pricing: cart.pricing,
            promoCode: cart.promoCode,
            isSynced: true
          });
          
          return { success: true };
        } catch (error) {
          const msg = getErrMsg(error, 'Failed to remove item. Please try again.');
          set({ error: msg, isSynced: false });
          return { success: false, error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // Apply promo code
      applyPromoCode: async (code) => {
        set({ isLoading: true, error: null });
        try {
          const response = await cartApi.applyPromo(code);
          const { promo, cart } = response.data || {};
          
          set({
            promoCode: cart.promoCode,
            pricing: cart.pricing,
            isSynced: true
          });
          
          return { success: true, discount: promo.discount };
        } catch (error) {
          const msg = getErrMsg(error, 'Invalid promo code. Please double-check the code and try again.');
          set({ error: msg, isSynced: false });
          return { success: false, error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // Remove promo code
      removePromoCode: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await cartApi.removePromo();
          const cart = response.data?.cart;
          
          set({
            promoCode: null,
            pricing: cart.pricing,
            isSynced: true
          });
          
          return { success: true };
        } catch (error) {
          const msg = getErrMsg(error, 'Failed to remove promo code. Please try again.');
          set({ error: msg, isSynced: false });
          return { success: false, error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // Clear cart
      clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
          await cartApi.clearCart();
          
          set({
            cartId: null,
            shopId: null,
            shopName: null,
            items: [],
            pricing: { subtotal: 0, deliveryFee: 0, tax: 0, discount: 0, total: 0 },
            promoCode: null,
            isSynced: true
          });
          
          return { success: true };
        } catch (error) {
          set({ error: error.response?.data?.message, isSynced: false });
          return { success: false, error: error.response?.data?.message };
        } finally {
          set({ isLoading: false });
        }
      },

      // Getters
      getItemCount: () => {
        const items = get().items || [];
        return items.reduce((sum, item) => sum + (item?.quantity || 0), 0);
      },

      getItemByProductId: (productId) => {
        return get().items.find(item => item.productId === productId);
      },

      canAddFromShop: (shopId) => {
        const currentShopId = get().shopId;
        return !currentShopId || currentShopId === shopId || get().items.length === 0;
      }
    })),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        cartId: state.cartId,
        shopId: state.shopId,
        shopName: state.shopName,
        items: state.items,
        pricing: state.pricing,
        promoCode: state.promoCode
      })
    }
  )
);

export default useCartStore;

