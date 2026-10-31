import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastMessage = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#16834A] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-[#1769D2] shrink-0" />;
    }
  };

  const getToastBorder = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-[#16834A]';
      case 'error':
        return 'border-l-4 border-l-[#DC2626]';
      case 'warning':
        return 'border-l-4 border-l-[#D97706]';
      case 'info':
      default:
        return 'border-l-4 border-l-[#1769D2]';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {/* Toast Render Portal */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white border border-[#E2E8F0] shadow-lg rounded-xl text-xs text-[#172033] ${getToastBorder(
                t.type
              )}`}
              role="alert"
            >
              <div className="pt-0.5">{getToastIcon(t.type)}</div>
              <div className="flex-1 font-medium leading-relaxed">{t.message}</div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-[#94A3B8] hover:text-[#172033] p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
