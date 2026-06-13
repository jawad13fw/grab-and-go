import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import useAdminStore from '../../store/adminStore';

const adminRoutes = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'User Management', path: '/admin/users' },
  { label: 'Orders', path: '/admin/orders' },
  { label: 'Payments', path: '/admin/payments' },
  { label: 'Live Tracking', path: '/admin/tracking' },
  { label: 'System Settings', path: '/admin/settings' },
  { label: 'Reports', path: '/admin/reports' },
  { label: 'Support', path: '/admin/support' },
  { label: 'Content', path: '/admin/content' },
  { label: 'Audit Logs', path: '/admin/logs' },
];

const AuditLogs = () => {
  const { logs, fetchLogs, loadLogs } = useAdminStore();

  const [filter, setFilter] = useState('all');
  const [logType, setLogType] = useState('all');

  const normalizedLogs = Array.isArray(logs)
    ? logs
    : (logs && Array.isArray(logs.logs) ? logs.logs : []);




  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    // Safety: some store versions expose `loadLogs` instead of `fetchLogs`
    if (typeof loadLogs === 'function') loadLogs();
  }, [loadLogs]);


  const getLogTimestamp = (log) => log.timestamp ?? log.createdAt ?? log.time;

  const allLogs = [...normalizedLogs].sort(
    (a, b) => new Date(getLogTimestamp(b)) - new Date(getLogTimestamp(a))
  );



  const filteredLogs = allLogs.filter((log) => {
    if (logType !== 'all') {
      // backend may store type as `type` or `actionType`
      const t = log.type ?? log.actionType;
      if (t !== logType) return false;
    }
    return true;
  });


  const logTypes = ['all', 'user_action', 'order_action', 'payment_action', 'settings_action', 'login', 'support_action', 'content_action'];

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getLogDescription = (log) => {
    switch (log.type) {
      case 'user_action':
        return `${log.action.replace(/_/g, ' ')} - User: ${log.userId || log.riderId || log.shopId}`;
      case 'order_action':
        return `${log.action.replace(/_/g, ' ')} - Order: ${log.orderId}${log.newStatus ? ` -> ${log.newStatus}` : ''}`;
      case 'payment_action':
        return `${log.action.replace(/_/g, ' ')} - Request: ${log.requestId || log.shopId}`;
      case 'settings_action':
        return `${log.action.replace(/_/g, ' ')}`;
      case 'login':
        return `Login - User: ${log.userId}${log.ip ? ` from ${log.ip}` : ''}`;
      case 'support_action':
        return `${log.action.replace(/_/g, ' ')} - Ticket: ${log.ticketId}`;
      case 'content_action':
        return `${log.action.replace(/_/g, ' ')}`;
      default:
        return JSON.stringify(log);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-slate-900">Logs & Audit Trails</h1>
            <Button variant="secondary" onClick={() => window.print()}>
              Export Logs
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {logTypes.map((type) => (
              <button
                key={type}
                onClick={() => setLogType(type)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                  logType === type
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">{formatTimestamp(getLogTimestamp(log))}</td>

                    <td className="px-6 py-4">

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {(log.type ?? log.actionType ?? 'unknown').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">{log.action?.replace(/_/g, ' ') || 'N/A'}</td>
                      <td className="px-6 py-4">{getLogDescription(log)}</td>
                      <td className="px-6 py-4">{log.adminId || 'System'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Log Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Total Logs</p>
            <p className="text-3xl font-semibold text-slate-900">{allLogs.length}</p>

          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">User Actions</p>
            <p className="text-3xl font-semibold text-slate-900">
              {allLogs.filter((l) => l.type === 'user_action').length}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Order Actions</p>
            <p className="text-3xl font-semibold text-slate-900">
              {allLogs.filter((l) => l.type === 'order_action').length}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1">Payment Actions</p>
            <p className="text-3xl font-semibold text-slate-900">
              {allLogs.filter((l) => l.type === 'payment_action').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
