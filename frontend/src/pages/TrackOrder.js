import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TruckIcon } from '@heroicons/react/24/solid';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import Loader from '../components/common/Loader';
import { ordersApi } from '../api/endpoints';
import { useOrderTracking } from '../hooks/useSocket';
import { normalizeLocation, normalizeLocationOrDefault } from '../utils/location';

const normalizeStatus = (status) => {
  const raw = String(status || '').toLowerCase();
  if (raw === 'delivering' || raw === 'on_the_way') return 'out_for_delivery';
  if (raw === 'picked' || raw === 'picked_order') return 'picked_up';
  if (raw === 'canceled') return 'cancelled';
  return raw;
};

const FollowRider = ({ lat, lng }) => {
  const map = useMap();

  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.75 });
    }
  }, [lat, lng, map]);

  return null;
};

const TrackOrder = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [nowTs, setNowTs] = useState(Date.now());
  
  // Connect to socket for real-time updates
  const socket = useOrderTracking(orderId);
  
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await ordersApi.get(orderId);
        setOrder(response);
        // Set initial rider location if available
        if (response.tracking?.currentLocation) {
          setRiderLocation(response.tracking.currentLocation);
        }
        if (response.tracking?.eta) {
          setEstimatedTime(response.tracking.eta);
        }
        if (Number.isFinite(Number(response.tracking?.distance))) {
          setDistanceKm(Number(response.tracking.distance));
        }
      } catch (err) {
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);
  
  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;
    
    const handleOrderStatusUpdate = (data) => {
      const nextStatus = normalizeStatus(data?.status);
      setOrder(prev => ({
        ...(prev || {}),
        status: nextStatus,
        statusHistory: data?.statusHistory || prev?.statusHistory || []
      }));
    };
    
    const handleRiderLocation = (data) => {
      setRiderLocation(data.location);
    };
    
    const handleEtaUpdate = (data) => {
      setEstimatedTime(data.estimatedTime);
      if (Number.isFinite(Number(data?.distance))) {
        setDistanceKm(Number(data.distance));
      }
    };

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    setSocketConnected(Boolean(socket.connected));
    
    socket.on('order_status_update', handleOrderStatusUpdate);
    socket.on('rider_location', handleRiderLocation);
    socket.on('eta_update', handleEtaUpdate);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    return () => {
      socket.off('order_status_update', handleOrderStatusUpdate);
      socket.off('rider_location', handleRiderLocation);
      socket.off('eta_update', handleEtaUpdate);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    const interval = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const destination = normalizeLocation(order?.deliveryAddress);
    const riderPoint = normalizeLocation(riderLocation || order?.tracking?.currentLocation);

    if (!destination || !riderPoint) {
      setRoutePoints([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${riderPoint.lng},${riderPoint.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url, { signal: controller.signal });
        const payload = await response.json();
        const route = payload?.routes?.[0];

        if (!route?.geometry?.coordinates?.length) {
          setRoutePoints([]);
          return;
        }

        const points = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRoutePoints(points);

        if (Number.isFinite(Number(route.distance))) {
          const roadDistanceKm = Math.round((Number(route.distance) / 1000) * 100) / 100;
          setDistanceKm(roadDistanceKm);
        }
      } catch (_) {
        setRoutePoints([]);
      }
    }, 700);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [order, riderLocation]);
  
  if (loading) return <Loader label="Loading order details..." />;
  if (error) return <p className="text-rose-500">{error}</p>;
  if (!order) return <p className="text-slate-500">Order not found.</p>;
  
  const rider = order.rider || { name: 'Assigning...', vehicleType: '-', phone: '-' };
  const shop = { name: order.shopName || 'Shop', address: order.deliveryAddress?.address || '-' };
  const normalizedStatus = normalizeStatus(order.status);
  const deliveryPoint = normalizeLocationOrDefault(order?.deliveryAddress);
  const riderPoint = normalizeLocationOrDefault(riderLocation || order?.tracking?.currentLocation, deliveryPoint);

  // Simple status messages
  const statusMessages = {
    pending: { text: 'Order received! We\'re working on it.', color: 'text-amber-600', bg: 'bg-amber-50' },
    assigned: { text: 'A rider has been assigned to your order.', color: 'text-blue-600', bg: 'bg-blue-50' },
    confirmed: { text: 'Order confirmed! Preparing your items.', color: 'text-blue-600', bg: 'bg-blue-50' },
    preparing: { text: 'Preparing your order...', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ready: { text: 'Order is ready! Waiting for rider.', color: 'text-purple-600', bg: 'bg-purple-50' },
    picked_up: { text: 'Rider picked up your order!', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    out_for_delivery: { text: 'Out for delivery!', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    delivered: { text: 'Delivered! Enjoy your meal!', color: 'text-green-600', bg: 'bg-green-50' },
    cancelled: { text: 'This order was cancelled.', color: 'text-rose-700', bg: 'bg-rose-50' }
  };
  
  const currentStatus = statusMessages[normalizedStatus] || statusMessages.preparing;

  // Define order progress steps
  const orderSteps = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Picked Up', 'On the Way', 'Delivered'];

  // Map order status to progress step index
  const getStatusIndex = (status) => {
    const mapped = normalizeStatus(status);
    switch(mapped) {
      case 'pending': return 0;
      case 'assigned': return 1;
      case 'confirmed': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'picked_up': return 4;
      case 'out_for_delivery': return 5;
      case 'delivered': return 6;
      default: return 2; // default to 'preparing'
    }
  };

  const currentStepIndex = getStatusIndex(order.status);

  // Use real-time estimated time or fallback to order data
  const displayEstimatedTime = estimatedTime || 
    (order?.tracking?.eta) || 
    (order?.deliveryTime) || 
    (order?.shop?.deliveryTime) || 
    '20-35 min';

  const etaDate = new Date(displayEstimatedTime);
  const etaLabel = Number.isNaN(etaDate.getTime())
    ? String(displayEstimatedTime)
    : etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const minutesLeft = Number.isNaN(etaDate.getTime())
    ? null
    : Math.max(0, Math.round((etaDate.getTime() - nowTs) / 60000));
  const distanceLabel = Number.isFinite(Number(distanceKm))
    ? `${Number(distanceKm).toFixed(2)} km`
    : 'Calculating...';

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`rounded-3xl ${currentStatus.bg} p-6 shadow-sm`}>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-white p-3 shadow-sm">
            <TruckIcon className={`h-8 w-8 ${currentStatus.color}`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${currentStatus.color}`}>{currentStatus.text}</h2>
            <p className="mt-1 text-slate-600">Order #{order.id} - {order.shopName}</p>
          </div>
          <div className="ml-auto">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${socketConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <span className={`h-2 w-2 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {socketConnected ? 'Live' : 'Reconnecting'}
            </span>
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Rider</p>
            <p className="text-lg font-semibold text-slate-900">{rider.name}</p>
            <p className="text-sm text-slate-500">{rider.vehicleType || rider.vehicle || '-'} - {rider.phone}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">From</p>
            <p className="text-lg font-semibold text-slate-900">{shop.name}</p>
            <p className="text-sm text-slate-500">{shop.address}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">To</p>
            <p className="text-lg font-semibold text-slate-900">{order.customer?.name || '-'}</p>
            <p className="text-sm text-slate-500">{order.deliveryAddress?.address || order.customer?.address || '-'}</p>
          </div>
        </div>
      </div>

      {/* Map View with Rider Location */}
      <div className="rounded-3xl border border-slate-200 bg-slate-100 p-3" style={{ height: '340px' }}>
        <MapContainer
          center={[riderPoint.lat, riderPoint.lng]}
          zoom={13}
          style={{ height: '100%', borderRadius: '16px', overflow: 'hidden' }}
        >
          <FollowRider lat={riderPoint.lat} lng={riderPoint.lng} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[riderPoint.lat, riderPoint.lng]}>
            <Popup>Rider location</Popup>
          </Marker>
          <Marker position={[deliveryPoint.lat, deliveryPoint.lng]}>
            <Popup>Delivery destination</Popup>
          </Marker>
          <Polyline
            positions={routePoints.length > 1 ? routePoints : [[riderPoint.lat, riderPoint.lng], [deliveryPoint.lat, deliveryPoint.lng]]}
            color="#10b981"
          />
        </MapContainer>
      </div>

      {/* Simple Progress */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Order Progress</h3>
        <div className="flex items-center justify-between">
          {orderSteps.map((step, i) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`h-3 w-3 rounded-full ${i <= currentStepIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <span className={`mt-2 text-xs ${i <= currentStepIndex ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
            Current: {orderSteps[currentStepIndex]}
          </span>
        </div>
      </div>

      {/* Estimated Time */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-500">Estimated Delivery</p>
        <p className="text-2xl font-bold text-slate-900">{etaLabel}</p>
        <p className="text-xs text-slate-400 mt-1">Real-time updates</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-sm text-slate-500">Distance Remaining</p>
          <p className="text-2xl font-bold text-slate-900">{distanceLabel}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-sm text-slate-500">Minutes Left</p>
          <p className="text-2xl font-bold text-slate-900">{minutesLeft === null ? '--' : `${minutesLeft} min`}</p>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;

