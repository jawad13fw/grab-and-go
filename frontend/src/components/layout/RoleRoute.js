import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { normalizeAllowedRoles, normalizeRole } from '../../utils/roles';

const RoleRoute = ({ allowedRoles, children }) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const location = useLocation();
  const normalizedRole = normalizeRole(currentUser?.role);
  const normalizedAllowedRoles = normalizeAllowedRoles(allowedRoles);

  // Check if user is logged in
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Check if user's role is allowed
  if (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole)) {
    // Redirect based on user role
    const roleRedirects = {
      Customer: '/home',
      Vendor: '/vendor/dashboard',
      Rider: '/rider/dashboard',
      Admin: '/admin/dashboard',
    };
    const redirectPath = roleRedirects[normalizedRole] || '/home';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleRoute;

