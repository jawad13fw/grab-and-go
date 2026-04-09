import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useAuthStore from '../store/authStore';
import { deliveryRequestsApi } from '../api/endpoints';

const FLAT_DELIVERY_FEE = 150; // Fixed delivery fee in PKR

const RequestDelivery = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [form, setForm] = useState({
    pickupAddress: '',
    whatToOrder: '',
    deliveryAddress: '',
    contactPhone: '',
    specialInstructions: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const isValid =
    form.pickupAddress.trim() &&
    form.whatToOrder.trim() &&
    form.deliveryAddress.trim() &&
    form.contactPhone.trim();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || !currentUser) return;
    setError(null);
    try {
      await deliveryRequestsApi.create({
        pickup: {
          address: form.pickupAddress,
          contactName: currentUser.name,
          contactPhone: form.contactPhone,
        },
        dropoff: {
          address: form.deliveryAddress,
          contactName: currentUser.name,
          contactPhone: form.contactPhone,
        },
        packageDetails: {
          description: form.whatToOrder,
        },
        deliveryFee: FLAT_DELIVERY_FEE,
        specialInstructions: form.specialInstructions || undefined,
      });
      setSubmitted(true);
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit');
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mb-4 text-5xl">✓</div>
        <h2 className="text-2xl font-semibold text-slate-900">Request placed</h2>
        <p className="mt-2 text-slate-600">
          Your delivery request has been submitted. A rider will be assigned soon. Redirecting to orders…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-primary">City-wide</p>
        <h1 className="text-3xl font-semibold text-slate-900">Request delivery from anywhere</h1>
        <p className="mt-2 text-slate-600">
          Tell us where to pick up, what to get, and where to deliver. Delivery fee is based on order value and type.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Pickup & order details</h2>
            <div className="mt-4 space-y-4">
              <Input
                label="Pickup location (address or place name)"
                placeholder="e.g. 123 Main St, Café Luna, Central Mall"
                value={form.pickupAddress}
                onChange={(e) => handleChange('pickupAddress', e.target.value)}
                required
              />
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                <span className="font-medium text-slate-800">What do you want to order?</span>
                <textarea
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[100px]"
                  placeholder="Describe the items or request (e.g. 2 lattes and a croissant from Café Luna)"
                  value={form.whatToOrder}
                  onChange={(e) => handleChange('whatToOrder', e.target.value)}
                  required
                />
              </label>
              <Input
                label="Contact phone number"
                type="tel"
                placeholder="e.g. +92 300 1234567"
                value={form.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Delivery address</h2>
            <div className="mt-4 space-y-4">
              <Input
                label="Where should we deliver?"
                placeholder="Your full address"
                value={form.deliveryAddress}
                onChange={(e) => handleChange('deliveryAddress', e.target.value)}
                required
              />
              <Input
                label="Special instructions (optional)"
                placeholder="e.g. Leave at door, call on arrival"
                value={form.specialInstructions}
                onChange={(e) => handleChange('specialInstructions', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Summary</h3>
            {error && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Delivery fee</span>
                <span>₨{FLAT_DELIVERY_FEE}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>₨{FLAT_DELIVERY_FEE}</span>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">
              Flat delivery fee for all custom delivery requests within the city.
            </p>
            <Button
              type="submit"
              className="mt-6 w-full"
              disabled={!isValid}
            >
              Place delivery request
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RequestDelivery;
