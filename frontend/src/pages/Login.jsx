import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useAuthStore from '../store/authStore';
import { normalizeRole } from '../utils/roles';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultRouteByRole = {
    Customer: '/home',
    Vendor: '/vendor/dashboard',
    Rider: '/rider/dashboard',
    Admin: '/admin/dashboard',
  };

  const validateField = (name, value) => {
    const nextValue = typeof value === 'string' ? value.trim() : value;

    if (name === 'email') {
      if (!nextValue) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextValue)) return 'Enter a valid email address.';
      return '';
    }

    if (name === 'password') {
      if (!nextValue) return 'Password is required.';
      if (nextValue.length < 8) return 'Password must be at least 8 characters.';
      return '';
    }

    return '';
  };

  const validateForm = () => {
    const nextErrors = {
      email: validateField('email', form.email),
      password: validateField('password', form.password),
    };

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key]) {
        delete nextErrors[key];
      }
    });

    setFieldErrors(nextErrors);
    setTouched({ email: true, password: true });
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const response = await login(form);
    setStatus(response);
    setIsSubmitting(false);
    if (response.success) {
      const normalizedRole = normalizeRole(response?.user?.role);
      const redirectTarget =
        location.state?.from || defaultRouteByRole[normalizedRole] || '/home';
      setTimeout(() => navigate(redirectTarget, { replace: true }), 700);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Welcome back</p>
        <h1 className="text-3xl font-semibold text-slate-900">Login</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            autoComplete="email"
            inputMode="email"
            placeholder="name@example.com"
            error={fieldErrors.email}
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({ ...prev, email: value }));
              if (touched.email) {
                setFieldErrors((prev) => ({ ...prev, email: validateField('email', value) }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, email: true }));
              setFieldErrors((prev) => ({ ...prev, email: validateField('email', form.email) }));
            }}
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            required
            value={form.password}
            autoComplete="current-password"
            error={fieldErrors.password}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-slate-500 transition-colors hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            }
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({ ...prev, password: value }));
              if (touched.password) {
                setFieldErrors((prev) => ({ ...prev, password: validateField('password', value) }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, password: true }));
              setFieldErrors((prev) => ({ ...prev, password: validateField('password', form.password) }));
            }}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
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
            <p>{status.message || (status.success ? 'Login successful!' : 'Unable to sign in')}</p>
            {status.hint && !status.success && (
              <p className="mt-1 text-xs opacity-80">Info: {status.hint}</p>
            )}
            {status.errors && status.errors.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
                {status.errors.map((e, i) => (
                  <li key={i}><span className="font-medium">{e.field}</span>: {e.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <p className="mt-4 text-center text-sm text-slate-500">
          Don't have an account${' '}
          <Link to="/register" className="font-semibold text-primary">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
