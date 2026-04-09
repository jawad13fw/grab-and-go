// This file is replaced by UserManagement.js
// Keeping for backward compatibility - redirects to UserManagement
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminUsers = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin/users', { replace: true });
  }, [navigate]);
  return null;
};

export default AdminUsers;

