import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db';
import { getToday, getWeekStart, getWeekEnd, toJalali, addDays, isBefore } from '../../utils/dateUtils';
import { toPersianNum } from '../../utils/timeUtils';
import WeeklyForm from './WeeklyForm';
import WeeklyList from './WeeklyList';

export default function WeeklyPlanning() {
  const [showForm, setShowForm] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);

  const weeklyPlans = useLiveQuery(() => db.weeklyPlans.toArray());

  function handleEdit(week) {
    setEditingWeek(week);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditingWeek(null);
  }

  return (
    <div>
      <button
        onClick={() => showForm ? handleClose() : setShowForm(true)}
        className={`w-full py-2 rounded-xl text-sm font-medium mb-4 transition-colors ${
          showForm
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {showForm ? 'بستن' : 'افزودن برنامه هفتگی'}
      </button>

      {showForm && (
        <WeeklyForm
          editingWeek={editingWeek}
          onClose={handleClose}
        />
      )}

      <WeeklyList onEdit={handleEdit} />
    </div>
  );
}
