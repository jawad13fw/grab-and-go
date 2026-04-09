import Button from '../common/Button';
import RatingStars from '../common/RatingStars';
import useCartStore from '../../store/cartStore';
import ErrorToast from '../common/ErrorToast';
import { useState } from 'react';
import { getProductImage, handleImageError, PRODUCT_FALLBACK } from '../../utils/imageUtils';

const ProductCard = ({ product }) => {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const result = await addItem({
        id: product.id,
        name: product.name,
        image: product.image || product.images?.[0],
        price: product.price,
        shopId: product.shopId,
        shopName: product.shopName
      }, 1);

      if (!result.success) {
        setToastMessage(result.error || 'Failed to add to cart');
        setToastType('error');
      } else {
        setToastMessage('Added to cart!');
        setToastType('success');
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setToastMessage('Failed to add to cart. Please try again.');
      setToastType('error');
    } finally {
      setIsAdding(false);
    }
  };

  const productImage = getProductImage(product);

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-primary/10 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:ring-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={productImage}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          onError={handleImageError(PRODUCT_FALLBACK)}
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              Out of stock
            </span>
          </div>
        )}
        {product.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
            {product.category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
        <div className="space-y-2">
          <h4 className="line-clamp-2 text-sm font-semibold text-slate-900 md:text-base">
            {product.name}
          </h4>
          <RatingStars rating={product.rating || 4.5} />
          {product.description && (
            <p className="text-xs text-slate-500 line-clamp-2 md:text-sm">{product.description}</p>
          )}
        </div>
        <div className="mt-1 flex items-end justify-between gap-2">
          <div className="space-y-1">
            <span className="block text-base font-semibold text-slate-900 md:text-lg">
              ₨{Number(product.price || 0).toLocaleString()}
            </span>
            {product.stock !== undefined && (
              <span className="block text-[0.7rem] font-medium text-slate-500">
                {product.stock} in stock
              </span>
            )}
          </div>
          <Button
            className="shrink-0 px-4 text-xs md:text-sm"
            onClick={handleAddToCart}
            disabled={isAdding || product.stock === 0}
          >
            {isAdding ? 'Adding...' : 'Add to cart'}
          </Button>
        </div>
      </div>

      <ErrorToast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
};

export default ProductCard;

