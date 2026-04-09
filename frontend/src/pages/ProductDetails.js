import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/common/Button';
import RatingStars from '../components/common/RatingStars';
import useCartStore from '../store/cartStore';
import Loader from '../components/common/Loader';
import ErrorToast from '../components/common/ErrorToast';
import ProductCard from '../components/shop/ProductCard';
import SearchBar from '../components/common/SearchBar';
import { catalogApi } from '../api/endpoints';
import { getProductImage, handleImageError, PRODUCT_FALLBACK } from '../utils/imageUtils';

const ProductDetails = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (!productId) return;
    catalogApi.getProduct(productId)
      .then((p) => {
        setProduct(p);
        // Save to recently viewed with timestamp for better user activity tracking
        if (p) {
          const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
          const newViewed = [{
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.images?.[0] || p.image,
            category: p.category,
            viewedAt: Date.now() // Timestamp for recency-based recommendations
          }, ...viewed.filter(v => v.id !== p.id)].slice(0, 12);
          localStorage.setItem('recentlyViewed', JSON.stringify(newViewed));
        }
        if (p?.shopId) return catalogApi.getShop(p.shopId).then((s) => setShop(s || null));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <Loader label="Loading..." />;
  if (!product) return <p className="text-slate-500">Product not found.</p>;

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
          <div className="relative aspect-[4/3] w-full bg-slate-100">
            <img
              src={getProductImage(product)}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={handleImageError(PRODUCT_FALLBACK)}
            />
          </div>
        </div>
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            {product.category && (
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-primary">
                {product.category}
              </p>
            )}
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{product.name}</h1>
            <RatingStars rating={product.rating || 4.5} />
          </div>
          {product.description && (
            <p className="text-sm text-slate-600 md:text-base">{product.description}</p>
          )}
          {Array.isArray(product.variants) && product.variants.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700">Variants</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <span
                    key={variant.label}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 md:text-sm"
                  >
                    {variant.label} 
                    {variant.price != null && ` 
                      
                      Rs. ${variant.price}`}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 text-slate-900">
            <span className="text-2xl font-semibold md:text-3xl">
              Rs. {Number(product.price).toLocaleString()}
            </span>
            {product.stock != null && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 md:text-sm">
                {product.stock} available
              </span>
            )}
          </div>
          {(shop?.name || shop?.address) && (
            <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Sold by</p>
              {shop?.name && <p className="text-lg font-semibold">{shop.name}</p>}
              {shop?.address && <p className="text-sm text-slate-500">{shop.address}</p>}
            </div>
          )}
          <Button
            className="w-full"
            onClick={async () => {
              setIsAdding(true);
              try {
                const result = await addItem({
                  id: product.id,
                  name: product.name,
                  image: product.images?.[0],
                  price: product.price,
                  shopId: product.shopId,
                  shopName: shop?.name
                }, 1);

                if (result.success) {
                  setToastMessage('Added to cart!');
                  setToastType('success');
                } else {
                  setToastMessage(result.error || 'Failed to add to cart');
                  setToastType('error');
                }
              } catch (err) {
                setToastMessage('Failed to add to cart. Please try again.');
                setToastType('error');
              } finally {
                setIsAdding(false);
              }
            }}
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add to cart'}
          </Button>

          <ErrorToast
            message={toastMessage}
            type={toastType}
            onClose={() => setToastMessage('')}
          />
        </div>
      </div>

      {/* Related Products Search */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Related Products</h2>
        <SearchBar
          onSearch={(query) => {
            if (query.trim()) {
              window.location.href = `/search?q=${encodeURIComponent(query.trim())}&category=${encodeURIComponent(product.category)}`;
            }
          }}
          placeholder={`Search more ${product.category} products...`}
          className="max-w-md"
        />
      </div>
    </div>
  );
};

export default ProductDetails;

