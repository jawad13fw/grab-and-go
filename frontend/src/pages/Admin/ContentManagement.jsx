import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { contentApi } from '../../api/endpoints';

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

const ContentManagement = () => {
  const [content, setContent] = useState({ faqs: [], terms: '', privacy: '', helpCenter: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editorValue, setEditorValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    contentApi.list?.().then((data) => {
      // admin returns { success: true, content: { faqs, terms, privacy, helpCenter } }
      const payload = data?.content || data || {};
      setContent(payload);
    }).catch(() => setContent({ faqs: [], terms: '', privacy: '', helpCenter: '' })).finally(() => setLoading(false));
  }, []);

  const openEditor = (type) => {
    setEditing(type);
    const current = content[type] || '';
    // If it's JSON-ish (faqs), stringify for editing
    setEditorValue(typeof current === 'string' ? current : JSON.stringify(current, null, 2));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      let parsed = editorValue;
      // try parsing JSON for non-string content
      if (editing === 'faqs') {
        parsed = JSON.parse(editorValue);
      }
      await contentApi.upsert(editing, parsed);
      // refresh local content
      const refreshed = await contentApi.list();
      const payload = refreshed?.content || refreshed || {};
      setContent(payload);
      setEditing(null);
      setIsModalOpen(false);
      alert('Content updated');
    } catch (err) {
      console.error(err);
      alert('Failed to save content. Check payload format.');
    }
  };

  if (loading) return <Loader label="Loading content..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Content Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create, edit, and publish content shown across the platform.</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Privacy Policy</p>
                <p className="text-sm text-slate-500">Editable privacy policy content</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => openEditor('privacy')}>Edit</Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Terms & Conditions</p>
                <p className="text-sm text-slate-500">Editable terms & conditions</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => openEditor('terms')}>Edit</Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Help Center / FAQs</p>
                <p className="text-sm text-slate-500">Edit FAQs (JSON array)</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => openEditor('faqs')}>Edit</Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Help Center Content</p>
                <p className="text-sm text-slate-500">Editable help center content</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => openEditor('helpCenter')}>Edit</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal title={`Edit ${editing || ''}`} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg" actions={(
        <>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </>
      )}>
        <div className="space-y-3">
          {editing === 'faqs' ? (
            <textarea className="w-full h-72 rounded border p-3 text-sm" value={editorValue} onChange={(e) => setEditorValue(e.target.value)} />
          ) : (
            <textarea className="w-full h-48 rounded border p-3 text-sm" value={editorValue} onChange={(e) => setEditorValue(e.target.value)} />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ContentManagement;

// Simple inline modal component usage relies on existing Modal component
