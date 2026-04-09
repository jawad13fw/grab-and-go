const ORDER_STATUSES = [
  'pending',
  'assigned',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

const ROLE_ALLOWED_STATUSES = {
  Admin: ['assigned', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'],
  Vendor: ['confirmed', 'preparing', 'ready'],
  Rider: ['confirmed', 'out_for_delivery', 'delivered']
};

const STATUS_TRANSITIONS = {
  pending: ['assigned', 'confirmed'],
  assigned: ['confirmed', 'preparing'],
  confirmed: ['preparing', 'ready', 'out_for_delivery'],
  preparing: ['ready', 'out_for_delivery'],
  ready: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: []
};

const STATUS_TIMESTAMP_FIELD = {
  confirmed: 'confirmedAt',
  preparing: 'preparingAt',
  ready: 'readyAt',
  out_for_delivery: 'pickedUpAt',
  delivered: 'deliveredAt',
  cancelled: 'cancelledAt'
};

function normalizeStatus(status) {
  if (typeof status !== 'string') return '';
  return status.trim();
}

export function validateOrderStatusUpdate({ currentStatus, nextStatus, userRole, allowCancelled = false }) {
  const normalizedCurrentStatus = normalizeStatus(currentStatus);
  const normalizedNextStatus = normalizeStatus(nextStatus);

  if (!normalizedNextStatus) {
    return { valid: false, code: 'INVALID_STATUS', message: 'Status is required.' };
  }

  if (!ORDER_STATUSES.includes(normalizedNextStatus)) {
    return { valid: false, code: 'INVALID_STATUS', message: 'Invalid status value.' };
  }

  if (normalizedNextStatus === 'cancelled' && !allowCancelled) {
    return {
      valid: false,
      code: 'CANCEL_VIA_ENDPOINT_ONLY',
      message: 'Use the cancel endpoint for cancellations so refunds and metadata are processed safely.'
    };
  }

  const roleAllowedStatuses = ROLE_ALLOWED_STATUSES[userRole] || [];
  if (!roleAllowedStatuses.includes(normalizedNextStatus)) {
    return {
      valid: false,
      code: 'ROLE_STATUS_NOT_ALLOWED',
      message: 'Your role cannot set this status.'
    };
  }

  if (normalizedCurrentStatus === normalizedNextStatus) {
    return {
      valid: false,
      code: 'NOOP_STATUS',
      message: 'Order is already in this status.'
    };
  }

  const allowedNextStatuses = STATUS_TRANSITIONS[normalizedCurrentStatus] || [];
  if (!allowedNextStatuses.includes(normalizedNextStatus)) {
    return {
      valid: false,
      code: 'INVALID_TRANSITION',
      message: `Cannot transition order from ${normalizedCurrentStatus} to ${normalizedNextStatus}.`
    };
  }

  return { valid: true, status: normalizedNextStatus };
}

export function applyOrderStatusTimestamp(order, status) {
  const field = STATUS_TIMESTAMP_FIELD[status];
  if (!field || !order) return;
  order[field] = new Date();
}
