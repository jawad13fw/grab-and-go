import Button from '../common/Button';
import useCartStore from '../../store/cartStore';
import { getProductImage, handleImageError, PRODUCT_FALLBACK } from '../../utils/imageUtils';

const toDisplayText = (value, fallback = '') => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value == null) return fallback;
  if (typeof value === 'object') {
    if (typeof value.name === 'string' || typeof value.name === 'number') return String(value.name);
    if (typeof value.title === 'string' || typeof value.title === 'number') return String(value.title);
    if (typeof value.orderNumber === 'string' || typeof value.orderNumber === 'number') return String(value.orderNumber);
    if (typeof value.id === 'string' || typeof value.id === 'number') return String(value.id);
  }
  return fallback;
};

const toDisplayPrice = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const normalizeVariants = (variants) => (Array.isArray(variants) ? variants : []);

const CartItem = ({ item }) => {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const displayName = toDisplayText(item?.name, 'Item');
  const displayPrice = toDisplayPrice(item?.price);
  const displayVariants = normalizeVariants(item?.selectedVariants);

  const handleUpdateQuantity = (newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(item.productId, newQuantity, displayVariants);
  };

  const handleRemove = () => {
    removeItem(item.productId, displayVariants);
  };

  const itemImage = getProductImage(item);
  const itemTotal = displayPrice * (item.quantity || 1);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <img
        src={itemImage}
        alt={displayName}
        className="h-24 w-24 rounded-xl object-cover sm:h-20 sm:w-20"
        onError={handleImageError(PRODUCT_FALLBACK)}
      />
      <div className="flex-1 space-y-1">
        <h4 className="text-base font-semibold text-slate-900 md:text-lg">{displayName}</h4>
        <p className="text-sm text-slate-500">₨{displayPrice.toLocaleString()} each</p>
        {displayVariants.length > 0 && (
          <div className="text-xs text-slate-400 md:text-sm">
            {displayVariants.map((variant) => toDisplayText(variant, 'Variant')).join(', ')}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap sm:justify-end">
        <div className="flex items-center rounded-full border border-slate-200 bg-slate-50">
          <button
            className="px-3 py-1 text-sm hover:bg-slate-100 rounded-l-full disabled:opacity-40"
            onClick={() => handleUpdateQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <span className="px-3 text-sm font-medium">{item.quantity}</span>
          <button
            className="px-3 py-1 text-sm hover:bg-slate-100 rounded-r-full"
            onClick={() => handleUpdateQuantity(item.quantity + 1)}
          >
            +
          </button>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 md:text-sm">Subtotal</p>
          <p className="text-base font-semibold text-slate-900 md:text-lg">₨{itemTotal.toLocaleString()}</p>
        </div>
        <Button variant="ghost" onClick={handleRemove} className="text-sm">
          Remove
        </Button>
      </div>
    </div>
  );
};

export default CartItem;

