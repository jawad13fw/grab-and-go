import { useNavigate } from 'react-router-dom';
import Button from './Button';

const AuthPromptModal = ({ open, title, message, onClose }) => {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-900">{title || 'Login required'}</h3>
          <p className="text-sm text-slate-600">
            {message || 'You can browse freely, but you need an account to place an order.'}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button className="w-full flex-1" onClick={() => { onClose?.(); navigate('/login'); }}>
            Login
          </Button>
          <Button variant="secondary" className="w-full flex-1" onClick={() => { onClose?.(); navigate('/register'); }}>
            Register
          </Button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Continue browsing
        </button>
      </div>
    </div>
  );
};

export default AuthPromptModal;
