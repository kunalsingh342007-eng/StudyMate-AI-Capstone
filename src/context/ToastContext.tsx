import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X, RotateCcw } from 'lucide-react';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
  action?: ToastAction;
}

interface ToastRecord extends ToastOptions {
  id: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (
    optionsOrTitle: ToastOptions | string,
    variant?: ToastVariant,
    action?: ToastAction
  ) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => '',
  dismissToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      optionsOrTitle: ToastOptions | string,
      variantArg?: ToastVariant,
      actionArg?: ToastAction
    ) => {
      const options: ToastOptions =
        typeof optionsOrTitle === 'string'
          ? { title: optionsOrTitle, variant: variantArg, action: actionArg }
          : optionsOrTitle;

      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const variant: ToastVariant = options.variant || 'info';
      const durationMs = options.durationMs ?? (options.action ? 6500 : 4000);

      setToasts((prev) => [...prev.slice(-2), { ...options, id, variant }]);

      if (durationMs > 0) {
        timersRef.current[id] = setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }

      return id;
    },
    [dismissToast]
  );

  const variantStyles: Record<ToastVariant, { container: string; icon: React.ReactNode }> = {
    success: {
      container:
        'bg-[#FFFFFF] dark:bg-[#0F1D32] border-[#0D9488]/30 dark:border-teal-500/40 text-slate-900 dark:text-slate-100',
      icon: <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />,
    },
    info: {
      container:
        'bg-[#FFFFFF] dark:bg-[#0F1D32] border-[#E5E1D6] dark:border-[#1E2F47] text-slate-900 dark:text-slate-100',
      icon: <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />,
    },
    warning: {
      container:
        'bg-[#FFFFFF] dark:bg-[#0F1D32] border-amber-300 dark:border-amber-500/40 text-slate-900 dark:text-slate-100',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
    },
    error: {
      container:
        'bg-[#FFFFFF] dark:bg-[#0F1D32] border-rose-300 dark:border-rose-500/40 text-slate-900 dark:text-slate-100',
      icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
    },
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Accessible live region for non-blocking studio feedback & Undo actions */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const style = variantStyles[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto rounded-xl border shadow-lg px-4 py-3 flex items-start gap-3 transition-all ${style.container}`}
            >
              <div className="mt-0.5">{style.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-snug">{toast.title}</p>
                {toast.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {toast.description}
                  </p>
                )}
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      dismissToast(toast.id);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200 underline underline-offset-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{toast.action.label}</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16263D] transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
