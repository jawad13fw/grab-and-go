const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeOrderStatus = (status) => String(status || '').trim().toLowerCase();

export const getOrderTotal = (order) => Number(order?.total ?? order?.pricing?.total ?? 0) || 0;

export const getOrderPlacedAt = (order) => toDate(order?.placedAt || order?.createdAt || order?.updatedAt);

export const getOrderDeliveredAt = (order) => toDate(order?.deliveredAt || order?.updatedAt);

export const isDeliveredOrder = (order) => normalizeOrderStatus(order?.status) === 'delivered';

export const isCancelledOrder = (order) => normalizeOrderStatus(order?.status) === 'cancelled';

export const getStatusBucket = (status) => {
  const normalized = normalizeOrderStatus(status);

  if (['assigned', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(normalized)) {
    return 'inProgress';
  }

  return normalized || 'pending';
};

export const calculatePercentChange = (current, previous) => {
  const currentValue = Number(current) || 0;
  const previousValue = Number(previous) || 0;

  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Math.round((((currentValue - previousValue) / previousValue) * 100) * 10) / 10;
};

const buildDaySeries = (orders, valueSelector) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(end);
    day.setDate(day.getDate() - (6 - index));
    day.setHours(0, 0, 0, 0);
    return day;
  });

  return days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    return orders
      .filter((order) => {
        const date = getOrderPlacedAt(order);
        return date && date >= day && date < nextDay;
      })
      .reduce((sum, order) => sum + (Number(valueSelector(order)) || 0), 0);
  });
};

const buildPeriodWindow = (offsetDays, lengthDays) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - offsetDays);
  const start = new Date(end);
  start.setDate(start.getDate() - (lengthDays - 1));
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

export const calculateOrderAnalytics = (orders = []) => {
  const normalizedOrders = Array.isArray(orders) ? orders : [];
  const statusBreakdown = normalizedOrders.reduce((acc, order) => {
    const bucket = getStatusBucket(order?.status);
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {
    pending: 0,
    inProgress: 0,
    delivered: 0,
    cancelled: 0,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterdayStart = new Date(today);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const previousWeekWindow = buildPeriodWindow(7, 7);

  const ordersToday = normalizedOrders.filter((order) => {
    const date = getOrderPlacedAt(order);
    return date && date >= today && date < tomorrow;
  });

  const ordersYesterday = normalizedOrders.filter((order) => {
    const date = getOrderPlacedAt(order);
    return date && date >= yesterdayStart && date < today;
  });

  const revenueToday = ordersToday.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const revenueYesterday = ordersYesterday.reduce((sum, order) => sum + getOrderTotal(order), 0);

  const orderTrends = buildDaySeries(normalizedOrders, () => 1);
  const revenueTrends = buildDaySeries(normalizedOrders, getOrderTotal);

  const ordersThisWeek = normalizedOrders.filter((order) => {
    const date = getOrderPlacedAt(order);
    return date && date >= weekStart && date < tomorrow;
  });

  const ordersLastWeek = normalizedOrders.filter((order) => {
    const date = getOrderPlacedAt(order);
    return date && date >= previousWeekWindow.start && date <= previousWeekWindow.end;
  });

  const weeklyRevenue = ordersThisWeek.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const previousWeeklyRevenue = ordersLastWeek.reduce((sum, order) => sum + getOrderTotal(order), 0);

  const averageDeliveryTimeMinutes = (() => {
    const deliveredOrders = normalizedOrders.filter(isDeliveredOrder);
    const durations = deliveredOrders
      .map((order) => {
        const start = toDate(order?.pickedUpAt || order?.confirmedAt || order?.placedAt);
        const end = getOrderDeliveredAt(order);
        if (!start || !end) return null;
        return (end.getTime() - start.getTime()) / 60000;
      })
      .filter((duration) => Number.isFinite(duration) && duration >= 0);

    if (durations.length === 0) return 0;
    return Math.round((durations.reduce((sum, duration) => sum + duration, 0) / durations.length) * 10) / 10;
  })();

  const completedOrders = statusBreakdown.delivered || 0;
  const cancelledOrders = statusBreakdown.cancelled || 0;
  const totalOrders = normalizedOrders.length;
  const successRate = totalOrders ? Math.round(((completedOrders / totalOrders) * 100) * 10) / 10 : 0;

  return {
    statusBreakdown,
    orderTrends,
    revenueTrends,
    ordersToday: ordersToday.length,
    ordersYesterday: ordersYesterday.length,
    revenueToday,
    revenueYesterday,
    weeklyRevenue,
    previousWeeklyRevenue,
    averageDeliveryTimeMinutes,
    deliverySuccessRate: successRate,
    activeOrders: totalOrders - completedOrders - cancelledOrders,
  };
};

export const getRiderEarningForOrder = (order) => {
  const deliveryFee = Number(order?.pricing?.deliveryFee ?? 0) || 0;
  const emergencyFee = Number(order?.pricing?.emergencyFee ?? 0) || 0;
  const platformFee = Number(order?.pricing?.platformFee ?? 0) || 0;
  return Math.max(0, Math.round((deliveryFee + emergencyFee - platformFee) * 100) / 100);
};

export const calculateRiderAnalytics = ({ orders = [], riderId, riderRecord } = {}) => {
  const normalizedOrders = Array.isArray(orders) ? orders : [];
  const riderOrders = riderId ? normalizedOrders.filter((order) => order?.riderId === riderId) : [];
  const completedOrders = riderOrders.filter(isDeliveredOrder);
  const activeOrders = riderOrders.filter((order) => !isDeliveredOrder(order) && !isCancelledOrder(order));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const completedToday = completedOrders.filter((order) => {
    const date = getOrderDeliveredAt(order) || getOrderPlacedAt(order);
    return date && date >= today && date < tomorrow;
  });

  const completedThisWeek = completedOrders.filter((order) => {
    const date = getOrderDeliveredAt(order) || getOrderPlacedAt(order);
    return date && date >= weekStart && date < tomorrow;
  });

  const completedThisMonth = completedOrders.filter((order) => {
    const date = getOrderDeliveredAt(order) || getOrderPlacedAt(order);
    return date && date >= monthStart && date < tomorrow;
  });

  const transactions = completedOrders
    .map((order) => ({
      id: `delivery-${order.id}`,
      type: 'delivery',
      description: `Delivery completed for ${order.orderNumber || order.id}`,
      amount: getRiderEarningForOrder(order),
      date: (getOrderDeliveredAt(order) || getOrderPlacedAt(order) || new Date()).toISOString(),
      status: 'completed',
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalEarnings = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const bonus = completedOrders.reduce((sum, order) => sum + (Number(order?.pricing?.emergencyFee ?? 0) || 0), 0);
  const perDelivery = completedOrders.length ? Math.round((totalEarnings / completedOrders.length) * 100) / 100 : 0;

  return {
    isOnline: riderRecord?.status ? riderRecord.status !== 'offline' : Boolean(riderRecord?.isOnline),
    earnings: {
      total: totalEarnings,
      today: completedToday.reduce((sum, order) => sum + getRiderEarningForOrder(order), 0),
      thisWeek: completedThisWeek.reduce((sum, order) => sum + getRiderEarningForOrder(order), 0),
      thisMonth: completedThisMonth.reduce((sum, order) => sum + getRiderEarningForOrder(order), 0),
      perDelivery,
      bonus: Math.round(bonus * 100) / 100,
    },
    stats: {
      completedToday: completedToday.length,
      completedTotal: completedOrders.length,
      ongoing: activeOrders.length,
      rating: Number(riderRecord?.rating ?? 0) || 0,
    },
    transactions,
  };
};