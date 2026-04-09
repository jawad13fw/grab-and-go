import { useNavigate } from 'react-router-dom';
import CartItem from '../components/cart/CartItem';
import Button from '../components/common/Button';
import useCartStore from '../store/cartStore';

const Cart = () => {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const pricing = useCartStore((state) => state.pricing);
  const clearCart = useCartStore((state) => state.clearCart);
  
  const cartItems = Array.isArray(items) ? items : [];
  const subtotal = Number(pricing?.subtotal || 0);
  const deliveryFee = Number(pricing?.deliveryFee || 0);
  const tax = Number(pricing?.tax || 0);
  const discount = Number(pricing?.discount || 0);
  const total = Number(pricing?.total ?? subtotal + deliveryFee + tax - discount);

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">Cart</h1>
          {cartItems.length > 0 && (
            <button className="text-sm text-primary" onClick={clearCart}>
              Clear cart
            </button>
          )}
        </div>
        {cartItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Your cart is empty. Browse shops to add products.
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <CartItem key={String(item?.productId || item?.id || index)} item={item} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Summary</h2>
        <div className="space-y-3 text-sm text-slate-500">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₨{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>₨{deliveryFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>₨{tax.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-₨{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-slate-900 border-t border-slate-200 pt-3 mt-3">
            <span>Total</span>
            <span>₨{total.toLocaleString()}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-amber-700 mb-1">🚨 Need it urgently?</p>
          <p>Select Fast Delivery at checkout for 15-30 min delivery</p>
        </div>
        <Button className="w-full" disabled={!cartItems.length} onClick={() => navigate('/checkout')}>
          Proceed to checkout
        </Button>
      </div>
    </div>
  );
};

export default Cart;

