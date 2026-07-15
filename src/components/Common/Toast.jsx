// Toast.jsx — Stackable toast notifications with progress bar.
// Max 3 toasts visible; oldest removed when spamming. Auto-dismiss after 5s.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MdClose, MdErrorOutline, MdInfoOutline, MdCheckCircleOutline } from 'react-icons/md';

const MAX_TOASTS = 3;
const DURATION = 5000; // 5 seconds

let toastIdCounter = 0;
const listeners = new Set();

// Public API: push a toast.
export function showToast(message, type = 'error') {
  const toast = { id: ++toastIdCounter, message, type, createdAt: Date.now() };
  listeners.forEach(fn => fn(toast));
}

export default function Toast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const addToast = useCallback((toast) => {
    setToasts(prev => {
      // Max 3: remove oldest if at limit.
      let next = [...prev, toast];
      if (next.length > MAX_TOASTS) {
        const removed = next.shift();
        if (timers.current[removed.id]) {
          clearTimeout(timers.current[removed.id]);
          delete timers.current[removed.id];
        }
      }
      return next;
    });
    // Auto-dismiss after 5s.
    timers.current[toast.id] = setTimeout(() => {
      removeToast(toast.id);
    }, DURATION);
  }, [removeToast]);

  useEffect(() => {
    listeners.add(addToast);
    return () => {
      listeners.delete(addToast);
      // Cleanup all timers on unmount.
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  const iconFor = (type) => {
    if (type === 'error') return <MdErrorOutline size={18} className="text-red-500 flex-shrink-0" />;
    if (type === 'success') return <MdCheckCircleOutline size={18} className="text-green-500 flex-shrink-0" />;
    return <MdInfoOutline size={18} className="text-blue-500 flex-shrink-0" />;
  };

  const borderFor = (type) => {
    if (type === 'error') return 'border-r-red-500';
    if (type === 'success') return 'border-r-green-500';
    return 'border-r-blue-500';
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[500] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          icon={iconFor(toast.type)}
          borderClass={borderFor(toast.type)}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Single toast with shrinking progress bar.
function ToastItem({ toast, icon, borderClass, onClose }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const progressColor = toast.type === 'error' ? 'bg-red-500'
    : toast.type === 'success' ? 'bg-green-500'
    : 'bg-blue-500';

  return (
    <div
      className={`surface-card pointer-events-auto border-r-4 ${borderClass} overflow-hidden relative`}
      style={{ animation: 'slideInUp 0.25s ease-out' }}
    >
      <div className="flex items-start gap-2.5 p-3 pr-3.5">
        {icon}
        <p className="flex-1 text-xs text-gray-700 dark:text-zinc-200 leading-relaxed pt-0.5">
          {toast.message}
        </p>
        <button
          onClick={onClose}
          className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors flex-shrink-0"
          aria-label="بستن"
        >
          <MdClose size={16} />
        </button>
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-zinc-800">
        <div
          className={`h-full ${progressColor} transition-none`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
