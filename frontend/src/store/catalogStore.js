import { create } from 'zustand';
import { catalogApi } from '../api/endpoints';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const isFresh = (timestamp) =>
    timestamp && Date.now() - timestamp < CACHE_TTL_MS;

const useCatalogStore = create((set, get) => ({
    // ── State ──────────────────────────────────────────────
    shops: [],
    products: [],
    categories: [],
    aiRecommendations: [],

    // Loading: true only on the very first fetch (no cached data yet)
    initialLoading: true,

    // Timestamps for cache validation
    shopsAt: null,
    productsAt: null,
    categoriesAt: null,
    aiRecommendationsAt: null,

    // ── Actions ────────────────────────────────────────────

    /**
     * Fetches all home page data.
     * - First call: shows loader until data arrives.
     * - Subsequent calls: returns cached data instantly (stale-while-revalidate).
     *   Silently re-fetches in the background if cache is stale.
     */
    fetchHomeData: async () => {
        const { shops, products, categories, shopsAt, productsAt, categoriesAt, aiRecommendationsAt } = get();

        const hasCache = shops.length > 0 || products.length > 0 || categories.length > 0;
        const allFresh = isFresh(shopsAt) && isFresh(productsAt) && isFresh(categoriesAt) && isFresh(aiRecommendationsAt);

        // If we have cached data, show it immediately (stop loading spinner)
        if (hasCache) {
            set({ initialLoading: false });

            // Don't re-fetch if the cache is still fresh
            if (allFresh) return;
        }

        // Fetch (either first load or background refresh)
        try {
            const [shopsResult, productsResult, categoriesResult, recommendationsResult] = await Promise.allSettled([
                catalogApi.getShops(),
                catalogApi.getProducts(),
                catalogApi.getCategories(),
                catalogApi.getRecommendations()
            ]);

            const shopsData = shopsResult.status === 'fulfilled' ? shopsResult.value : null;
            const productsData = productsResult.status === 'fulfilled' ? productsResult.value : null;
            const categoriesData = categoriesResult.status === 'fulfilled' ? categoriesResult.value : null;
            const aiRecsData = recommendationsResult.status === 'fulfilled' ? recommendationsResult.value : null;

            const newShops = Array.isArray(shopsData) ? shopsData : (shopsData?.shops || []);
            const newProducts = Array.isArray(productsData) ? productsData : (productsData?.products || []);
            const newCategories = categoriesData || [];
            const newAiRecs = Array.isArray(aiRecsData) ? aiRecsData : [];

            const nextState = {
                shops: newShops,
                products: newProducts,
                categories: newCategories,
                shopsAt: Date.now(),
                productsAt: Date.now(),
                categoriesAt: Date.now(),
                initialLoading: false,
            };

            if (newAiRecs.length > 0) {
                nextState.aiRecommendations = newAiRecs;
                nextState.aiRecommendationsAt = Date.now();
            }

            // Update state immediately with core data so UI can render
            set(nextState);

        } catch (error) {
            console.error('Failed to fetch home data:', error);
            // On error, at least stop showing the loader if we have any cached data
            set((s) => ({ initialLoading: !s.shops.length }));
        }
    },
}));

export default useCatalogStore;
