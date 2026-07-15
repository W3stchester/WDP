import React, { useState, useEffect } from 'react';
import { MdClose, MdAccessTime } from 'react-icons/md';
import db from '../../db';
import { subjectsList, MODES } from '../../constants';
import { calculateDuration, hasOverlap, toPersianNum } from '../../utils/timeUtils';
import { generateReviews, generateCustomReviews, cascadeEditToReviews, propagateExtraNote } from '../../utils/reviewGenerator';
import TimePicker from '../../utils/TimePicker';
import WheelNumberInput from '../../utils/WheelNumberInput';
import CustomReviewModal from './CustomReviewModal';
import { showToast } from '../Common/Toast';

export default function DailyForm({ date, editingPlan, onClose }) {
  const [type, setType] = useState('درسی');
  const [mode, setMode] = useState('درس');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [reviewMode, setReviewMode] = useState('none'); // 'none' | 'default' | 'custom'
  const [customReviews, setCustomReviews] = useState([]); // Preserved when switching to default.
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(null); // 'start' | 'end' | null

  const isReview = editingPlan && editingPlan.baseId;

  // Hydrate form when editing.
  useEffect(() => {
    if (editingPlan) {
      setType(editingPlan.type || 'درسی');
      setMode(editingPlan.mode || 'درس');
      setSubject(editingPlan.subject || '');
      setChapter(editingPlan.chapter || '');
      setTextTitle(editingPlan.title || '');
      setStartTime(editingPlan.startTime || '');
      setEndTime(editingPlan.endTime || '');
      setDuration(editingPlan.duration ? String(editingPlan.duration) : '');
      if (editingPlan.baseId) {
        setNote('');
        setExtraNote(editingPlan.extraNote || '');
      } else {
        setNote(editingPlan.note || '');
        setExtraNote('');
      }
      setReviewMode('none');
      setCustomReviews([]);
    }
  }, [editingPlan]);

  // Close on Escape.
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  function buildTitle() {
    if (type === 'سایر') return textTitle;
    if (mode === 'آزمون') return textTitle;
    return `${mode} ${subject} فصل ${chapter}`;
  }

  async function handleSubmit() {
    // --- Review edit ---
    if (isReview) {
      const dur = parseInt(duration) || 0;

      if (startTime && endTime) {
        const rangeDuration = calculateDuration(startTime, endTime);
        if (rangeDuration < 0) { showToast('بازه زمانی نامعتبر است.'); return; }
        if (dur > rangeDuration) { showToast('مدت مفید نمی‌تواند بیشتر از بازه زمانی باشد.'); return; }

        const existingPlans = await db.dailyPlans.where('date').equals(editingPlan.date).toArray();
        const plansToCheck = existingPlans.filter(p => p.id !== editingPlan.id);
        for (const p of plansToCheck) {
          if (p.startTime && p.endTime && hasOverlap(startTime, endTime, p.startTime, p.endTime)) {
            showToast('این بازه زمانی با برنامه دیگری تداخل دارد.'); return;
          }
        }
      }

      const reviewUpdates = {
        startTime: startTime || '',
        endTime: endTime || '',
        duration: dur,
        extraNote,
      };

      await db.dailyPlans.update(editingPlan.id, reviewUpdates);

      if (extraNote !== (editingPlan.extraNote || '')) {
        await propagateExtraNote(editingPlan.baseId, editingPlan.reviewIndex, extraNote);
      }

      onClose();
      return;
    }

    // --- Base plan add/edit ---
    if (type === 'درسی' && mode !== 'آزمون') {
      if (!subject) { showToast('لطفاً درس را انتخاب کنید.'); return; }
      if (!chapter) { showToast('لطفاً شماره فصل را وارد کنید.'); return; }
    }
    if ((type === 'سایر' || mode === 'آزمون') && !textTitle) {
      showToast('لطفاً عنوان برنامه را وارد کنید.'); return;
    }

    const dur = parseInt(duration) || 0;
    if (startTime && endTime) {
      const rangeDuration = calculateDuration(startTime, endTime);
      if (rangeDuration < 0) { showToast('بازه زمانی نامعتبر است.'); return; }
      if (dur > rangeDuration) { showToast('مدت مفید نمی‌تواند بیشتر از بازه زمانی باشد.'); return; }

      const existingPlans = await db.dailyPlans.where('date').equals(date).toArray();
      const plansToCheck = editingPlan
        ? existingPlans.filter(p => p.id !== editingPlan.id)
        : existingPlans;

      for (const p of plansToCheck) {
        if (p.startTime && p.endTime && hasOverlap(startTime, endTime, p.startTime, p.endTime)) {
          showToast('این بازه زمانی با برنامه دیگری تداخل دارد.'); return;
        }
      }
    }

    const title = buildTitle();
    const planData = {
      date,
      title,
      type,
      mode: type === 'درسی' ? mode : '',
      subject: type === 'درسی' && mode !== 'آزمون' ? subject : '',
      chapter: type === 'درسی' && mode !== 'آزمون' ? chapter : '',
      startTime: startTime || '',
      endTime: endTime || '',
      duration: dur,
      note,
      done: false,
      baseId: null,
      reviewBadge: '',
      baseDate: '',
    };

    if (editingPlan) {
      await db.dailyPlans.update(editingPlan.id, planData);

      // Cascade subject/chapter/note changes to derived reviews.
      const changedFields = {};
      if (editingPlan.subject !== planData.subject) changedFields.subject = planData.subject;
      if (editingPlan.chapter !== planData.chapter) changedFields.chapter = planData.chapter;
      if (editingPlan.note !== planData.note) changedFields.note = planData.note;

      if (Object.keys(changedFields).length > 0) {
        await cascadeEditToReviews(editingPlan.id, changedFields);
      }
    } else {
      const id = await db.dailyPlans.add(planData);
      if (type === 'درسی' && mode === 'درس') {
        if (reviewMode === 'default') {
          await generateReviews({ ...planData, id });
        } else if (reviewMode === 'custom' && customReviews.length > 0) {
          await generateCustomReviews({ ...planData, id }, customReviews);
        }
      }
    }

    onClose();
  }

  // Shared class names.
  const inputCls = 'input-base';
  const labelCls = 'text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 block';
  const chipBtn = (active) => active
    ? 'chip-active px-3 py-1.5 text-xs font-medium w-full text-center'
    : 'chip px-3 py-1.5 text-xs font-medium w-full text-center';
  const sectionCls = 'space-y-2';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
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
            {isReview ? 'ویرایش مرور' : editingPlan ? 'ویرایش برنامه' : 'افزودن برنامه جدید'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
            aria-label="بستن"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Read-only inherited info for reviews */}
          {isReview && (
            <div className="space-y-2 rounded-lg p-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800">
              <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium">عنوان (غیرقابل ویرایش)</div>
              <div className="text-sm text-gray-900 dark:text-zinc-100 font-medium">
                {toPersianNum(editingPlan.title)}
              </div>

              {editingPlan.baseNote && (
                <div className="text-xs bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md text-gray-700 dark:text-zinc-200 leading-relaxed">
                  <span className="font-medium text-blue-600 dark:text-blue-400">یادداشت درس اصلی: </span>
                  <span className="whitespace-pre-wrap">{editingPlan.baseNote}</span>
                </div>
              )}
              {editingPlan.inheritedExtraNotes && editingPlan.inheritedExtraNotes.length > 0 && (
                <div className="text-xs space-y-1">
                  <span className="font-medium text-purple-600 dark:text-purple-400">یادداشت مرورهای قبلی:</span>
                  {editingPlan.inheritedExtraNotes.map((item, idx) => (
                    <div key={idx} className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded-md text-gray-700 dark:text-zinc-200">
                      <span className="font-medium">{item.badge}:</span> {item.note}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main form (hidden for reviews) */}
          {!isReview && (
            <>
              {/* Type */}
              <div className={sectionCls}>
                <label className={labelCls}>نوع برنامه</label>
                <div className="grid grid-cols-2 gap-2">
                  {['درسی', 'سایر'].map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={chipBtn(type === t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode */}
              {type === 'درسی' && (
                <div className={sectionCls}>
                  <label className={labelCls}>حالت</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MODES.map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={chipBtn(mode === m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject */}
              {type === 'درسی' && mode !== 'آزمون' && (
                <div className={sectionCls}>
                  <label className={labelCls}>درس</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {subjectsList.map(s => (
                      <button
                        key={s}
                        onClick={() => setSubject(s)}
                        className={`py-2 rounded-lg text-xs transition-colors text-center w-full ${
                          subject === s
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chapter + Duration (study/exam) */}
              {type === 'درسی' && mode !== 'آزمون' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>شماره فصل</label>
                    <WheelNumberInput
                      value={chapter}
                      onChange={(val) => { if (val.length <= 2) setChapter(val); }}
                      placeholder="مثلاً ۱۴"
                      min={0}
                      max={99}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>مدت مفید (دقیقه)</label>
                    <WheelNumberInput
                      value={duration}
                      onChange={setDuration}
                      placeholder="مثلاً ۴۵"
                      min={0}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* Title + Duration (other/exam) */}
              {(type === 'سایر' || mode === 'آزمون') && (
                <>
                  <div>
                    <label className={labelCls}>عنوان برنامه</label>
                    <input
                      type="text"
                      placeholder="عنوان را وارد کنید"
                      value={textTitle}
                      onChange={e => setTextTitle(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>مدت مفید (دقیقه)</label>
                    <WheelNumberInput
                      value={duration}
                      onChange={setDuration}
                      placeholder="مثلاً ۴۵"
                      min={0}
                      className={inputCls}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Start / End time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>شروع</label>
              <button
                type="button"
                onClick={() => setTimePickerOpen('start')}
                className={`${inputCls} text-left flex items-center justify-between cursor-pointer`}
              >
                <span className={startTime ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500'}>
                  {startTime ? toPersianNum(startTime) : 'انتخاب ساعت'}
                </span>
                <MdAccessTime size={16} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
              </button>
            </div>
            <div>
              <label className={labelCls}>پایان</label>
              <button
                type="button"
                onClick={() => setTimePickerOpen('end')}
                className={`${inputCls} text-left flex items-center justify-between cursor-pointer`}
              >
                <span className={endTime ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500'}>
                  {endTime ? toPersianNum(endTime) : 'انتخاب ساعت'}
                </span>
                <MdAccessTime size={16} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Duration (review mode only) */}
          {isReview && (
            <div>
              <label className={labelCls}>مدت مفید (دقیقه)</label>
              <WheelNumberInput
                value={duration}
                onChange={setDuration}
                placeholder="مثلاً ۴۵"
                min={0}
                className={inputCls}
              />
            </div>
          )}

          {/* Note (base plan) */}
          {!isReview && (
            <div>
              <label className={labelCls}>یادداشت (اختیاری)</label>
              <textarea
                placeholder="یادداشت خود را اینجا بنویسید…"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>
          )}

          {/* Extra note (review only) */}
          {isReview && (
            <div>
              <label className={labelCls}>یادداشت این مرور (اختیاری)</label>
              <textarea
                placeholder="یادداشت این مرور…"
                value={extraNote}
                onChange={e => setExtraNote(e.target.value)}
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>
          )}

          {/* Reviews: default / custom */}
          {type === 'درسی' && mode === 'درس' && !editingPlan && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setReviewMode(prev => prev === 'default' ? 'none' : 'default')}
                className={`py-2.5 rounded-lg text-xs font-medium transition-colors w-full text-center ${
                  reviewMode === 'default' ? 'bg-green-600 text-white' : 'chip'
                }`}
              >
                {reviewMode === 'default' ? '✓ مرور پیش‌فرض' : 'مرور پیش‌فرض'}
              </button>
              <button
                onClick={() => setShowCustomModal(true)}
                className={`py-2.5 rounded-lg text-xs font-medium transition-colors w-full text-center ${
                  reviewMode === 'custom' ? 'bg-green-600 text-white' : 'chip'
                }`}
              >
                {reviewMode === 'custom' ? '✓ مرور اختصاصی' : 'مرور اختصاصی'}
              </button>
            </div>
          )}
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
            onClick={handleSubmit}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
              editingPlan ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {editingPlan ? 'ثبت تغییر' : 'افزودن'}
          </button>
        </div>
      </div>

      {/* Time picker overlay */}
      {timePickerOpen === 'start' && (
        <TimePicker
          selectedTime={startTime}
          onSelect={(time) => { setStartTime(time); setTimePickerOpen(null); }}
          onClose={() => setTimePickerOpen(null)}
        />
      )}
      {timePickerOpen === 'end' && (
        <TimePicker
          selectedTime={endTime}
          onSelect={(time) => { setEndTime(time); setTimePickerOpen(null); }}
          onClose={() => setTimePickerOpen(null)}
        />
      )}

      {/* Custom review modal overlay */}
      {showCustomModal && (
        <CustomReviewModal
          initialReviews={customReviews}
          onConfirm={(reviews) => {
            setCustomReviews(reviews);
            setReviewMode(reviews.length > 0 ? 'custom' : 'none');
            setShowCustomModal(false);
          }}
          onClose={() => setShowCustomModal(false)}
        />
      )}
    </div>
  );
}
