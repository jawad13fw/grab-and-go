import { motion, AnimatePresence } from 'framer-motion';

const SIZE_CLASSES = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal = ({ title, isOpen, onClose, children, actions, size = 'md' }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 pt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md} max-h-[92vh] overflow-hidden rounded-2xl bg-white p-6 shadow-xl`}
          initial={{ scale: 0.9, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <div className="flex items-start justify-between pb-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              x
            </button>
          </div>
          <div className="max-h-[calc(92vh-8rem)] overflow-y-auto pr-1 text-slate-600">{children}</div>
          {actions && <div className="mt-6 flex justify-end gap-3">{actions}</div>}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default Modal;
