import { useEffect, useRef, useState } from 'react';
import useTrackingStore from '../store/trackingStore';
import { useRiderLocation } from './useSocket';
import { DEFAULT_MAP_LOCATION, normalizeLocation, normalizeLocationOrDefault } from '../utils/location';

const distanceMeters = (pointA, pointB) => {
  if (!pointA || !pointB) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusM = 6371000;
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);
  const lat1 = toRad(pointA.lat);
  const lat2 = toRad(pointB.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusM * c;
};

const useLiveLocation = (riderId, initialLocation, orderId = null) => {
  const [location, setLocation] = useState(() => normalizeLocationOrDefault(initialLocation));
  const setRiderLocation = useTrackingStore((state) => state.setRiderLocation);
  const lastSentAtRef = useRef(0);
  const lastSentLocationRef = useRef(null);
  const latestLocationRef = useRef(normalizeLocationOrDefault(initialLocation));

  const { updateLocation } = useRiderLocation(riderId);

  useEffect(() => {
    const normalizedInitial = normalizeLocation(initialLocation);
    if (normalizedInitial) {
      setLocation(normalizedInitial);
    }
  }, [initialLocation]);
  
  useEffect(() => {
    const minSendIntervalMs = 3000;
    const minMovementMeters = 10;

    const shouldSendUpdate = (nextLocation) => {
      const now = Date.now();
      if (!lastSentAtRef.current) return true;

      const elapsed = now - lastSentAtRef.current;
      if (elapsed >= minSendIntervalMs) return true;

      const movedMeters = distanceMeters(lastSentLocationRef.current, nextLocation);
      return Number.isFinite(movedMeters) && movedMeters >= minMovementMeters;
    };

    const emitLocation = (nextLocation, force = false) => {
      if (!nextLocation || !riderId) return;
      if (!force && !shouldSendUpdate(nextLocation)) return;

      updateLocation(nextLocation.lat, nextLocation.lng, orderId);
      lastSentAtRef.current = Date.now();
      lastSentLocationRef.current = nextLocation;
      latestLocationRef.current = nextLocation;
    };

    if (!riderId) return;
    const fallbackLocation = normalizeLocationOrDefault(location, DEFAULT_MAP_LOCATION);
    setRiderLocation(riderId, fallbackLocation);
    latestLocationRef.current = fallbackLocation;

    const supportsGeolocation = typeof navigator !== 'undefined' && !!navigator.geolocation;

    if (!supportsGeolocation) {
      emitLocation(fallbackLocation, true);
      return;
    }

    emitLocation(fallbackLocation, true);

    const heartbeatInterval = setInterval(() => {
      emitLocation(latestLocationRef.current, true);
    }, 5000);

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
        latestLocationRef.current = nextLocation;
        emitLocation(nextLocation);
      },
      () => {
        emitLocation(fallbackLocation, true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );

    return () => {
      clearInterval(heartbeatInterval);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [riderId, orderId, setRiderLocation, updateLocation]);

  return location;
};

export default useLiveLocation;
