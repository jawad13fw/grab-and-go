import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
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
    confirmPassword: '',
    role: roles[0],
  });
  const [status, setStatus] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultRouteByRole = {
    Customer: '/home',
    Vendor: '/vendor/dashboard',
    Rider: '/rider/dashboard',
    Admin: '/admin/dashboard',
  };

  const getPasswordChecks = (password) => {
    const value = password || '';
    return [
      { label: 'At least 8 characters', passed: value.length >= 8 },
      { label: 'One uppercase letter', passed: /[A-Z]/.test(value) },
      { label: 'One lowercase letter', passed: /[a-z]/.test(value) },
      { label: 'One number', passed: /\d/.test(value) },
      { label: 'One special character', passed: /[^A-Za-z0-9]/.test(value) },
    ];
  };

  const validateField = (name, value = form[name]) => {
    const nextValue = typeof value === 'string' ? value : '';

    if (name === 'name') {
      if (!nextValue.trim()) return 'Name is required.';
      if (nextValue.trim().length < 2) return 'Name should be at least 2 characters.';
      return '';
    }

    if (name === 'email') {
      const trimmedValue = nextValue.trim();
      if (!trimmedValue) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) return 'Enter a valid email address.';
      return '';
    }

    if (name === 'password') {
      if (!nextValue) return 'Password is required.';
      const passwordChecks = getPasswordChecks(nextValue);
      const failedChecks = passwordChecks.filter((check) => !check.passed);
      if (failedChecks.length > 0) {
        return 'Password must include uppercase, lowercase, a number, a symbol, and be 8+ characters.';
      }
      return '';
    }

    if (name === 'confirmPassword') {
      if (!nextValue) return 'Please confirm your password.';
      if (nextValue !== form.password) return 'Passwords do not match.';
      return '';
    }

    return '';
  };

  const validateForm = () => {
    const nextErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
      confirmPassword: validateField('confirmPassword', form.confirmPassword),
    };

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key]) {
        delete nextErrors[key];
      }
    });

    setFieldErrors(nextErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    return Object.keys(nextErrors).length === 0;
  };

  const passwordRequirementsVisible = touched.password && Boolean(fieldErrors.password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null); // Clear previous status

    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    const response = await register({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    });
    setStatus(response);
    setIsSubmitting(false);
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
            autoComplete="name"
            placeholder="Jane Doe"
            error={fieldErrors.name}
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({ ...prev, name: value }));
              if (touched.name) {
                setFieldErrors((prev) => ({ ...prev, name: validateField('name', value) }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, name: true }));
              setFieldErrors((prev) => ({ ...prev, name: validateField('name', form.name) }));
            }}
          />
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
            autoComplete="new-password"
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
          <Input
            label="Confirm password"
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={form.confirmPassword}
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="text-slate-500 transition-colors hover:text-slate-700"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            }
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({ ...prev, confirmPassword: value }));
              if (touched.confirmPassword || touched.password) {
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmPassword: validateField('confirmPassword', value),
                }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, confirmPassword: true }));
              setFieldErrors((prev) => ({ ...prev, confirmPassword: validateField('confirmPassword', form.confirmPassword) }));
            }}
          />
          {passwordRequirementsVisible && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <p className="mb-2 font-semibold text-slate-800">Password requirements</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {getPasswordChecks(form.password).map((check) => (
                  <li key={check.label} className={check.passed ? 'text-emerald-700' : 'text-slate-500'}>
                    {check.passed ? '•' : '◦'} {check.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Register'}
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
