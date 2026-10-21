import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, message }]);

    // Auto dismiss after 3.5s
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => showToast(message, 'success', title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast(message, 'error', title), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast(message, 'warning', title), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast(message, 'info', title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
                isSuccess
                  ? 'border-emerald-300 bg-emerald-50/95 text-emerald-950'
                  : isWarning
                  ? 'border-amber-300 bg-amber-50/95 text-amber-950'
                  : isError
                  ? 'border-rose-300 bg-rose-50/95 text-rose-950'
                  : 'border-blue-300 bg-blue-50/95 text-blue-950'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                {isWarning && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                {isError && <AlertCircle className="h-5 w-5 text-rose-600" />}
                {!isSuccess && !isWarning && !isError && <Info className="h-5 w-5 text-blue-600" />}
              </div>

              <div className="flex-1 text-xs">
                {toast.title && <div className="font-bold text-slate-900 mb-0.5">{toast.title}</div>}
                <div className="font-medium leading-relaxed">{toast.message}</div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-black/5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
