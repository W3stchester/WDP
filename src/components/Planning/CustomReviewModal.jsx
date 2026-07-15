import React, { useState, useEffect } from 'react';
import { MdClose, MdAdd, MdDeleteOutline, MdBookmark, MdSave } from 'react-icons/md';
import { toPersianNum } from '../../utils/timeUtils';
import WheelNumberInput from '../../utils/WheelNumberInput';

const STORAGE_KEY = 'customReviewPresets';

function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function savePresets(presets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export default function CustomReviewModal({ initialReviews, onConfirm, onClose }) {
  const [reviews, setReviews] = useState(
    initialReviews && initialReviews.length > 0
      ? initialReviews.map(r => ({ label: r.label, days: String(r.days) }))
      : [{ label: '', days: '' }]
  );
  const [presets, setPresets] = useState(loadPresets());
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Close on Escape.
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  function addReview() {
    setReviews([...reviews, { label: '', days: '' }]);
  }

  function removeReview(idx) {
    setReviews(reviews.filter((_, i) => i !== idx));
  }

  function updateReview(idx, field, value) {
    setReviews(reviews.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  function loadPreset(preset) {
    setReviews(preset.reviews.map(r => ({ label: r.label, days: String(r.days) })));
  }

  function deletePreset(idx) {
    const newPresets = presets.filter((_, i) => i !== idx);
    setPresets(newPresets);
    savePresets(newPresets);
  }

  function saveAsPreset() {
    if (!presetName.trim()) return;
    const validReviews = getValidReviews();
    if (validReviews.length === 0) return;

    const newPreset = { name: presetName.trim(), reviews: validReviews };
    const newPresets = [...presets, newPreset];
    setPresets(newPresets);
    savePresets(newPresets);
    setPresetName('');
    setShowSavePreset(false);
  }

  function getValidReviews() {
    return reviews
      .filter(r => r.label.trim() && parseInt(r.days) > 0)
      .map(r => ({ label: r.label.trim(), days: parseInt(r.days) }));
  }

  function handleConfirm() {
    onConfirm(getValidReviews());
  }

  const validCount = getValidReviews().length;
  const inputCls = 'input-base !py-1.5 !text-xs';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div
        dir="rtl"
        onClick={e => e.stopPropagation()}
        className="surface-modal w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">
            مرورهای اختصاصی
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
            aria-label="بستن"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                <MdBookmark size={13} />
                پریست‌های من
              </label>
              <button
                onClick={() => setShowSavePreset(!showSavePreset)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <MdSave size={12} />
                ذخیره به‌عنوان پریست
              </button>
            </div>

            {showSavePreset && (
              <div className="flex gap-2 bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-gray-200 dark:border-zinc-800">
                <input
                  type="text"
                  placeholder="نام پریست…"
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                  className={`flex-1 ${inputCls}`}
                />
                <button
                  onClick={saveAsPreset}
                  disabled={!presetName.trim() || validCount === 0}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ذخیره
                </button>
              </div>
            )}

            {presets.length === 0 ? (
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 text-center py-2">
                پریستی ذخیره نشده است.
              </p>
            ) : (
              <div className="space-y-1.5">
                {presets.map((preset, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <button
                      onClick={() => loadPreset(preset)}
                      className="flex-1 text-right"
                    >
                      <div className="text-xs font-medium text-gray-900 dark:text-zinc-100">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-zinc-500">
                        {toPersianNum(preset.reviews.length)} مرور
                      </div>
                    </button>
                    <button
                      onClick={() => deletePreset(idx)}
                      className="p-1 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      aria-label="حذف پریست"
                    >
                      <MdDeleteOutline size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-zinc-800" />

          {/* Reviews list */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">
              مرورها ({toPersianNum(validCount)} معتبر)
            </label>

            {reviews.map((review, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-lg p-2"
              >
                <input
                  type="text"
                  placeholder="نام مرور (مثلاً مرور اول)"
                  value={review.label}
                  onChange={e => updateReview(idx, 'label', e.target.value)}
                  className={`flex-1 ${inputCls}`}
                />
                <div className="flex items-center gap-1">
                  <WheelNumberInput
                    value={review.days}
                    onChange={(val) => updateReview(idx, 'days', val)}
                    placeholder="روز"
                    min={0}
                    className={`w-14 text-center ${inputCls}`}
                  />
                  <span className="text-[10px] text-gray-500 dark:text-zinc-500">روز</span>
                </div>
                <button
                  onClick={() => removeReview(idx)}
                  className="p-1 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  aria-label="حذف مرور"
                >
                  <MdDeleteOutline size={16} />
                </button>
              </div>
            ))}

            <button
              onClick={addReview}
              className="w-full py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 text-xs text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:border-blue-400 transition-colors flex items-center justify-center gap-1"
            >
              <MdAdd size={14} />
              افزودن مرور
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-200 dark:border-zinc-800 shrink-0 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleConfirm}
            disabled={validCount === 0}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            تایید ({toPersianNum(validCount)})
          </button>
        </div>
      </div>
    </div>
  );
}
