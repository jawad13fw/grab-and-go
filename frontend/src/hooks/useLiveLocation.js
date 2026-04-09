import { useEffect, useState } from 'react';
import useTrackingStore from '../store/trackingStore';
import { useRiderLocation } from './useSocket';
import { DEFAULT_MAP_LOCATION, normalizeLocation, normalizeLocationOrDefault } from '../utils/location';

const useLiveLocation = (riderId, initialLocation, orderId = null) => {
  const [location, setLocation] = useState(() => normalizeLocationOrDefault(initialLocation));
  const setRiderLocation = useTrackingStore((state) => state.setRiderLocation);

  const { updateLocation } = useRiderLocation(riderId);

  useEffect(() => {
    const normalizedInitial = normalizeLocation(initialLocation);
    if (normalizedInitial) {
      setLocation(normalizedInitial);
    }
  }, [initialLocation]);
  
  useEffect(() => {
    if (!riderId) return;
    const fallbackLocation = normalizeLocationOrDefault(location, DEFAULT_MAP_LOCATION);
    setRiderLocation(riderId, fallbackLocation);

    const supportsGeolocation = typeof navigator !== 'undefined' && !!navigator.geolocation;

    if (!supportsGeolocation) {
      updateLocation(fallbackLocation.lat, fallbackLocation.lng, orderId);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
        };

        if (!Number.isFinite(nextLocation.lat) || !Number.isFinite(nextLocation.lng)) {
          return;
        }

        setLocation(nextLocation);
        setRiderLocation(riderId, nextLocation);
        updateLocation(nextLocation.lat, nextLocation.lng, orderId);
      },
      () => {
        updateLocation(fallbackLocation.lat, fallbackLocation.lng, orderId);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [riderId, orderId, setRiderLocation, updateLocation]);

  return location;
};

export default useLiveLocation;
