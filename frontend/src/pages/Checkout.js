import { useEffect, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { checkoutApi } from '../api/endpoints';
import { parseApiError } from '../utils/errorHelpers';

const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const StripePaymentFields = ({ onReady }) => {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    onReady({ stripe, elements });
  }, [stripe, elements, onReady]);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <p className="text-xs text-slate-500">
        Card details are handled by Stripe and never touch your server.
      </p>
    </div>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const pricing = useCartStore((state) => state.pricing);
  const shopId = useCartStore((state) => state.shopId);
  const shopName = useCartStore((state) => state.shopName);
  const clearCart = useCartStore((state) => state.clearCart);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [stripeContext, setStripeContext] = useState({ stripe: null, elements: null });
  const [deliveryDetails, setDeliveryDetails] = useState({
    name: currentUser?.name || '',
    phone: '',
    address: '',
    instructions: '',
  });
  
  const cartItems = items || [];
  const cardPaymentsEnabled = Boolean(stripePublishableKey);
  const emergencyFee = isEmergency ? 150 : 0;
  const cartSubtotal = Number(pricing?.subtotal || 0);
  const deliveryFee = Number(pricing?.deliveryFee || 0);
  const tax = Number(pricing?.tax || 0);
  const discount = Number(pricing?.discount || 0);
  const baseTotal = Number(pricing?.total ?? cartSubtotal + deliveryFee + tax - discount);
  const finalTotal = baseTotal + emergencyFee;

  useEffect(() => {
    if (!cardPaymentsEnabled && paymentMethod === 'card') {
      setPaymentMethod('cod');
    }
  }, [cardPaymentsEnabled, paymentMethod]);

  const buildCheckoutData = (confirmedPaymentIntentId) => ({
    amount: finalTotal,
    currency: 'pkr',
    items: cartItems.map((i) => ({
      id: i.productId,
      quantity: i.quantity,
      price: i.price,
      name: i.name
    })),
    customer: {
      name: deliveryDetails.name || currentUser?.name,
      phone: deliveryDetails.phone,
      address: deliveryDetails.address,
    },
    specialInstructions: deliveryDetails.instructions,
    isEmergency,
    shopId,
    shopName,
    paymentMethod,
    paymentIntentId: confirmedPaymentIntentId,
    promoCode: useCartStore.getState().promoCode || undefined,
  });

  useEffect(() => {
    let cancelled = false;

    const preparePaymentIntent = async () => {
      if (!cardPaymentsEnabled || paymentMethod !== 'card' || !cartItems.length || finalTotal <= 0) {
        if (!cancelled) {
          setClientSecret('');
          setPaymentIntentId('');
        }
        return;
      }

      setIsPreparingPayment(true);
      try {
        const response = await checkoutApi.createPaymentIntent({ amount: finalTotal });
        if (!cancelled && response.success) {
          setClientSecret(response.paymentIntent.clientSecret || '');
          setPaymentIntentId(response.paymentIntent.id || '');
        }
      } catch (err) {
        if (!cancelled) {
          const parsed = err.parsedError || parseApiError(err);
          setResult({ success: false, message: parsed.message, title: parsed.title, hint: parsed.hint });
          setClientSecret('');
          setPaymentIntentId('');
        }
      } finally {
        if (!cancelled) {
          setIsPreparingPayment(false);
        }
      }
    };

    preparePaymentIntent();

    return () => {
      cancelled = true;
    };
  }, [cardPaymentsEnabled, paymentMethod, cartItems.length, finalTotal]);

  const handleCheckout = async () => {
    setIsProcessing(true);
    setResult(null);
    try {
      if (paymentMethod === 'card') {
        if (!cardPaymentsEnabled) {
          throw Object.assign(new Error('Card payments are not configured for this frontend environment.'), {
            parsedError: { message: 'Card payments are not configured for this frontend environment.' }
          });
        }

        const { stripe, elements } = stripeContext;
        if (!stripe || !elements || !clientSecret) {
          throw Object.assign(new Error('Secure card form is still loading. Please wait a moment and try again.'), {
            parsedError: { message: 'Secure card form is still loading. Please wait a moment and try again.' }
          });
        }

        const confirmation = await stripe.confirmPayment({
          elements,
          redirect: 'if_required',
          confirmParams: {
            payment_method_data: {
              billing_details: {
                name: deliveryDetails.name || currentUser?.name || '',
                email: currentUser?.email || '',
                phone: deliveryDetails.phone || '',
                address: {
                  line1: deliveryDetails.address || '',
                },
              },
            },
          },
        });

        if (confirmation.error) {
          throw Object.assign(new Error(confirmation.error.message || 'Card payment failed.'), {
            parsedError: { message: confirmation.error.message || 'Card payment failed.' }
          });
        }

        const confirmedIntentId = confirmation.paymentIntent?.id || paymentIntentId;
        if (!confirmedIntentId) {
          throw Object.assign(new Error('Payment confirmation did not return a valid payment intent.'), {
            parsedError: { message: 'Payment confirmation did not return a valid payment intent.' }
          });
        }

        const response = await checkoutApi.create(buildCheckoutData(confirmedIntentId));
        setResult(response);
        await clearCart();
        setTimeout(() => navigate('/orders'), 1500);
        setIsProcessing(false);
        return;
      }

      const response = await checkoutApi.create(buildCheckoutData(undefined));
      setResult(response);
      await clearCart();
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err) {
      const parsed = err.parsedError || parseApiError(err);
      setResult({
        success: false,
        message: parsed.message,
        title: parsed.title,
        hint: parsed.hint,
        errors: parsed.errors,
      });
    }
    setIsProcessing(false);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Delivery details</h2>

        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🚨</span>
                <h3 className="text-lg font-semibold text-slate-900">Fast Delivery</h3>
              </div>
              <p className="text-sm text-slate-600">
                Need it urgently? Get priority delivery within 15-30 minutes
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          {isEmergency && (
            <div className="mt-3 rounded-lg bg-white p-3 text-sm">
              <p className="font-semibold text-amber-700 mb-1">Priority Features:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Fastest available rider assignment</li>
                <li>15-30 minute delivery window</li>
                <li>Real-time priority tracking</li>
                <li>Dedicated support line</li>
              </ul>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <Input
            label="Full name"
            placeholder="Jane Doe"
            value={deliveryDetails.name}
            onChange={(e) => setDeliveryDetails((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Phone number"
            placeholder="+1 555-0100"
            value={deliveryDetails.phone}
            onChange={(e) => setDeliveryDetails((p) => ({ ...p, phone: e.target.value }))}
          />
          <Input
            label="Address"
            placeholder="123 Innovation Drive"
            value={deliveryDetails.address}
            onChange={(e) => setDeliveryDetails((p) => ({ ...p, address: e.target.value }))}
          />
          <Input
            label="Delivery instructions"
            placeholder="E.g. Leave at concierge"
            value={deliveryDetails.instructions}
            onChange={(e) => setDeliveryDetails((p) => ({ ...p, instructions: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Payment Method</h2>
        
        {/* Payment Options */}
        <div className="space-y-3">
          <label 
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
              paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input 
              type="radio" 
              name="payment" 
              value="card" 
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={!cardPaymentsEnabled}
              className="w-4 h-4 text-primary"
            />
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Credit/Debit Card</p>
              <p className="text-sm text-slate-500">
                {cardPaymentsEnabled ? 'Pay securely with Stripe' : 'Unavailable until REACT_APP_STRIPE_PUBLISHABLE_KEY is configured'}
              </p>
            </div>
            <span className="text-2xl">💳</span>
          </label>
          
          <label 
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
              paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input 
              type="radio" 
              name="payment" 
              value="cod" 
              checked={paymentMethod === 'cod'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-4 h-4 text-primary"
            />
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Cash on Delivery</p>
              <p className="text-sm text-slate-500">Pay when you receive your order</p>
            </div>
            <span className="text-2xl">💵</span>
          </label>
          
          <label 
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
              paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input 
              type="radio" 
              name="payment" 
              value="wallet" 
              checked={paymentMethod === 'wallet'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-4 h-4 text-primary"
            />
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Digital Wallet</p>
              <p className="text-sm text-slate-500">Pay with Apple Pay, Google Pay, etc.</p>
            </div>
            <span className="text-2xl">👛</span>
          </label>
        </div>

        {/* Card Details - Removed since they should be handled client-side with Stripe Elements */}
        {paymentMethod === 'card' && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Secure Card Processing</span>
                <br />
                Your card details will be processed by Stripe and confirmed before the order is created.
              </p>
            </div>
            {cardPaymentsEnabled && clientSecret && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentFields onReady={setStripeContext} />
              </Elements>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                {cardPaymentsEnabled
                  ? (isPreparingPayment ? 'Preparing secure payment form...' : 'Unable to load the secure payment form. Try refreshing the page.')
                  : 'Card checkout is disabled because Stripe publishable key is not configured in the frontend environment.'}
              </div>
            )}
          </div>
        )}

        {/* COD Notice */}
        {paymentMethod === 'cod' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <p className="text-sm text-emerald-800">
              <span className="font-semibold">Cash on Delivery</span>
              <br />
              Please keep exact change ready. Our rider will collect the payment when delivering your order.
            </p>
          </div>
        )}

        {/* Wallet Notice */}
        {paymentMethod === 'wallet' && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Digital Wallet</span>
              <br />
              You will be redirected to complete payment with your preferred wallet after placing the order.
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-slate-50 p-4 space-y-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>Rs. {cartSubtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span className={isEmergency ? 'font-semibold text-amber-600' : ''}>
              Rs. {deliveryFee.toLocaleString()} {isEmergency && '⚡'}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tax</span>
            <span>Rs. {tax.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-Rs. {discount.toLocaleString()}</span>
            </div>
          )}
          {isEmergency && (
            <div className="flex justify-between text-amber-700">
              <span>⚡ Fast Delivery Fee</span>
              <span className="font-semibold">Rs. {emergencyFee.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span className={isEmergency ? 'text-amber-600' : ''}>
              Rs. {finalTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Info */}
        {paymentMethod === 'card' && (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Card payments are processed securely via Stripe.
          </div>
        )}
        
        <Button
          className={`w-full ${isEmergency ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
          onClick={handleCheckout}
          disabled={isProcessing || isPreparingPayment || !cartItems.length || (paymentMethod === 'card' && (!cardPaymentsEnabled || !clientSecret))}
        >
          {isProcessing 
            ? 'Processing...' 
            : paymentMethod === 'cod' 
                ? `Place Order - Pay Rs. ${finalTotal.toLocaleString()} on Delivery ${isEmergency ? '⚡' : ''}`
                : `Pay Rs. ${finalTotal.toLocaleString()} ${isEmergency ? '⚡' : ''}`
          }
        </Button>
        {result && (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${result.success ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {result.title && !result.success && (
              <p className="font-semibold mb-1">{result.title}</p>
            )}
            <p>{result.message} {result.reference && `Reference: ${result.reference}`}</p>
            {result.hint && !result.success && (
              <p className="mt-1 text-xs opacity-80">Info: {result.hint}</p>
            )}
            {result.errors && result.errors.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
                {result.errors.map((e, i) => (
                  <li key={i}><span className="font-medium">{e.field}</span>: {e.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;

