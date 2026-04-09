import { useEffect, useState, Suspense, lazy, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import useAuthStore from '../store/authStore';
import useCatalogStore from '../store/catalogStore';
import { HERO_DELIVERY_IMAGE, getCategoryImage, handleImageError, PRODUCT_FALLBACK } from '../utils/imageUtils';

// Lazy load components for better performance
const ShopCard = lazy(() => import('../components/shop/ShopCard'));
const ProductCard = lazy(() => import('../components/shop/ProductCard'));


// Animation variants for better performance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Home = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);

  // Catalog data from persistent store (survives navigation)
  const shops = useCatalogStore((s) => s.shops);
  const products = useCatalogStore((s) => s.products);
  const categories = useCatalogStore((s) => s.categories);
  const aiRecommendations = useCatalogStore((s) => s.aiRecommendations);
  const initialLoading = useCatalogStore((s) => s.initialLoading);
  const fetchHomeData = useCatalogStore((s) => s.fetchHomeData);

  // Recently viewed (localStorage, synchronous)
  const [recentlyViewed, setRecentlyViewed] = useState(() =>
    JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
  );

  useEffect(() => {
    fetchHomeData(); // instant if cached, background refresh if stale
  }, [fetchHomeData]);

  const featuredShops = Array.isArray(shops) ? shops.slice(0, 4) : [];

  // Personalized Recommendations Logic with Recency Weighting
  const recommendations = useMemo(() => {
    // 1. Try AI Recommendations from Backend first (if available)
    if (aiRecommendations && aiRecommendations.length > 0) {
      return { items: aiRecommendations, isAI: true };
    }

    // 2. If products aren't loaded yet, return empty (will re-calculate when they load)
    if (!products || products.length === 0) {
      return { items: [], isAI: false };
    }

    // 3. Fallback to client-side logic based on user activity
    let recommended = [];

    // Based on recently viewed products (prioritize recent activity)
    if (recentlyViewed && recentlyViewed.length > 0) {
      // Get categories user showed interest in
      const viewedCategories = [...new Set(recentlyViewed.map(v => v.category))];
      
      // Find products in those categories (excluding already viewed)
      const similarProducts = products.filter(p =>
        viewedCategories.includes(p.category) &&
        !recentlyViewed.some(v => v.id === p.id)
      );
      
      // Take most relevant ones from viewed categories
      recommended = [...recommended, ...similarProducts.slice(0, 6)];
    }

    // Popular/Highest rated products (fill remaining slots)
    const popularProducts = [...products]
      .sort((a, b) => {
        // Sort by rating first, then by reviews count
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (b.reviews || 0) - (a.reviews || 0);
      })
      .filter(p => !recommended.some(r => r.id === p.id))
      .slice(0, Math.max(0, 8 - recommended.length));
    
    recommended = [...recommended, ...popularProducts];

    // Remove duplicates and limit to 8 products
    const unique = recommended.filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    );

    return { items: unique.slice(0, 8), isAI: false };
  }, [products, recentlyViewed, aiRecommendations]);

  // Get category-based recommendations
  const categoryRecommendations = useMemo(() => {
    if (!categories.length || !shops.length) return [];

    return categories
      .filter(cat => ['grocery', 'electronics', 'fashion', 'cosmetics', 'pharmacy'].includes(cat.id))
      .map(cat => ({
        ...cat,
        shopCount: shops.filter(s => s.category === cat.id).length,
        topProduct: products.find(p => p.category === cat.id)
      }))
      .filter(cat => cat.shopCount > 0);
  }, [categories, shops, products]);

  // Quick reorder suggestions (if user has order history)
  const quickReorderItems = useMemo(() => {
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    if (!orderHistory.length || !products.length) return [];

    // Get frequently ordered products
    const productCounts = {};
    orderHistory.forEach(order => {
      order.items?.forEach(item => {
        productCounts[item.productId] = (productCounts[item.productId] || 0) + 1;
      });
    });

    const frequentIds = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id]) => id);

    return products.filter(p => frequentIds.includes(p.id));
  }, [products]);



  if (initialLoading) return <Loader label="Loading..." />;

  return (
    <div className="space-y-8 sm:space-y-12 lg:space-y-16">
      {/* Hero section - Fully responsive */}
      <section className="grid gap-6 lg:gap-10 rounded-2xl lg:rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-emerald-500 lg:grid-cols-[1fr,1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-center p-6 sm:p-8 lg:p-12 text-white order-2 lg:order-1"
        >
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-white/70">Multi-vendor marketplace</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mt-3">
            Grab and Go delivers every shop in your city to your door.
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/80 mt-4">
            Order from grocery stores, pharmacies, bakeries, electronics and more - one cart, unified checkout,
            instant tracking.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-5 sm:mt-6">
            <Button
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20 text-sm sm:text-base px-4 sm:px-6"
              onClick={() => navigate('/shops')}
            >
              Explore Shops
            </Button>
            <Button
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20 text-sm sm:text-base px-4 sm:px-6"
              onClick={() => navigate('/request-delivery')}
            >
              Request Delivery
            </Button>
          </div>
          <div className="rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm p-3 sm:p-4 text-xs sm:text-sm text-white/90 mt-4 sm:mt-6">
            <p className="font-semibold mb-1">Need something urgently?</p>
            <p>Use Fast Delivery for 15-30 minute priority service. Available 24/7.</p>
          </div>
        </motion.div>

        {/* Right side: delivery image */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col order-1 lg:order-2"
        >
          <div className="relative h-48 sm:h-56 lg:h-full xl:h-full min-h-[300px]">
            <img
              src={HERO_DELIVERY_IMAGE}
              alt="Fast delivery service"
              className="absolute inset-0 w-full h-full object-cover rounded-2xl lg:rounded-3xl"
              loading="eager"
              decoding="async"
            />
          </div>
        </motion.div>
      </section>

      {/* Personalized Recommendations Section */}
      {(recommendations.items.length > 0 || (!initialLoading && products.length > 0)) && (
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
                {currentUser ? `Recommended for you, ${currentUser.name?.split(' ')[0] || 'Guest'}` : 'Recommended for you'}
              </h2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/shops')} className="self-start sm:self-auto text-sm">
              View all products
            </Button>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          >
            <Suspense fallback={<div className="h-48 bg-slate-100 rounded-xl animate-pulse" />}>
              {recommendations.items.length > 0 ? (
                recommendations.items.map((product) => (
                  <motion.div key={product.id} variants={itemVariants}>
                    <ProductCard product={product} />
                  </motion.div>
                ))
              ) : (
                // Show placeholder when no recommendations but products exist
                Array(8).fill(null).map((_, idx) => (
                  <motion.div key={idx} variants={itemVariants}>
                    <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                  </motion.div>
                ))
              )}
            </Suspense>
          </motion.div>
        </section>
      )}

      {/* Quick Reorder Section */}
      {quickReorderItems.length > 0 && (
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Quick Reorder</h2>
              <p className="text-sm text-slate-500 mt-1">Items you order frequently</p>
            </div>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-4"
          >
            <Suspense fallback={<div className="h-48 bg-slate-100 rounded-xl animate-pulse" />}>
              {quickReorderItems.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </Suspense>
          </motion.div>
        </section>
      )}

      {/* Shop by Category Section */}
      {categoryRecommendations.length > 0 && (
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Shop by Category</h2>
            <Button variant="ghost" onClick={() => navigate('/categories')} className="self-start sm:self-auto text-sm">
              View all categories
            </Button>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          >
            {categoryRecommendations.map((category) => (
              <motion.div key={category.id} variants={itemVariants}>
                <Link
                  to={`/shops?category=${category.id}`}
                  className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-md"
                >
                  <div
                    className="h-32 bg-cover bg-center transition-transform group-hover:scale-105"
                    style={{ backgroundImage: `url(${getCategoryImage(category.id, category.image)})` }}
                  />
                  <div className="p-4">
                    <h4 className="font-semibold text-slate-900">{category.name}</h4>
                    <p className="text-sm text-slate-500">{category.shopCount} shops</p>
                    {category.topProduct && (
                      <p className="text-xs text-primary mt-2">From Rs. {category.topProduct.price}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Featured Shops Section */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Featured shops</h2>
          <Button variant="ghost" onClick={() => navigate('/shops')} className="self-start sm:self-auto text-sm">
            View all shops
          </Button>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2"
        >
          <Suspense fallback={<div className="h-40 bg-slate-100 rounded-xl animate-pulse" />}>
            {featuredShops.map((shop) => (
              <motion.div key={shop.id} variants={itemVariants}>
                <ShopCard shop={shop} />
              </motion.div>
            ))}
          </Suspense>
        </motion.div>
      </section>

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Recently Viewed</h2>
            <Button
              variant="ghost"
              onClick={() => { localStorage.removeItem('recentlyViewed'); setRecentlyViewed([]); }}
              className="self-start sm:self-auto text-sm"
            >
              Clear history
            </Button>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6"
          >
            {recentlyViewed.slice(0, 6).map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <Link to={`/product/${product.id}`} className="group block">
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={product.image || PRODUCT_FALLBACK}
                      alt={product.name}
                      className="w-full h-full object-cover transition group-hover:scale-105"
                      onError={handleImageError(PRODUCT_FALLBACK)}
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900 truncate">{product.name}</p>
                  <p className="text-sm text-primary">Rs. {product.price}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}
    </div>
  );
};

export default Home;

