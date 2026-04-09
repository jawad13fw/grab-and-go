import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useAuthStore from '../store/authStore';

const roles = ['Customer', 'Vendor', 'Rider'];

const Register = () => {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: roles[0],
  });
  const [status, setStatus] = useState(null);

  const defaultRouteByRole = {
    Customer: '/home',
    Vendor: '/vendor/dashboard',
    Rider: '/rider/dashboard',
    Admin: '/admin/dashboard',
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null); // Clear previous status
    
    const response = await register(form);
    setStatus(response);
    if (response.success) {
      // Use message from backend if available, otherwise show default
      setStatus({
        success: true,
        message: response.message || `Registration successful! Welcome, ${response.user.name}. A confirmation email has been sent to ${form.email}. Please verify your account.`
      });
      
      const redirectTarget = defaultRouteByRole[response.user.role] || '/home';
      setTimeout(() => navigate(redirectTarget, { replace: true }), 1500);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Join the marketplace</p>
        <h1 className="text-3xl font-semibold text-slate-900">Create account</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Full name"
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <Input
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            minLength="8"  // Add minimum length to match backend validation
          />
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            <span className="font-medium text-slate-800">Role</span>
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
        {status && (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              status.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {status.title && !status.success && (
              <p className="font-semibold mb-1">{status.title}</p>
            )}
            <p>{status.message || (status.success ? 'Account created' : 'Unable to register')}</p>
            {status.hint && !status.success && (
              <p className="mt-1 text-xs opacity-80">Info: {status.hint}</p>
            )}
            {status.errors && status.errors.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
                {status.errors.map((e, i) => (
                  <li key={i}>
                    <span className="font-medium">{e.field}</span>: {e.message}
                    {e.hint && <span className="block ml-4 opacity-70 italic">{e.hint}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account${' '}
          <Link to="/login" className="font-semibold text-primary">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;


