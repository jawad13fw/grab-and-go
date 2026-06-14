import { useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';

const riderRoutes = [
  { label: 'Dashboard', path: '/rider/dashboard' },
  { label: 'Available Orders', path: '/rider/available-orders' },
  { label: 'My Deliveries', path: '/rider/deliveries' },
  { label: 'Wallet', path: '/rider/wallet' },
  { label: 'Support', path: '/rider/support' },
  { label: 'Profile', path: '/rider/profile' },
];

const Support = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [reportType, setReportType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reportTypes = [
    { value: 'delivery_issue', label: 'Delivery Issue', icon: '📦' },
    { value: 'payment', label: 'Payment/Earnings', icon: '💳' },
    { value: 'app_issue', label: 'App Technical Issue', icon: '📱' },
    { value: 'safety', label: 'Safety Concern', icon: '🛡️' },
    { value: 'other', label: 'Other', icon: '❓' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReportType('');
      setSubject('');
      setDescription('');
      alert('Support request submitted successfully! We will get back to you soon.');
    }, 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={riderRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Rider Support</h1>
          <p className="text-slate-500">
            Get help with deliveries, payments, or any issues you're facing
          </p>
        </div>

        {/* Report Delivery Issue */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Report an Issue</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Issue Type
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                {reportTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setReportType(type.value)}
                    className={`rounded-2xl border-2 p-4 text-left transition-all ${
                      reportType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{type.icon}</span>
                    <p className="text-sm font-semibold text-slate-900">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Subject
              </label>
              <input
                type="text"
                placeholder="Brief description of the issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Description
              </label>
              <textarea
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows="5"
                placeholder="Please provide detailed information about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitted}>
              {submitted ? 'Submitting...' : 'Submit Report'}
            </Button>
          </form>
        </div>

        {/* Help Center */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Rider Help Center</h2>
          
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Delivery Guidelines</h3>
              <p className="text-sm text-slate-600">
                Learn about best practices for handling deliveries, customer interactions, and maintaining quality service.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Payment & Earnings</h3>
              <p className="text-sm text-slate-600">
                Understand how earnings are calculated, when payments are processed, and how to request withdrawals.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Safety & Security</h3>
              <p className="text-sm text-slate-600">
                Important safety guidelines, emergency contacts, and how to report safety concerns.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-2">App Features</h3>
              <p className="text-sm text-slate-600">
                Get help with navigation, order management, and using app features effectively.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Contact</h2>
          
          <div className="grid gap-3 md:grid-cols-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => window.open('tel:+923000000000')}
            >
              Call Support
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => window.open('mailto:ridersupport@grabgo.app')}
            >
              Email Support
            </Button>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              <strong>Support Hours:</strong> 24/7 for urgent issues<br />
              <strong>Response Time:</strong> Within 2 hours for non-urgent inquiries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
