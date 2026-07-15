// DailyPlanning.jsx — Date navigation + add button + plan list.
import React, { useState } from 'react';
import { getToday, addDays, toJalali, isBefore } from '../../utils/dateUtils';
import { toPersianNum } from '../../utils/timeUtils';
import DailyForm from './DailyForm';
import DailyList from './DailyList';
import JalaliDatePicker from '../../utils/JalaliDatePicker';
import { useSettings } from '../../context/SettingsContext';

export default function DailyPlanning() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { editPast } = useSettings();

  const isPast = isBefore(selectedDate, getToday());
  // Show add button if (today/future) OR (past with edit-past enabled).
  const canEdit = !isPast || (isPast && editPast);

  function goYesterday() {
    setSelectedDate(addDays(selectedDate, -1));
    setShowForm(false);
    setEditingPlan(null);
  }

  function goTomorrow() {
    setSelectedDate(addDays(selectedDate, 1));
    setShowForm(false);
    setEditingPlan(null);
  }

  const handleDateClick = () => setIsCalendarOpen(true);

  function handleEdit(plan) {
    setEditingPlan(plan);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingPlan(null);
  }

  return (
    <div className="relative">
      {/* Date header */}
      <div className="flex items-center justify-between surface-card p-3 mb-4">
        <button
          onClick={goTomorrow}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-95 transition-all"
        >
          روز بعد
        </button>

        <button onClick={handleDateClick} className="text-center group px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
          <div className="text-sm font-bold text-gray-900 dark:text-zinc-100 group-active:text-blue-600 transition-colors">
            {toPersianNum(toJalali(selectedDate))}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">تغییر تاریخ</div>
        </button>

        <button
          onClick={goYesterday}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-95 transition-all"
        >
          روز قبل
        </button>
      </div>

      {/* Add button */}
      {canEdit && (
        <button
          onClick={() => {
            setEditingPlan(null);
            setShowForm(true);
          }}
          className="btn-primary w-full py-2.5 mb-4 font-semibold active:scale-[0.98] transition-all"
        >
          ＋ افزودن برنامه جدید
        </button>
      )}

      {/* Form overlay */}
      {showForm && canEdit && (
        <DailyForm
          date={selectedDate}
          editingPlan={editingPlan}
          onClose={handleFormClose}
        />
      )}

      {/* Plan list */}
      <DailyList
        date={selectedDate}
        isPast={isPast}
        onEdit={handleEdit}
      />

      {/* Jalali date picker overlay */}
      {isCalendarOpen && (
        <JalaliDatePicker
          selectedDate={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date);
            setIsCalendarOpen(false);
            setShowForm(false);
            setEditingPlan(null);
          }}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}
    </div>
  );
}
