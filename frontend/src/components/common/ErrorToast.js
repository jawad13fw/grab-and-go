import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced ErrorToast - supports both simple string messages and rich
 * structured errors from the backend.
 *
 * Props:
 *   message     - string | { title, message, hint, errors[], code }
 *   type        - 'error' | 'success' | 'warning'
 *   onClose     - callback when toast is dismissed
 *   duration    - auto-dismiss time in ms (default 6000, 0 = sticky)
 */
const ErrorToast = ({ message, onClose, type = 'error', duration = 6000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          if (onClose) onClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [message, onClose, duration]);

  if (!message || !isVisible) return null;

  // Normalise - accept a plain string or structured object
  const isStructured = typeof message === 'object' && message !== null;
  const title = isStructured ? message.title : null;
  const text = isStructured ? message.message : message;
  const hint = isStructured ? message.hint : null;
  const fieldErrors = isStructured ? message.errors : null;

  const palette = {
    error: {
      bg: 'bg-rose-50 border-rose-200',
      title: 'text-rose-800',
      text: 'text-rose-700',
      hint: 'text-rose-500',
      icon: 'x',
      iconBg: 'bg-rose-100',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      title: 'text-amber-800',
      text: 'text-amber-700',
      hint: 'text-amber-500',
      icon: '!',
      iconBg: 'bg-amber-100',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200',
      title: 'text-emerald-800',
      text: 'text-emerald-700',
      hint: 'text-emerald-500',
      icon: 'OK',
      iconBg: 'bg-emerald-100',
    },
  };
  const p = palette[type] || palette.error;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
        className={`fixed top-4 right-4 z-50 rounded-xl border p-4 shadow-lg max-w-md ${p.bg} flex items-start gap-3`}
      >
        {/* Icon */}
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${p.iconBg} ${p.title}`}>
          {p.icon}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className={`text-sm font-semibold ${p.title}`}>{title}</p>
          )}
          <p className={`text-sm ${p.text} ${title ? 'mt-0.5' : ''}`}>{text}</p>

          {/* Field-level errors */}
          {fieldErrors && fieldErrors.length > 0 && (
            <ul className={`mt-2 space-y-1 text-xs ${p.text} list-disc list-inside`}>
              {fieldErrors.map((fe, i) => (
                <li key={i}>
                  <span className="font-medium">{formatFieldName(fe.field)}</span>: {fe.message}
                  {fe.hint && (
                    <span className={`block ml-4 ${p.hint} italic`}>{fe.hint}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Hint */}
          {hint && (
            <p className={`mt-1.5 text-xs ${p.hint}`}>
              Info: {hint}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
          className={`shrink-0 text-lg leading-none ${p.text} hover:opacity-70`}
          aria-label="Dismiss"
        >
          x
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

/**  camelCase / dot-path -> readable label */
const formatFieldName = (field) => {
  if (!field) return 'Field';
  const overrides = {
    'coordinates.lat': 'Latitude',
    'coordinates.lng': 'Longitude',
    shopRating: 'Shop rating',
    riderRating: 'Rider rating',
    cardNumber: 'Card number',
    cardHolder: 'Card holder',
    cvc: 'CVC',
  };
  if (overrides[field]) return overrides[field];
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
};

export default ErrorToast;

