import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBagIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import ProfileDropdown from '../common/ProfileDropdown';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { ordersApi } from '../../api/endpoints';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const cartCount = (items || []).reduce((sum, item) => sum + (item?.quantity || 0), 0);
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const [latestOrderId, setLatestOrderId] = useState(null);
  
  // Fetch the user's latest order when the component mounts and user is logged in
  useEffect(() => {
    const fetchLatestOrder = async () => {
      if (currentUser && currentUser.role === 'Customer') {
        try {
          const response = await ordersApi.getAll();
          if (response && response.orders && response.orders.length > 0) {
            // Sort orders by date to get the latest one
            const sortedOrders = response.orders.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
            setLatestOrderId(sortedOrders[0].id);
          } else {
            setLatestOrderId(null);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
          setLatestOrderId(null);
        }
      }
    };
    
    fetchLatestOrder();
  }, [currentUser]);

  const profileRouteByRole = {
    Customer: '/profile',
    Vendor: '/vendor/profile',
    Rider: '/rider/profile',
    Admin: '/admin/dashboard',
  };

  const getNavItems = () => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'Rider') {
      return [{ label: 'Dashboard', to: '/rider/dashboard' }];
    }
    
    if (currentUser.role === 'Vendor') {
      return [{ label: 'Dashboard', to: '/vendor/dashboard' }];
    }
    
    if (currentUser.role === 'Admin') {
      return [{ label: 'Admin Dashboard', to: '/admin/dashboard' }];
    }
    
    // For customers, conditionally set the track order link
    const trackOrderLink = latestOrderId 
      ? `/track-order/${latestOrderId}` 
      : '/orders'; // If no orders, direct to orders page
    
    return [
      { label: 'Home', to: '/home' },
      { label: 'Categories', to: '/categories' },
      { label: 'Shops', to: '/shops' },
      { label: 'Request delivery', to: '/request-delivery' },
      { label: 'Orders', to: '/orders' },
      { label: 'Track Order', to: trackOrderLink },
    ];
  };

  const navItems = getNavItems().filter((item, index, self) =>
      index === self.findIndex((i) => i.to === item.to)
    );

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to={currentUser ? '/home' : '/'}
            className="flex-shrink-0 text-xl font-semibold tracking-tight text-slate-900"
          >
            Grab<span className="text-primary"> &amp; Go</span>
          </Link>

          {/* Search Bar - Desktop */}
          {currentUser?.role === 'Customer' && (
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products and shops"
                    className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 pl-10 text-sm text-slate-700 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </form>
            </div>
          )}
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-500">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `border-b-2 border-transparent pb-0.5 transition-colors ${
                    isActive
                      ? 'text-primary border-primary'
                      : 'text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Cart & Fast Delivery - Desktop */}
            {currentUser?.role === 'Customer' && (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/cart"
                  className="relative flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary transition-colors"
                >
                  <ShoppingBagIcon className="h-5 w-5" />
                  <span className="hidden lg:inline">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              </div>
            )}
            
            {!currentUser ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                >
                  Login
                </Link>
                <Link to="/register">
                  <span className="rounded-full border border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                    Register
                  </span>
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center">
                <ProfileDropdown
                  user={currentUser}
                  onLogout={logout}
                  profileRoute={profileRouteByRole[currentUser.role] || '/profile'}
                />
              </div>
            )}

            {/* Mobile Search - Customer only */}
            {currentUser?.role === 'Customer' && (
              <div className="md:hidden flex-1 max-w-xs mx-2">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 pl-8 text-sm text-slate-700 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </form>
              </div>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-4">
            {/* Mobile Navigation Links */}
            <nav className="flex flex-col space-y-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/5 text-primary'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Cart & Fast Delivery */}
            {currentUser?.role === 'Customer' && (
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <Link
                  to="/shops"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center rounded-md border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary transition-colors"
                >
                  Fast Delivery
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-md border border-slate-200 py-2.5 text-sm font-medium text-slate-700"
                >
                  <ShoppingBagIcon className="h-5 w-5" />
                  Cart {cartCount > 0 && `(${cartCount})`}
                </Link>
              </div>
            )}

            {/* Mobile Auth Section */}
            {!currentUser ? (
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-800 text-sm font-medium">
                    {currentUser.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-slate-500">{currentUser.email}</p>
                  </div>
                </div>
                <Link
                  to={profileRouteByRole[currentUser.role] || '/profile'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  My Profile
                </Link>
                {currentUser.role === 'Customer' && (
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    My Orders
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

