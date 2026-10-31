import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md rounded-xl bg-white border border-[#E2E8F0] shadow-xl overflow-hidden p-6 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 text-[#DC2626] border border-red-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-[#64748B] hover:text-[#172033] rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-semibold text-[#172033]">{title}</h3>
          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">{message}</p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
