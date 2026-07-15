import React, { useState, useEffect, useRef } from 'react';
import { MdMoreVert, MdEdit, MdDelete } from 'react-icons/md';
import db from '../../db';
import { formatMinutes, toPersianNum } from '../../utils/timeUtils';
import { cascadeDeleteReviews } from '../../utils/reviewGenerator';
import { toJalali } from '../../utils/dateUtils';
import { useSettings } from '../../context/SettingsContext';
import ConfirmModal from '../Common/ConfirmModal';

export default function DailyItem({ plan, isPast, onEdit }) {
  const [showNote, setShowNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { editPast } = useSettings();

  const isReview = !!plan.baseId;
  const isInteractionDisabled = isPast && !editPast;

  const hasNotes = isReview
    ? (plan.baseNote || (plan.inheritedExtraNotes && plan.inheritedExtraNotes.length > 0) || plan.extraNote)
    : plan.note;

  // Close menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  async function toggleDone(e) {
    e.stopPropagation();
    await db.dailyPlans.update(plan.id, { done: !plan.done });
  }

  function handleDeleteClick() {
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    setShowDeleteConfirm(false);
    // Only base plans (non-reviews) cascade-delete their reviews.
    if (!isReview) {
      await cascadeDeleteReviews(plan.id);
    }
    await db.dailyPlans.delete(plan.id);
  }

  function handleEditClick() {
    setMenuOpen(false);
    onEdit(plan);
  }

  // Build detail line (time + duration).
  const details = [];
  if (plan.startTime && plan.endTime) {
    details.push(`${toPersianNum(plan.startTime)} - ${toPersianNum(plan.endTime)}`);
  }
  if (plan.duration > 0) {
    details.push(formatMinutes(plan.duration));
  }

  return (
    <div
      className={`relative surface-card p-3 transition-all duration-200 ${
        menuOpen ? 'z-30 shadow-md ring-1 ring-blue-200 dark:ring-blue-900' : ''
      } ${plan.done ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Checkbox */}
        <button
          onClick={toggleDone}
          className="flex-shrink-0 mt-0.5"
          aria-label="Toggle done"
        >
          <div
            className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors ${
              plan.done
                ? 'bg-blue-600 border-blue-600'
                : 'border-gray-300 dark:border-zinc-600 hover:border-blue-500'
            }`}
          >
            {plan.done && <span className="text-white text-[10px] leading-none">✓</span>}
          </div>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-medium truncate transition-colors ${
              plan.done
                ? 'line-through text-gray-400 dark:text-zinc-600'
                : 'text-gray-900 dark:text-zinc-100'
            }`}
          >
            {toPersianNum(plan.title || plan.subject || 'بدون عنوان')}
          </div>

          {/* Detail line */}
          {details.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-[11px] text-gray-500 dark:text-zinc-400">
              {details.map((d, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-gray-300 dark:text-zinc-700">·</span>}
                  <span>{d}</span>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Review badge — shown for review plans */}
          {plan.reviewBadge && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                {toPersianNum(plan.reviewBadge)}
              </span>
              {plan.baseDate && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                  پایه: {toPersianNum(toJalali(plan.baseDate))}
                </span>
              )}
            </div>
          )}

          {hasNotes && (
            <button
              onClick={() => setShowNote(!showNote)}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 mt-1 transition-colors"
            >
              {showNote ? 'بستن' : 'بیشتر'}
            </button>
          )}
        </div>

        {/* Three-dot menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            disabled={isInteractionDisabled}
            className={`p-1 rounded-md transition-colors ${
              isInteractionDisabled
                ? 'text-gray-300 dark:text-zinc-700 cursor-not-allowed'
                : menuOpen
                  ? 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200'
                  : 'text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
            aria-label="Options"
          >
            <MdMoreVert size={18} />
          </button>

          {menuOpen && !isInteractionDisabled && (
            <div className="absolute left-0 top-full mt-1 z-40 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-800 py-1 min-w-[120px]">
              <button
                onClick={handleEditClick}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-right"
              >
                <MdEdit size={14} />
                ویرایش
              </button>
              <div className="border-t border-gray-100 dark:border-zinc-800 my-0.5" />
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-right"
              >
                <MdDelete size={14} />
                حذف
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {showNote && (
        <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-zinc-800 space-y-1.5" style={{ animation: 'slideInUp 0.2s ease-out' }}>
          {!isReview && plan.note && (
            <div className="p-2 rounded-md bg-gray-50 dark:bg-zinc-800 text-xs text-gray-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {plan.note}
            </div>
          )}
          {isReview && plan.baseNote && (
            <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 text-xs text-gray-700 dark:text-zinc-200 leading-relaxed">
              <span className="font-medium text-blue-600 dark:text-blue-400">یادداشت درس اصلی: </span>
              <span className="whitespace-pre-wrap">{plan.baseNote}</span>
            </div>
          )}
          {isReview && plan.inheritedExtraNotes && plan.inheritedExtraNotes.length > 0 && (
            plan.inheritedExtraNotes.map((item, idx) => (
              <div key={idx} className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/30 text-xs text-gray-700 dark:text-zinc-200 leading-relaxed">
                <span className="font-medium text-purple-600 dark:text-purple-400">{item.badge}: </span>
                <span className="whitespace-pre-wrap">{item.note}</span>
              </div>
            ))
          )}
          {isReview && plan.extraNote && (
            <div className="p-2 rounded-md bg-green-50 dark:bg-green-950/30 text-xs text-gray-700 dark:text-zinc-200 leading-relaxed">
              <span className="font-medium text-green-600 dark:text-green-400">یادداشت این مرور: </span>
              <span className="whitespace-pre-wrap">{plan.extraNote}</span>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="حذف برنامه"
        message={
          isReview
            ? 'آیا مطمئنید می‌خواهید این مرور را حذف کنید؟'
            : 'آیا مطمئنید می‌خواهید این برنامه را حذف کنید؟ در صورتی که این برنامه مرورهای مرتبط داشته باشد، آن‌ها نیز حذف خواهند شد.'
        }
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
