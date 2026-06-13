import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { catalogApi } from '../api/endpoints';
import { HERO_IMAGE_URL, HERO_IMAGE_ALT } from '../config/heroImage';
import CategoryCard from '../components/shop/CategoryCard';
import ShopCard from '../components/shop/ShopCard';
import RatingStars from '../components/common/RatingStars';

const Landing = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleBrowseShopsClick = () => {
    // Navigate to login first, then redirect to shops after authentication
    navigate('/login');
  };

  const handleRequestDeliveryClick = () => {
    navigate('/login');
  };

  const handleQuickOrderClick = () => {
    navigate('/register');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [categoriesData, shopsData] = await Promise.all([
          catalogApi.getCategories(),
          catalogApi.getShops()
        ]);
        setCategories(categoriesData || []);
        setShops(Array.isArray(shopsData) ? shopsData : (shopsData?.shops || []));
      } catch (err) {
        console.error('Failed to fetch landing page data:', err);
        setError('Unable to load marketplace data. Please refresh the page.');
        setCategories([]);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const topCategories = categories.slice(0, 4);
  const extraCategories = [
    categories.find((c) => c.id === 'documents'),
    categories.find((c) => c.id === 'flowers'),
  ].filter(Boolean);
  const featuredShops = Array.isArray(shops) ? shops.slice(0, 3) : [];

  if (loading) return <Loader label="Loading marketplace..." />;
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-cyan-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Modern Hero Section */}
      <section className="grid gap-6 lg:gap-10 rounded-2xl lg:rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-emerald-500 lg:grid-cols-[1fr,1fr]">
        {/* Text Content - Left Side */}
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-12 text-white order-2 lg:order-1">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-white/70">Multi-vendor marketplace</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mt-3">
            Your City's Complete Delivery Platform
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/80 mt-4">
            Shop from local stores, request custom deliveries, and track everything in real-time. 
            One platform for shoppers, vendors, and delivery riders.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-5 sm:mt-6">
            <Button
              variant="secondary"
              onClick={handleBrowseShopsClick}
              className="bg-white/10 text-white hover:bg-white/20 text-sm sm:text-base px-4 sm:px-6 cursor-pointer"
            >
              Browse Shops
            </Button>
            <Button
              variant="secondary"
              onClick={handleRequestDeliveryClick}
              className="bg-white/10 text-white hover:bg-white/20 text-sm sm:text-base px-4 sm:px-6 cursor-pointer"
            >
              Request Delivery
            </Button>
            <Button
              onClick={handleQuickOrderClick}
              className="bg-amber-500 text-white hover:bg-amber-600 border-amber-400 text-sm sm:text-base px-4 sm:px-6 cursor-pointer"
            >
              <span className="mr-1">⚡</span> Quick Order
            </Button>
          </div>
          <div className="rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm p-3 sm:p-4 text-xs sm:text-sm text-white/90 mt-4 sm:mt-6">
            <p className="font-semibold mb-1">🚀 Fast & Reliable Service</p>
            <p>Get deliveries in 30-45 minutes. Available 24/7 for all your needs.</p>
          </div>
        </div>

        {/* Hero Image - Right Side */}
        <div className="relative flex flex-col order-1 lg:order-2">
          <div className="relative h-48 sm:h-56 lg:h-full xl:h-full min-h-[300px]">
            <img
              src="/hero-delivery.png"
              alt="Fast delivery service"
              className="absolute inset-0 w-full h-full object-cover rounded-2xl lg:rounded-3xl"
              loading="eager"
              decoding="async"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1556742393-d75f462bfdd2?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">Browse by category</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">Top categories</h2>
          </div>
          <Link to="/categories" className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline flex items-center gap-1">
            View all categories <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {topCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
        {extraCategories.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {extraCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      {/* Feature Cards - Three User Types */}
      <section className="py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'For Shoppers',
              description: 'Browse local shops, add to cart, and get fast doorstep delivery. Track orders in real-time.',
              icon: (
                <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-4 rounded-2xl mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A2 2 0 007.48 19h8.04a2 2 0 001.83-1.3L17 13M7 13V6h13" /></svg>
                </div>
              ),
            },
            {
              title: 'For Vendors',
              description: 'List your shop, manage products, process orders, and grow your local business with ease.',
              icon: (
                <div className="bg-gradient-to-tr from-teal-500 to-cyan-400 p-4 rounded-2xl mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 6 9-6" /></svg>
                </div>
              ),
            },
            {
              title: 'For Riders',
              description: 'Accept delivery requests, earn per delivery, and track your earnings. Work on your schedule.',
              icon: (
                <div className="bg-gradient-to-tr from-amber-500 to-orange-400 p-4 rounded-2xl mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              ),
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl bg-white p-8 shadow-xl flex flex-col items-center text-center border-0 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              {item.icon}
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-500 text-base">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section - Platform Focus */}
      <section className="py-12 bg-gradient-to-b from-white to-emerald-50/30">
        <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-4">How It Works</h2>
        <p className="text-center text-slate-500 mb-10 max-w-2xl mx-auto">Everything you need to know about using our platform</p>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              q: 'How do I place an order?',
              a: 'Browse shops or products, add items to your cart, and checkout with secure payment. Track your order in real-time.',
              icon: (
                <svg className="w-8 h-8 text-emerald-500 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A2 2 0 007.48 19h8.04a2 2 0 001.83-1.3L17 13M7 13V6h13" /></svg>
              ),
            },
            {
              q: 'Can I request delivery from any store?',
              a: 'Yes! Use our Request Delivery feature to order from any store in your city, even if they are not on the platform.',
              icon: (
                <svg className="w-8 h-8 text-cyan-500 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              ),
            },
            {
              q: 'How fast is delivery?',
              a: 'Most orders are delivered within 30-45 minutes. Fast Delivery orders can be completed in 15-30 minutes.',
              icon: (
                <svg className="w-8 h-8 text-amber-500 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ),
            },
          ].map((faq, idx) => (
            <div key={faq.q} className="rounded-3xl bg-white p-8 shadow-xl flex flex-col items-center text-center border-0 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              {faq.icon}
              <h4 className="font-bold text-lg text-slate-900 mb-2">{faq.q}</h4>
              <p className="text-slate-500 text-base">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Shops Section */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-emerald-50/30 p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">Live marketplace</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">Featured vendors</h2>
          </div>
          <Link to="/shops" className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline flex items-center gap-1">
            View all shops <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-slate-500 text-sm border-t border-slate-200">
        <p>&copy; {new Date().getFullYear()} Grab & Go. All rights reserved.</p>
        <p className="mt-2">Engineered for reliable city-wide commerce and delivery operations.</p>
      </footer>
    </div>
  );
};

export default Landing;
