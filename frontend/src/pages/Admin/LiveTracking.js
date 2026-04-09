import { useState, useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { adminApi, ordersApi, catalogApi } from '../../api/endpoints';
import { useSocket } from '../../hooks/useSocket';

const adminRoutes = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'User Management', path: '/admin/users' },
  { label: 'Orders', path: '/admin/orders' },
  { label: 'Payments', path: '/admin/payments' },
  { label: 'Live Tracking', path: '/admin/tracking' },
  { label: 'System Settings', path: '/admin/settings' },
  { label: 'Reports', path: '/admin/reports' },
  { label: 'Support', path: '/admin/support' },
  { label: 'Content', path: '/admin/content' },
  { label: 'Audit Logs', path: '/admin/logs' },
];

const LiveTracking = () => {
  const [selectedRider, setSelectedRider] = useState(null);
  const [riderLocations, setRiderLocations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realTimeRiderLocations, setRealTimeRiderLocations] = useState(new Map());
  
  // Connect to socket for real-time updates
  const socket = useSocket();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [riders, ord, s] = await Promise.all([
          adminApi.getRiderLocations(),
          ordersApi.list(),
          catalogApi.getShops(),
        ]);
        setRiderLocations(riders || []);
        setOrders(Array.isArray(ord) ? ord : (ord?.orders || []));
        setShops(Array.isArray(s) ? s : (s?.shops || []));
      } catch {
        setRiderLocations([]);
        setOrders([]);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    
    // Reduce polling frequency since we have real-time updates
    const interval = setInterval(fetch, 30000); // Every 30 seconds instead of 5
    return () => clearInterval(interval);
  }, []);
  
  // Listen for real-time rider location updates
  useEffect(() => {
    if (!socket) return;
    
    const handleRiderLocation = (data) => {
      setRealTimeRiderLocations(prev => {
        const newMap = new Map(prev);
        newMap.set(data.riderId, {
          ...data.location,
          timestamp: data.timestamp || new Date()
        });
        return newMap;
      });
    };
    
    socket.on('rider_location', handleRiderLocation);
    
    return () => {
      socket.off('rider_location', handleRiderLocation);
    };
  }, [socket]);

  // Combine static and real-time rider locations
  const onlineRiders = (riderLocations || []).map(rider => {
    const realTimeLocation = realTimeRiderLocations.get(rider.id);
    return realTimeLocation ? { ...rider, location: realTimeLocation } : rider;
  });
  
  const activeOrders = (orders || []).filter((o) => !['Delivered', 'Cancelled'].includes(o.status));

  const centerLat = onlineRiders.length > 0
    ? (onlineRiders || []).reduce((sum, r) => sum + (r?.location?.lat || 0), 0) / onlineRiders.length
    : 37.7749;
  const centerLng = onlineRiders.length > 0
    ? (onlineRiders || []).reduce((sum, r) => sum + (r?.location?.lng || 0), 0) / onlineRiders.length
    : -122.4194;

  if (loading) return <Loader label="Loading..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-slate-900">Live Tracking Panel</h1>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Updates
            </span>
          </div>
          <p className="text-sm text-slate-500">Real-time global view of all active riders and ongoing deliveries</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Online Riders</p>
            <p className="text-3xl font-semibold text-slate-900">{onlineRiders.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Active Orders</p>
            <p className="text-3xl font-semibold text-slate-900">{activeOrders.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Total Riders</p>
            <p className="text-3xl font-semibold text-slate-900">{onlineRiders.length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Hotspots</p>
            <p className="text-3xl font-semibold text-slate-900">3</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Global Map View</h2>
            <Button variant="secondary" onClick={() => setSelectedRider(null)}>Reset View</Button>
          </div>
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={selectedRider ? 15 : 12}
            style={{ height: '600px', borderRadius: '16px', overflow: 'hidden' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {onlineRiders.map((rider) => (
              <Marker
                key={rider.id}
                position={[rider.location?.lat || 37.7749, rider.location?.lng || -122.4194]}
                eventHandlers={{ click: () => setSelectedRider(rider) }}
              >
                <Popup>
                  <div>
                    <p className="font-semibold">{rider.name}</p>
                    <p className="text-sm">{typeof rider.vehicle === 'object' ? rider.vehicle?.type : rider.vehicle}</p>
                    <p className="text-xs text-slate-500">{rider.isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {shops.map((shop) => (
              <Marker key={shop.id} position={[shop.location?.lat || 37.7749, shop.location?.lng || -122.4194]}>
                <Popup>
                  <div>
                    <p className="font-semibold">{shop.name}</p>
                    <p className="text-xs text-slate-500">Shop</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Active Riders</h2>
          <div className="space-y-3">
            {onlineRiders.map((rider) => {
              const assignedOrder = activeOrders.find((o) => o.riderId === rider.id);
              return (
                <div
                  key={rider.id}
                  className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-colors ${selectedRider?.id === rider.id ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'}`}
                  onClick={() => setSelectedRider(rider)}
                >
                  <div>
                    <p className="font-semibold text-slate-900">{rider.name}</p>
                    <p className="text-sm text-slate-500">{typeof rider.vehicle === 'object' ? rider.vehicle?.type : rider.vehicle} - {assignedOrder ? `Order ${assignedOrder.id}` : 'Available'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {(rider.location?.lat || 0).toFixed(4)}, {(rider.location?.lng || 0).toFixed(4)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Order Hotspots</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {(Array.isArray(shops) ? shops.slice(0, 3) : []).map((shop) => {
              const shopOrders = activeOrders.filter((o) => o.shopId === shop.id);
              return (
                <div key={shop.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{shop.name}</p>
                  <p className="text-sm text-slate-500">{shop.address}</p>
                  <p className="text-lg font-semibold text-primary mt-2">{shopOrders.length} active {shopOrders.length === 1 ? 'order' : 'orders'}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;

