// ============================================================
// NumaLex — Système de Toast Notifications
// Léger, sans dépendance externe. Utilisable partout.
// ============================================================

'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Conteneur de toasts — coin supérieur droit */}
      {toasts.length > 0 && (
        <div
          className="fixed right-4 top-4 z-50 flex flex-col gap-2"
          aria-live="polite"
          aria-label="Notifications"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`animate-slide-up flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${TOAST_STYLES[t.type]}`}
              role="alert"
            >
              <span className="mt-0.5 text-base">{TOAST_ICONS[t.type]}</span>
              <p className="flex-1 text-sm font-medium">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-2 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
                aria-label="Fermer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50/95 text-emerald-800',
  error: 'border-red-200 bg-red-50/95 text-red-800',
  info: 'border-blue-200 bg-blue-50/95 text-blue-800',
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};
