import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    if (!message) return;
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 toasts visible

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = useMemo(() => {
    const fn = (msg, type = 'info', duration) => addToast(msg, type, duration);
    fn.success = (msg, duration) => addToast(msg, 'success', duration);
    fn.error = (msg, duration) => addToast(msg, 'error', duration);
    fn.warning = (msg, duration) => addToast(msg, 'warning', duration);
    fn.info = (msg, duration) => addToast(msg, 'info', duration);
    return fn;
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      toast: {
        success: (msg) => console.log('[Toast Success]', msg),
        error: (msg) => console.error('[Toast Error]', msg),
        warning: (msg) => console.warn('[Toast Warning]', msg),
        info: (msg) => console.log('[Toast Info]', msg),
      },
    };
  }
  return ctx;
}

function ToastContainer({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.25rem',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: 380,
        width: 'calc(100vw - 2.5rem)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        const borderColor = isSuccess
          ? 'var(--green)'
          : isError
          ? 'var(--red)'
          : isWarning
          ? 'var(--gold)'
          : 'var(--primary)';

        const bgGradient = isSuccess
          ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(15,23,42,0.95))'
          : isError
          ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(15,23,42,0.95))'
          : isWarning
          ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(15,23,42,0.95))'
          : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(15,23,42,0.95))';

        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: bgGradient,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${borderColor}`,
              borderRadius: 'var(--radius)',
              padding: '0.75rem 1rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              animation: 'slide-in-right 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {isSuccess && <CheckCircle2 size={18} style={{ color: 'var(--green)' }} />}
              {isError && <AlertCircle size={18} style={{ color: 'var(--red)' }} />}
              {isWarning && <AlertTriangle size={18} style={{ color: 'var(--gold)' }} />}
              {!isSuccess && !isError && !isWarning && <Info size={18} style={{ color: 'var(--primary-light)' }} />}
            </div>
            <div style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</div>
            <button
              type="button"
              onClick={() => onClose(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContext;
