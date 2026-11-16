import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { cx } from '../lib/cx';
import '../components/Toast.css';

type Tone = 'success' | 'error';

interface ToastValue {
  showToast(message: string, tone?: Tone): void;
}

const ToastContext = createContext<ToastValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; tone: Tone } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string, tone: Tone = 'success') => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = window.setTimeout(() => setToast(null), tone === 'error' ? 5000 : 3200);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && (
          <div key={toast.id} className={cx('toast', toast.tone === 'error' && 'toast--error')} role="status">
            <Icon name={toast.tone === 'error' ? 'alert' : 'check'} size={18} />
            <span>{toast.message}</span>
            <button type="button" className="toast__close" onClick={() => setToast(null)} aria-label="Dismiss">
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  return useContext(ToastContext);
}
