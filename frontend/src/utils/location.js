export const DEFAULT_MAP_LOCATION = {
  lat: 30.0444,
  lng: 72.3565,
};

function toFiniteNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function normalizeLocation(input) {
  if (!input || typeof input !== 'object') return null;

  const source = input.coordinates && typeof input.coordinates === 'object'
    ? input.coordinates
    : input;

  const lat = toFiniteNumber(source.lat ?? source.latitude);
  const lng = toFiniteNumber(source.lng ?? source.lon ?? source.longitude ?? source.long);

  if (lat === null || lng === null) return null;
  return { lat, lng };
}

export function normalizeLocationOrDefault(input, fallback = DEFAULT_MAP_LOCATION) {
  return normalizeLocation(input) || fallback;
}
