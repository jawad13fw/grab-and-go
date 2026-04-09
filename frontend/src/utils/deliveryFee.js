/**
 * Delivery fee calculation based on order value and nature of order.
 * Used for "Request delivery from anywhere" (custom orders within the city).
 */

export const ORDER_NATURES = [
  { id: 'food', label: 'Food & meals', multiplier: 1.4 },
  { id: 'grocery', label: 'Grocery', multiplier: 1.2 },
  { id: 'pharmacy', label: 'Pharmacy', multiplier: 1.3 },
  { id: 'parcel', label: 'Parcel / package', multiplier: 1.0 },
  { id: 'document', label: 'Documents', multiplier: 0.9 },
  { id: 'other', label: 'Other', multiplier: 1.1 },
];

const BASE_FEE = 100;
const MIN_ORDER_FOR_FREE_TIER = 2000;
const PERCENT_OF_ORDER = 0.08;

/**
 * Calculate delivery fee from order value and nature of order.
 * @param {number} orderValue - Customer-provided order value (in currency)
 * @param {string} natureId - One of ORDER_NATURES[].id (food, grocery, etc.)
 * @returns {{ deliveryFee: number, breakdown: { base: number, valueShare: number, natureMultiplier: number } }}
 */
export function getDeliveryFee(orderValue, natureId) {
  const numericValue = Math.max(0, Number(orderValue) || 0);
  const nature = ORDER_NATURES.find((n) => n.id === natureId) || ORDER_NATURES.find((n) => n.id === 'other');
  const multiplier = nature?.multiplier ?? 1.1;

  const valueShare = numericValue * PERCENT_OF_ORDER;
  const subtotal = BASE_FEE + valueShare;
  const deliveryFee = Math.round(subtotal * multiplier * 100) / 100;

  return {
    deliveryFee: Math.max(50, deliveryFee),
    breakdown: {
      base: BASE_FEE,
      valueShare: Math.round(valueShare * 100) / 100,
      natureMultiplier: multiplier,
    },
  };
}
