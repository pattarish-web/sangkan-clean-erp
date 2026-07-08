'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const COLORS = {
  success: { bg: '#ecfdf5', border: '#6ee7b7', color: '#065f46', icon: '#10b981' },
  error: { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', icon: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#fcd34d', color: '#854d0e', icon: '#f59e0b' },
  info: { bg: '#eff6ff', border: '#93c5fd', color: '#1e40af', icon: '#3b82f6' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* Toast Container */}
      <div style={{
        position: 'fixed', top: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '12px',
        zIndex: 9999, pointerEvents: 'none',
        maxWidth: '380px', width: '100%'
      }}>
        {toasts.map(toast => {
          const c = COLORS[toast.type] || COLORS.success;
          return (
            <div key={toast.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              backgroundColor: c.bg, border: `1px solid ${c.border}`,
              borderRadius: '12px', padding: '16px 20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              pointerEvents: 'all',
              animation: 'slideInRight 0.3s ease-out',
            }}>
              <span style={{ color: c.icon, flexShrink: 0, marginTop: '1px' }}>{ICONS[toast.type]}</span>
              <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: '500', color: c.color, lineHeight: '1.5' }}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.color, opacity: 0.6, padding: '0', flexShrink: 0, marginTop: '1px' }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
