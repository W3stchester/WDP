import React, { useState, useEffect } from 'react';
import db from '../../db';
import { subjectsList } from '../../constants';
import { getWeekStart, getWeekEnd, toJalali, isSaturday, isFriday } from '../../utils/dateUtils';
import { toPersianNum } from '../../utils/timeUtils';

export default function WeeklyForm({ editingWeek, onClose }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    type: 'درسی',
    subject: '',
    title: '',
    duration: '',
    note: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingWeek) {
      setStartDate(editingWeek.startDate);
      setEndDate(editingWeek.endDate);
      // بارگذاری آیتم‌ها
      db.weeklyItems.where('weeklyPlanId').equals(editingWeek.id).toArray().then(setItems);
    }
  }, [editingWeek]);

  function handleStartDateChange(e) {
    const val = e.target.value;
    setStartDate(val);
    // محاسبه پایان هفته (جمعه)
    const end = getWeekEnd(val);
    setEndDate(end);
  }

  function addItem() {
    if (currentItem.type === 'درسی' && !currentItem.subject) {
      setError('درس را انتخاب کنید');
      return;
    }
    if (currentItem.type === 'سایر' && !currentItem.title) {
      setError('عنوان را وارد کنید');
      return;
    }
    setError('');

    const title = currentItem.type === 'درسی' ? currentItem.subject : currentItem.title;
    setItems([...items, { ...currentItem, title }]);
    setCurrentItem({ type: 'درسی', subject: '', title: '', duration: '', note: '' });
  }

  function removeItem(idx) {
    setItems(items.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!startDate || !endDate) {
      setError('تاریخ هفته را مشخص کنید');
      return;
    }
    if (items.length === 0) {
      setError('حداقل یک برنامه اضافه کنید');
      return;
    }

    if (editingWeek) {
      await db.weeklyPlans.update(editingWeek.id, { startDate, endDate });
      await db.weeklyItems.where('weeklyPlanId').equals(editingWeek.id).delete();
      const weeklyItems = items.map(item => ({
        weeklyPlanId: editingWeek.id,
        title: item.title,
        type: item.type,
        subject: item.subject || '',
        duration: parseInt(item.duration) || 0,
        note: item.note || '',
      }));
      await db.weeklyItems.bulkAdd(weeklyItems);
    } else {
      const weekId = await db.weeklyPlans.add({ startDate, endDate });
      const weeklyItems = items.map(item => ({
        weeklyPlanId: weekId,
        title: item.title,
        type: item.type,
        subject: item.subject || '',
        duration: parseInt(item.duration) || 0,
        note: item.note || '',
      }));
      await db.weeklyItems.bulkAdd(weeklyItems);
    }

    onClose();
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 space-y-3">
      {error && (
        <div className="bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs p-2 rounded-lg">
          {error}
        </div>
      )}

      {/* تاریخ */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">شروع (شنبه)</label>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">پایان (جمعه)</label>
          <input
            type="date"
            value={endDate}
            disabled
            className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400 outline-none"
          />
        </div>
      </div>

      {startDate && (
        <div className="text-xs text-center text-gray-500 dark:text-gray-400">
          {toPersianNum(toJalali(startDate))} تا {toPersianNum(toJalali(endDate))}
        </div>
      )}

      {/* افزودن آیتم */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-2">
        <div className="text-xs font-bold text-gray-600 dark:text-gray-400">افزودن برنامه:</div>

        <div className="flex gap-2">
          {['درسی', 'سایر'].map(t => (
            <button
              key={t}
              onClick={() => setCurrentItem({ ...currentItem, type: t })}
              className={`flex-1 py-1.5 rounded-xl text-xs transition-colors ${
                currentItem.type === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {currentItem.type === 'درسی' ? (
          <div className="grid grid-cols-3 gap-1">
            {subjectsList.map(s => (
              <button
                key={s}
                onClick={() => setCurrentItem({ ...currentItem, subject: s })}
                className={`py-1 rounded-xl text-xs transition-colors ${
                  currentItem.subject === s
                    ? 'bg-purple-600 dark:bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            placeholder="عنوان"
            value={currentItem.title}
            onChange={e => setCurrentItem({ ...currentItem, title: e.target.value })}
            className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 outline-none"
          />
        )}

        <input
          type="number"
          placeholder="مدت زمان (دقیقه)"
          value={currentItem.duration}
          onChange={e => setCurrentItem({ ...currentItem, duration: e.target.value })}
          className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 outline-none"
        />

        <textarea
          placeholder="یادداشت (اختیاری)"
          value={currentItem.note}
          onChange={e => setCurrentItem({ ...currentItem, note: e.target.value })}
          rows={1}
          className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 outline-none resize-none"
        />

        <button
          onClick={addItem}
          className="w-full py-1.5 rounded-xl text-xs bg-green-600 text-white"
        >
          + افزودن به لیست
        </button>
      </div>

      {/* لیست آیتم‌های اضافه‌شده */}
      {items.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
            برنامه‌های اضافه‌شده ({toPersianNum(items.length)}):
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-700 dark:text-gray-300">{item.title}</span>
              <div className="flex items-center gap-2">
                {item.duration && (
                  <span className="text-xs text-gray-500">{toPersianNum(item.duration)} دقیقه</span>
                )}
                <button
                  onClick={() => removeItem(idx)}
                  className="text-red-500 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* دکمه ثبت نهایی */}
      <button
        onClick={handleSubmit}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
          editingWeek
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {editingWeek ? 'ثبت تغییر' : 'ثبت برنامه هفتگی'}
      </button>
    </div>
  );
}
