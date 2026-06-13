import { useEffect, useState, useRef } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { checkoutApi } from '../api/endpoints';
import { parseApiError } from '../utils/errorHelpers';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
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
        Card details are processed securely by Stripe and never touch our servers.
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
  const [processingStep, setProcessingStep] = useState(''); // step description
  const [result, setResult] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [stripeContext, setStripeContext] = useState({ stripe: null, elements: null });
  const [validationErrors, setValidationErrors] = useState({});
  const [deliveryDetails, setDeliveryDetails] = useState({
    name: currentUser?.name || '',
    phone: '',
    address: '',
    instructions: '',
  });
  const processingRef = useRef(false);
  
  const cartItems = items || [];
  const cardPaymentsEnabled = Boolean(stripePublishableKey);
  const emergencyFee = isEmergency ? 150 : 0;
  const cartSubtotal = Number(pricing?.subtotal || 0);
  const deliveryFee = Number(pricing?.deliveryFee || 0);
  const tax = Number(pricing?.tax || 0);
  const discount = Number(pricing?.discount || 0);
  const baseTotal = Number(pricing?.total ?? cartSubtotal + deliveryFee + tax - discount);
  const finalTotal = baseTotal + emergencyFee;

  // Amount to send to Stripe — must match what the backend will compute.
  // Backend: productSubtotal + deliveryFee + tax + emergencyFee - discount
  const stripePaymentAmount = cartSubtotal + deliveryFee + tax + emergencyFee - discount;

  // Redirect to COD if card payments aren't available
  useEffect(() => {
    if (!cardPaymentsEnabled && paymentMethod === 'card') {
      setPaymentMethod('cod');
    }
  }, [cardPaymentsEnabled, paymentMethod]);

  // Validate delivery details
  const validate = () => {
    const errors = {};
    if (!deliveryDetails.name.trim()) {
      errors.name = 'Please enter your full name for delivery.';
    }
    if (!deliveryDetails.phone.trim()) {
      errors.phone = 'Please enter a phone number so the rider can contact you.';
    } else if (deliveryDetails.phone.trim().length < 7) {
      errors.phone = 'Please enter a valid phone number (at least 7 digits).';
    }
    if (!deliveryDetails.address.trim()) {
      errors.address = 'Please enter a complete delivery address.';
    } else if (deliveryDetails.address.trim().length < 10) {
      errors.address = 'Please provide a more detailed address (street, area, city).';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
    deliveryFee: Number(pricing?.deliveryFee || 0),
    tax: Number(pricing?.tax || 0),
    promoCode: useCartStore.getState().promoCode || undefined,
  });

  // Prepare Stripe payment intent when card is selected
  useEffect(() => {
    let cancelled = false;

    const preparePaymentIntent = async () => {
      if (!cardPaymentsEnabled || paymentMethod !== 'card' || !cartItems.length || stripePaymentAmount <= 0) {
        if (!cancelled) {
          setClientSecret('');
          setPaymentIntentId('');
        }
        return;
      }

      setIsPreparingPayment(true);
      try {
        // Use stripePaymentAmount which matches what the backend will verify
        const response = await checkoutApi.createPaymentIntent({ amount: stripePaymentAmount });
        if (!cancelled && response.success) {
          setClientSecret(response.paymentIntent.clientSecret || '');
          setPaymentIntentId(response.paymentIntent.id || '');
        }
      } catch (err) {
        if (!cancelled) {
          const parsed = err.parsedError || parseApiError(err);
          setResult({
            success: false,
            message: parsed.message || 'Failed to prepare payment. Please try Cash on Delivery or refresh the page.',
            title: 'Payment Setup Failed',
            hint: 'If this persists, switch to Cash on Delivery.'
          });
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
  }, [cardPaymentsEnabled, paymentMethod, cartItems.length, stripePaymentAmount]);

  const handleCheckout = async () => {
    // Prevent double-submission
    if (processingRef.current) return;

    // Run validation first
    if (!validate()) {
      return;
    }

    if (!cartItems.length) {
      setResult({ success: false, message: 'Your cart is empty. Please add items before checking out.' });
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setResult(null);
    setProcessingStep('');

    try {
      if (paymentMethod === 'card') {
        if (!cardPaymentsEnabled) {
          throw Object.assign(new Error('Card payments are not configured. Please select Cash on Delivery.'), {
            parsedError: { message: 'Card payments are not configured. Please select Cash on Delivery.' }
          });
        }

        const { stripe, elements } = stripeContext;
        if (!stripe || !elements || !clientSecret) {
          throw Object.assign(new Error('Secure card form is still loading. Please wait a moment and try again.'), {
            parsedError: { message: 'Secure card form is still loading. Please wait a moment and try again.' }
          });
        }

        // Step 1: Confirm payment with Stripe
        setProcessingStep('Verifying your card payment...');
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

        // Handle Stripe errors (card declined, authentication required, etc.)
        if (confirmation.error) {
          const errMsg = confirmation.error.message || 'Card payment was not completed.';
          const errType = confirmation.error.type;

          let hint = '';
          if (errType === 'card_error') {
            hint = 'Your card was declined. Please check your card details or try a different card.';
          } else if (errType === 'validation_error') {
            hint = 'Please check your card details and try again.';
          } else if (confirmation.error.code === 'payment_intent_authentication_failed') {
            hint = 'Your bank requires additional verification. Please try again or use a different payment method.';
          }

          throw Object.assign(
            new Error(errMsg),
            { parsedError: { message: errMsg, title: 'Payment Failed', hint } }
          );
        }

        // Step 2: Verify payment status
        const paymentIntent = confirmation.paymentIntent;
        if (!paymentIntent) {
          throw Object.assign(
            new Error('Payment confirmation did not return a valid result. Please contact support.'),
            { parsedError: { message: 'Payment confirmation did not return a valid result. Please contact support.', title: 'Payment Error' } }
          );
        }

        // Check if payment requires additional action (3D Secure redirect)
        if (paymentIntent.status === 'requires_action') {
          setProcessingStep('Your bank requires additional verification. Redirecting...');
          // Let Stripe handle the redirect for additional authentication
          await stripe.confirmCardPayment(paymentIntent.client_secret);
          // After additional auth, check status again
          const updatedIntent = await stripe.retrievePaymentIntent(paymentIntent.client_secret);
          if (updatedIntent.paymentIntent?.status !== 'succeeded') {
            throw Object.assign(
              new Error('Payment authentication was not completed. Please try again.'),
              { parsedError: { message: 'Payment authentication was not completed. Please try again.', title: 'Authentication Required' } }
            );
          }
        }

        if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'requires_action') {
          throw Object.assign(
            new Error(`Payment status: ${paymentIntent.status}. Your payment could not be processed.`),
            { parsedError: { message: `Payment could not be processed (status: ${paymentIntent.status}). Please try again or switch to Cash on Delivery.`, title: 'Payment Not Completed' } }
          );
        }

        const confirmedIntentId = paymentIntent.id || paymentIntentId;
        if (!confirmedIntentId) {
          throw Object.assign(
            new Error('Payment confirmed but no payment ID was returned. Please contact support.'),
            { parsedError: { message: 'Payment confirmed but no payment ID was returned. Please contact support.', title: 'Payment Error' } }
          );
        }

        // Step 3: Brief delay to ensure Stripe's systems have fully recorded the payment
        setProcessingStep('Payment verified! Creating your order...');
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Step 4: Submit order to backend (backend will verify payment with Stripe)
        const response = await checkoutApi.create(buildCheckoutData(confirmedIntentId));
        setResult(response);
        if (response.success) {
          await clearCart();
          setTimeout(() => navigate('/orders'), 2000);
        }
        setIsProcessing(false);
        setProcessingStep('');
        processingRef.current = false;
        return;
      }

      // COD flow — no payment verification needed
      setProcessingStep('Placing your order...');
      const response = await checkoutApi.create(buildCheckoutData(undefined));
      setResult(response);
      if (response.success) {
        await clearCart();
        setTimeout(() => navigate('/orders'), 2000);
      }
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
    setProcessingStep('');
    processingRef.current = false;
  };

  // Clear field error on change
  const updateDelivery = (field, value) => {
    setDeliveryDetails((p) => ({ ...p, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const canPlaceOrder = !isProcessing && !isPreparingPayment && cartItems.length > 0
    && !(paymentMethod === 'card' && (!cardPaymentsEnabled || !clientSecret));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-slate-500">Complete the steps below to place your order.</p>
      </div>

      {/* Empty cart guard */}
      {cartItems.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-lg font-semibold text-amber-800">Your cart is empty</p>
          <p className="mt-1 text-sm text-amber-600">Add items from a shop before checking out.</p>
          <Link to="/shops" className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
            Browse Shops
          </Link>
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left Column: Delivery + Payment (3 cols) */}
          <div className="lg:col-span-3 space-y-6">

            {/* ── STEP 1: Delivery Details ── */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">1</span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Delivery Details</h2>
                  <p className="text-xs text-slate-500">Where should we deliver your order?</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Input
                    label="Full name"
                    placeholder="e.g. Ahmed Khan"
                    value={deliveryDetails.name}
                    onChange={(e) => updateDelivery('name', e.target.value)}
                  />
                  {validationErrors.name && <p className="mt-1 text-xs text-rose-600">{validationErrors.name}</p>}
                </div>

                <div>
                  <Input
                    label="Phone number"
                    placeholder="e.g. 0300-1234567"
                    value={deliveryDetails.phone}
                    onChange={(e) => updateDelivery('phone', e.target.value)}
                  />
                  {validationErrors.phone && <p className="mt-1 text-xs text-rose-600">{validationErrors.phone}</p>}
                  <p className="mt-1 text-xs text-slate-400">The rider will call this number if needed.</p>
                </div>

                <div>
                  <Input
                    label="Full delivery address"
                    placeholder="e.g. House 12, Street 5, Model Town, Vehari"
                    value={deliveryDetails.address}
                    onChange={(e) => updateDelivery('address', e.target.value)}
                  />
                  {validationErrors.address && <p className="mt-1 text-xs text-rose-600">{validationErrors.address}</p>}
                  <p className="mt-1 text-xs text-slate-400">Include street, area, and city for accurate delivery.</p>
                </div>

                <div>
                  <Input
                    label="Delivery instructions (optional)"
                    placeholder="e.g. Ring the bell, leave at the gate, 2nd floor"
                    value={deliveryDetails.instructions}
                    onChange={(e) => updateDelivery('instructions', e.target.value)}
                  />
                </div>
              </div>

              {/* Fast Delivery Toggle */}
              <div className="mt-5 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🚨</span>
                      <h3 className="text-base font-semibold text-slate-900">Fast Delivery (+Rs. 150)</h3>
                    </div>
                    <p className="text-xs text-slate-600">
                      Priority rider assignment with 15-30 minute delivery window.
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
                  <div className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-600">
                    <p className="font-semibold text-amber-700 mb-1">Priority includes:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Fastest available rider assignment</li>
                      <li>15-30 minute delivery window</li>
                      <li>Real-time priority tracking</li>
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* ── STEP 2: Payment Method ── */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">2</span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Payment Method</h2>
                  <p className="text-xs text-slate-500">Choose how you want to pay.</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Card option */}
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
                    <p className="text-xs text-slate-500">
                      {cardPaymentsEnabled ? 'Secure payment via Stripe. Your card details are never stored on our servers.' : 'Card payments are not currently available.'}
                    </p>
                  </div>
                  <span className="text-2xl">💳</span>
                </label>

                {/* COD option */}
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
                    <p className="text-xs text-slate-500">Pay the rider in cash when your order arrives. Please keep exact change ready.</p>
                  </div>
                  <span className="text-2xl">💵</span>
                </label>
              </div>

              {/* Card payment form */}
              {paymentMethod === 'card' && (
                <div className="mt-4 space-y-3">
                  {cardPaymentsEnabled && clientSecret && stripePromise ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripePaymentFields onReady={setStripeContext} />
                    </Elements>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      {cardPaymentsEnabled
                        ? (isPreparingPayment ? 'Preparing secure payment form...' : 'Unable to load the payment form. Try refreshing the page or choose Cash on Delivery.')
                        : 'Card payments are not currently available. Please use Cash on Delivery.'}
                    </div>
                  )}
                </div>
              )}

              {/* COD confirmation */}
              {paymentMethod === 'cod' && (
                <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-sm text-emerald-800">
                    <span className="font-semibold">Cash on Delivery selected.</span> Pay Rs. {finalTotal.toLocaleString()} to the rider when your order is delivered.
                  </p>
                </div>
              )}
            </section>

            {/* ── STEP 3: Review & Place Order ── */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">3</span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Review & Place Order</h2>
                  <p className="text-xs text-slate-500">Check your order details before confirming.</p>
                </div>
              </div>

              {/* Order items summary */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Items ({cartItems.length})</p>
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 truncate max-w-[60%]">
                      {item.name} <span className="text-slate-400">x{item.quantity}</span>
                    </span>
                    <span className="font-medium text-slate-900">Rs. {((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                  </div>
                ))}
                {shopName && (
                  <p className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                    From: <span className="font-medium">{shopName}</span>
                  </p>
                )}
              </div>

              {/* Delivery summary */}
              <div className="rounded-xl bg-slate-50 p-3 mb-4 text-xs text-slate-600 space-y-1">
                <p><span className="font-medium text-slate-700">Deliver to:</span> {deliveryDetails.name || '—'}, {deliveryDetails.address || '—'}</p>
                <p><span className="font-medium text-slate-700">Phone:</span> {deliveryDetails.phone || '—'}</p>
                {deliveryDetails.instructions && (
                  <p><span className="font-medium text-slate-700">Instructions:</span> {deliveryDetails.instructions}</p>
                )}
                <p><span className="font-medium text-slate-700">Payment:</span> {paymentMethod === 'card' ? 'Credit/Debit Card (Stripe)' : 'Cash on Delivery'}</p>
                {isEmergency && <p className="text-amber-600 font-medium">🚨 Fast Delivery priority enabled</p>}
              </div>

              {/* Validation summary */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-sm font-semibold text-rose-800 mb-1">Please fix the following before placing your order:</p>
                  <ul className="text-xs text-rose-700 list-disc list-inside space-y-0.5">
                    {Object.entries(validationErrors).map(([field, msg]) => (
                      <li key={field}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Processing step indicator */}
              {isProcessing && processingStep && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="text-sm font-medium text-blue-800">{processingStep}</p>
                </div>
              )}

              {/* Place Order button */}
              <Button
                className={`w-full text-base ${isEmergency ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                onClick={handleCheckout}
                disabled={!canPlaceOrder}
              >
                {isProcessing
                  ? 'Processing...'
                  : paymentMethod === 'cod'
                    ? `Place Order — Pay Rs. ${finalTotal.toLocaleString()} on Delivery ${isEmergency ? '🚨' : ''}`
                    : `Pay Rs. ${finalTotal.toLocaleString()} with Card ${isEmergency ? '🚨' : ''}`
                }
              </Button>

              {paymentMethod === 'card' && cardPaymentsEnabled && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  <span>Your payment is secured and encrypted by Stripe. 3D Secure verification may be required by your bank.</span>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Price Breakdown (2 cols) */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                  <span>Rs. {cartSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className={isEmergency ? 'font-semibold text-amber-600' : ''}>
                    Rs. {deliveryFee.toLocaleString()} {isEmergency && '🚨'}
                  </span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax</span>
                    <span>Rs. {tax.toLocaleString()}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>-Rs. {discount.toLocaleString()}</span>
                  </div>
                )}
                {isEmergency && (
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>🚨 Fast Delivery Fee</span>
                    <span>Rs. {emergencyFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span className={isEmergency ? 'text-amber-600' : ''}>
                    Rs. {finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Help notice */}
              <div className="mt-5 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                <p className="font-semibold mb-1">Need help with your order?</p>
                <p>Contact support from your order tracking page after placing your order, or reach out via your profile.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result message (success/error) */}
      {result && (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md rounded-2xl border px-4 py-3 text-sm shadow-lg z-50 ${
          result.success
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-rose-200 bg-rose-50 text-rose-700'
        }`}>
          {result.title && !result.success && (
            <p className="font-semibold mb-1">{result.title}</p>
          )}
          <p>{result.message} {result.reference && `Reference: ${result.reference}`}</p>
          {result.hint && !result.success && (
            <p className="mt-1 text-xs opacity-80">Tip: {result.hint}</p>
          )}
          {result.errors && result.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
              {result.errors.map((e, i) => (
                <li key={i}><span className="font-medium">{e.field}</span>: {e.message}</li>
              ))}
            </ul>
          )}
          {result.success && (
            <p className="mt-1 text-xs opacity-80">Redirecting to your orders...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Checkout;
