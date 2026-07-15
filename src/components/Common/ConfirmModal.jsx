import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, type = 'info' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        style={{ animation: 'fadeIn 0.15s ease-out' }}
      ></div>

      {/* Modal */}
      <div
        className="surface-modal relative w-full max-w-xs p-6"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
              type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            تایید
          </button>
        </div>
      </div>
    </div>
  );
}
