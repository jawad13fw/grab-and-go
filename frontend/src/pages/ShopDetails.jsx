import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductCard from '../components/shop/ProductCard';
import Button from '../components/common/Button';
import RatingStars from '../components/common/RatingStars';
import Loader from '../components/common/Loader';
import Input from '../components/common/Input';
import useAuthStore from '../store/authStore';
import { catalogApi } from '../api/endpoints';
import { getShopBanner, handleImageError, SHOP_BANNER_FALLBACK } from '../utils/imageUtils';
import AuthPromptModal from '../components/common/AuthPromptModal';

const ShopDetails = () => {
  const { shopId } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'vendor', text: 'Hello! How can I help you today?' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    if (!shopId) return;
    Promise.all([catalogApi.getShop(shopId), catalogApi.getProducts({ shopId, limit: 100 })])
      .then(([s, prods]) => {
        setShop(s || null);
        setProducts(Array.isArray(prods) ? prods : (prods?.products || []));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [shopId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setChatMessages([...chatMessages, { sender: 'customer', text: newMessage }]);
    setNewMessage('');

    // Simulate vendor response
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: 'vendor',
        text: 'Thanks for your message! Our team will assist you shortly.'
      }]);
    }, 1000);
  };

  if (loading) return <Loader label="Loading..." />;
  if (!shop) return <p className="text-slate-500">Shop not found.</p>;

  return (
    <div className="space-y-8">
      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chat with {shop.name}</h3>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-slate-600">
                x
              </button>
            </div>
            <div className="h-64 overflow-y-auto space-y-3 mb-4 p-3 bg-slate-50 rounded-2xl">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.sender === 'customer'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white border border-slate-200 rounded-bl-none'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-56 overflow-hidden md:h-64">
          <img
            src={getShopBanner(shop)}
            alt={shop.name}
            className="h-full w-full object-cover transition duration-500 ease-out md:group-hover:scale-105"
            onError={handleImageError(SHOP_BANNER_FALLBACK)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-6 bottom-6 flex flex-col gap-3 text-white md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-white/70">
                {shop.category}
              </p>
              <h1 className="text-2xl font-semibold leading-tight drop-shadow-sm md:text-3xl">
                {shop.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                <RatingStars rating={shop.rating} />
                {shop.eta && <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium backdrop-blur">ETA {shop.eta}</span>}
                {shop.address && (
                  <span className="hidden rounded-full bg-black/30 px-3 py-1 text-xs font-medium backdrop-blur-sm md:inline-flex">
                    {shop.address}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Button variant="secondary" onClick={() => setShowChat(true)}>
                Chat vendor
              </Button>
              {currentUser ? (
                <Link to="/cart">
                  <Button>View Cart</Button>
                </Link>
              ) : (
                <Button onClick={() => setAuthPromptOpen(true)}>View Cart</Button>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4 p-6">
          {shop.description && (
            <p className="text-sm text-slate-600 md:text-base">{shop.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
            {shop.eta && <span className="rounded-full bg-slate-100 px-3 py-1">ETA: {shop.eta}</span>}
            {shop.address && <span className="rounded-full bg-slate-100 px-3 py-1">Address: {shop.address}</span>}
          </div>
          {shop.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {shop.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Products</h2>
            {products.length > 0 && (
              <p className="text-xs font-medium text-slate-500">
                Showing {products.length} item{products.length !== 1 ? 's' : ''} from this shop
              </p>
            )}
          </div>
          <Link to="/cart" className="text-sm font-medium text-primary hover:underline">
            Go to cart
          </Link>
        </div>
        {products.length > 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
            <p className="mb-1 text-lg font-semibold text-slate-900">No products available yet</p>
            <p className="text-sm text-slate-500">
              This shop hasn&apos;t added any products. Please check back soon.
            </p>
          </div>
        )}
      </section>

      <AuthPromptModal
        open={authPromptOpen}
        title="Log in to order"
        message="You can browse the shop and its products without an account. To open your cart and place an order, please log in or register first."
        onClose={() => setAuthPromptOpen(false)}
      />
    </div>
  );
};

export default ShopDetails;
