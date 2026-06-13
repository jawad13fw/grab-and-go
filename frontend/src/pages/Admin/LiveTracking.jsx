import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Loader from '../../components/common/Loader';
import { adminApi } from '../../api/endpoints';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';


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
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Backend endpoint: GET `/api/admin/rider-locations`
    adminApi
      .getRiderLocations()
      .then((data) => {
        // backend returns an array of riders (or an array-like)
        setRiders(Array.isArray(data) ? data : []);
      })
      .catch(() => setRiders([]))
      .finally(() => setLoading(false));
  }, []);


  if (loading) return <Loader label="Loading live positions..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Live Rider Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor rider locations and statuses in real-time.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {riders.length === 0 ? (
            <p className="text-slate-500">No rider locations available.</p>
          ) : (
            (() => {
              const center =
                (riders[0]?.location && [riders[0].location.lat, riders[0].location.lng]) || [24.8607, 67.0011];

              return (
                <MapContainer center={center} zoom={12} style={{ height: 500 }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {riders.map((r) => {
                    const lat = r.location?.lat;
                    const lng = r.location?.lng;
                    if (!lat && !lng) return null;
                    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;

                    const key = r.id || r._id || `${lat},${lng}`;
                    const popup = r.name || r.phone || `Rider ${key}`;

                    return (
                      <Marker key={key} position={[Number(lat), Number(lng)]}>
                        <Popup>{popup}</Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              );
            })()
          )}

        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
