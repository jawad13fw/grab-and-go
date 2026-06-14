import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { authApi } from '../api/endpoints';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
          <h1 className="text-2xl font-semibold text-rose-800">Invalid Link</h1>
          <p className="mt-2 text-sm text-rose-600">This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="mt-4 inline-block font-semibold text-primary hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (form.password.length < 8) {
      setStatus({ success: false, message: 'Password must be at least 8 characters.' });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.resetPassword(token, form.password);
      setStatus({ success: true, message: res.message || 'Password reset successfully!' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setStatus({ success: false, message: err.response?.data?.message || 'Failed to reset password. The link may have expired.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Set New Password</p>
        <h1 className="text-3xl font-semibold text-slate-900">Reset Password</h1>
        <p className="mt-2 text-sm text-slate-500">Enter your new password below.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            required
            value={form.password}
            placeholder="At least 8 characters"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            }
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            value={form.confirmPassword}
            placeholder="Repeat your new password"
            onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
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
            <p>{status.message}</p>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-primary">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
