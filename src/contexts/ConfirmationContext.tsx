import React, { createContext, useContext, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmationContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  };

  const getIcon = () => {
    switch (options?.type) {
      case 'info':
        return (
          <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-xl text-blue-400 shrink-0">
            <Info className="h-6 w-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="p-3 bg-yellow-950/40 border border-yellow-900/60 rounded-xl text-yellow-400 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
        );
      case 'danger':
      default:
        return (
          <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-red-400 shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
        );
    }
  };

  const getConfirmButtonStyles = () => {
    switch (options?.type) {
      case 'info':
        return 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-500 focus:ring-yellow-500';
      case 'danger':
      default:
        return 'bg-red-600 hover:bg-red-500 focus:ring-red-500';
    }
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              id="confirmation-modal-container"
              className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden z-10"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {getIcon()}
                  <div className="flex-1 space-y-1">
                    <h3 id="confirmation-modal-title" className="text-lg font-bold text-slate-200">
                      {options.title}
                    </h3>
                    <p id="confirmation-modal-message" className="text-sm text-slate-400 leading-relaxed">
                      {options.message}
                    </p>
                  </div>
                  <button
                    onClick={handleCancel}
                    id="confirmation-modal-close-btn"
                    className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-800/80 pt-4">
                  <button
                    id="confirmation-modal-cancel-btn"
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    {options.cancelText || 'Cancelar'}
                  </button>
                  <button
                    id="confirmation-modal-confirm-btn"
                    type="button"
                    onClick={handleConfirm}
                    className={`px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-black/20 hover:shadow-black/40 cursor-pointer ${getConfirmButtonStyles()}`}
                  >
                    {options.confirmText || 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (context === undefined) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}
