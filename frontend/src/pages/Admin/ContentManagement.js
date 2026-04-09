import { useEffect, useState } from 'react';
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

const ContentManagement = () => {
  const { content, loadContent, updateContent, addLog } = useAdminStore();
  const [activeTab, setActiveTab] = useState('faqs');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [terms, setTerms] = useState(content.terms || '');
  const [privacy, setPrivacy] = useState(content.privacy || '');
  const [helpCenter, setHelpCenter] = useState(content.helpCenter || '');

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    setTerms(content.terms || '');
    setPrivacy(content.privacy || '');
    setHelpCenter(content.helpCenter || '');
  }, [content]);

  const handleAddFAQ = async () => {
    if (faqQuestion && faqAnswer) {
      const newFAQ = { id: Date.now(), question: faqQuestion, answer: faqAnswer };
      const response = await updateContent('faqs', [...(content.faqs || []), newFAQ]);
      if (!response.success) {
        alert(response.message || 'Failed to add FAQ');
        return;
      }
      addLog({
        type: 'content_action',
        action: 'add_faq',
        faqId: newFAQ.id,
      });
      setFaqQuestion('');
      setFaqAnswer('');
      alert('FAQ added successfully');
    }
  };

  const handleSaveTerms = async () => {
    const response = await updateContent('terms', terms);
    if (!response.success) {
      alert(response.message || 'Failed to save terms');
      return;
    }
    addLog({
      type: 'content_action',
      action: 'update_terms',
    });
    alert('Terms & Conditions updated');
  };

  const handleSavePrivacy = async () => {
    const response = await updateContent('privacy', privacy);
    if (!response.success) {
      alert(response.message || 'Failed to save privacy policy');
      return;
    }
    addLog({
      type: 'content_action',
      action: 'update_privacy',
    });
    alert('Privacy Policy updated');
  };

  const handleSaveHelpCenter = async () => {
    const response = await updateContent('helpCenter', helpCenter);
    if (!response.success) {
      alert(response.message || 'Failed to save help center');
      return;
    }
    addLog({
      type: 'content_action',
      action: 'update_help_center',
    });
    alert('Help Center content updated');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <Sidebar routes={adminRoutes} />
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">Content Management</h1>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            {['faqs', 'terms', 'privacy', 'help'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab === 'help' ? 'Help Center' : tab === 'terms' ? 'Terms & Conditions' : tab === 'privacy' ? 'Privacy Policy' : 'FAQs'}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Add New FAQ</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Question</label>
                  <input
                    type="text"
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    placeholder="Enter FAQ question"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Answer</label>
                  <textarea
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    placeholder="Enter FAQ answer"
                    rows="4"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button onClick={handleAddFAQ}>Add FAQ</Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Existing FAQs</h2>
              <div className="space-y-4">
                {(content.faqs || []).length === 0 ? (
                  <p className="text-slate-500">No FAQs added yet</p>
                ) : (
                  content.faqs.map((faq) => (
                    <div key={faq.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900 mb-2">{faq.question}</p>
                      <p className="text-sm text-slate-600">{faq.answer}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Terms & Conditions Tab */}
        {activeTab === 'terms' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Terms & Conditions</h2>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Enter Terms & Conditions content..."
              rows="20"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button onClick={handleSaveTerms} className="mt-4">Save Changes</Button>
          </div>
        )}

        {/* Privacy Policy Tab */}
        {activeTab === 'privacy' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Privacy Policy</h2>
            <textarea
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              placeholder="Enter Privacy Policy content..."
              rows="20"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button onClick={handleSavePrivacy} className="mt-4">Save Changes</Button>
          </div>
        )}

        {/* Help Center Tab */}
        {activeTab === 'help' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Help Center Content</h2>
            <textarea
              value={helpCenter}
              onChange={(e) => setHelpCenter(e.target.value)}
              placeholder="Enter Help Center content..."
              rows="20"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button onClick={handleSaveHelpCenter} className="mt-4">Save Changes</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentManagement;





