import React, { useEffect, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { subscribeToToasts } from '../utils/toastBus';

function ToastIcon({ tone }) {
  if (tone === 'success') return <CheckCircle2 size={16} />;
  if (tone === 'error') return <AlertTriangle size={16} />;
  return <Info size={16} />;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((prev) => [toast, ...prev].slice(0, 6));

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, toast.duration || 2600);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.tone || 'info'}`}>
          <span className="toast-icon"><ToastIcon tone={toast.tone} /></span>
          <span className="toast-text">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
