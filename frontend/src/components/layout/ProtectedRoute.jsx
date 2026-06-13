import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { normalizeAllowedRoles, normalizeRole } from '../../utils/roles';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles?.length) {
    const normalizedRole = normalizeRole(currentUser?.role);
    const normalizedAllowedRoles = normalizeAllowedRoles(allowedRoles);

    if (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole)) {
      const roleRedirects = {
        Customer: '/home',
        Vendor: '/vendor/dashboard',
        Rider: '/rider/dashboard',
        Admin: '/admin/dashboard',
      };
      return <Navigate to={roleRedirects[normalizedRole] || '/home'} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
