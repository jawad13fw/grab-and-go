import { useState } from 'react';
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

const Support = () => {
  const { tickets, updateTicket, addLog } = useAdminStore();
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  // Use only real tickets from store
  const allTickets = tickets || [];
  const filteredTickets =
    filter === 'all'
      ? allTickets
      : allTickets.filter((t) => t.status === filter);

  const handleAssignStaff = (ticketId) => {
    const staff = window.prompt('Enter staff member name:');
    if (staff) {
      updateTicket(ticketId, { assignedTo: staff, status: 'in_progress' });
      addLog({
        type: 'support_action',
        action: 'assign_ticket',
        ticketId,
        staff,
      });
      alert('Ticket assigned successfully');
    }
  };

  const handleResolveTicket = (ticketId) => {
    if (adminNote) {
      updateTicket(ticketId, { status: 'resolved', adminNote });
      addLog({
        type: 'support_action',
        action: 'resolve_ticket',
        ticketId,
      });
      alert('Ticket resolved');
      setSelectedTicket(null);
      setAdminNote('');
    } else {
      alert('Please add admin notes before resolving');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">Complaints & Support Management</h1>
          
          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'open', 'in_progress', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status} ({allTickets.filter((t) => status === 'all' || t.status === status).length})
              </button>
            ))}
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                        ticket.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : ticket.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {ticket.status}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        ticket.priority === 'high'
                          ? 'bg-rose-100 text-rose-700'
                          : ticket.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ticket.priority} priority
                    </span>
                    <span className="text-xs text-slate-500">
                      {ticket.submittedBy} - {ticket.userName}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{ticket.subject}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{ticket.description}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignStaff(ticket.id);
                    }}
                  >
                    Assign
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTicket(ticket);
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Ticket Details</h2>
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setAdminNote('');
                  }}
                  className="text-slate-500 hover:text-slate-900"
                >
                  x
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Subject</p>
                  <p className="font-semibold text-slate-900">{selectedTicket.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="text-slate-900">{selectedTicket.description}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Submitted By</p>
                  <p className="font-semibold text-slate-900">
                    {selectedTicket.userName} ({selectedTicket.submittedBy})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-2">Add Admin Note</p>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Enter admin notes or resolution details..."
                    rows="4"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={() => handleResolveTicket(selectedTicket.id)}
                    className="flex-1"
                  >
                    Mark as Resolved
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleAssignStaff(selectedTicket.id)}
                    className="flex-1"
                  >
                    Assign to Staff
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;





