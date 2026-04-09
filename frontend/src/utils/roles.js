const ROLE_MAP = {
  customer: 'Customer',
  vendor: 'Vendor',
  rider: 'Rider',
  admin: 'Admin'
};

export function normalizeRole(role) {
  const key = String(role || '').trim().toLowerCase();
  return ROLE_MAP[key] || null;
}

export function normalizeAllowedRoles(roles = []) {
  return roles
    .map((role) => normalizeRole(role))
    .filter(Boolean);
}
