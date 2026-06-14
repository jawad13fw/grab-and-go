import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { authApi } from '../api/endpoints';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setStatus(null);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setStatus({ success: true, message: res.message });
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err) {
      setStatus({ success: false, message: err.response?.data?.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Account Recovery</p>
        <h1 className="text-3xl font-semibold text-slate-900">Forgot Password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            required
            value={email}
            autoComplete="email"
            placeholder="name@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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

        {resetToken && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold mb-2">Reset Token (Demo Mode)</p>
            <p className="text-xs mb-2">Email is not configured. Use this token to reset your password:</p>
            <Link
              to={`/reset-password?token=${resetToken}`}
              className="inline-block rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Reset Password Now
            </Link>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-primary">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
