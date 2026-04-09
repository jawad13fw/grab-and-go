/**
 * imageUtils.js
 * Centralized image fallback helpers for the Grab & Go app.
 */

// ── Fallback URLs ──────────────────────────────────────────────────────────────

/** Fallback for shop banner images (wide / 16:9).
 * These are simple relative paths; actual visuals should primarily come from
 * shop/category data returned by the backend.
 */
export const SHOP_BANNER_FALLBACK = '/shop-banner-fallback.png';

/** Fallback for product images (square). */
export const PRODUCT_FALLBACK = '/product-fallback.png';

/** Fallback for the hero delivery image on the home page. */
export const HERO_DELIVERY_IMAGE = '/hero-delivery.png';

/**
 * Category-specific fallback images.
 * Keys match the category.id values used throughout the app.
 */
export const CATEGORY_IMAGES = {
  grocery: '/category-grocery.png',
  electronics: '/category-electronics.png',
  fashion: '/category-fashion.png',
  pharmacy: '/category-pharmacy.png',
  cosmetics: '/category-cosmetics.png',
  bakery: '/category-bakery.png',
    hardware: '/category-hardware.png',
    computers: '/category-computers.png',
  food: '/category-food.png',
  restaurants: '/category-restaurants.png',
  documents: '/category-documents.png',
  flowers: '/category-flowers.png',
};

/** Returns a category image URL, falling back to SHOP_BANNER_FALLBACK. */
export const getCategoryImage = (categoryId, categoryImageFromDb) => {
    if (CATEGORY_IMAGES[categoryId]) return CATEGORY_IMAGES[categoryId];
    if (categoryImageFromDb) return categoryImageFromDb;
    return SHOP_BANNER_FALLBACK;
};

/**
 * Returns the best available shop banner URL with a fallback.
 * Tries: banner → image → fallback
 */
export const getShopBanner = (shop) =>
    shop?.banner || shop?.image || SHOP_BANNER_FALLBACK;

/**
 * Returns the best available product image URL with a fallback.
 * Tries: image → images[0] → fallback
 */
export const getProductImage = (product) =>
    product?.image || product?.images?.[0] || PRODUCT_FALLBACK;

/**
 * onError handler for <img> elements.
 * Swaps the broken src with the provided fallback.
 */
export const handleImageError = (fallback) => (e) => {
    if (e.target.src !== fallback) {
        e.target.src = fallback;
    }
};
