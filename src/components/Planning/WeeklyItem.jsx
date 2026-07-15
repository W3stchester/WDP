import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db';
import { toJalali } from '../../utils/dateUtils';
import { formatMinutes, toPersianNum } from '../../utils/timeUtils';

export default function WeeklyItem({ week, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const items = useLiveQuery(
    () => db.weeklyItems.where('weeklyPlanId').equals(week.id).toArray(),
    [week.id]
  );

  if (!items) return null;

  const totalDuration = items.reduce((sum, item) => sum + (item.duration || 0), 0);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    await db.weeklyItems.where('weeklyPlanId').equals(week.id).delete();
    await db.weeklyPlans.delete(week.id);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {toPersianNum(toJalali(week.startDate))} تا {toPersianNum(toJalali(week.endDate))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {toPersianNum(items.length)} برنامه | {formatMinutes(totalDuration)}
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            {expanded ? 'بستن' : 'بیشتر'}
          </button>
          <button
            onClick={() => onEdit(week)}
            className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-gray-400"
          >
            ویرایش
          </button>
          <button
            onClick={handleDelete}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
              confirmDelete
                ? 'bg-red-600 text-white'
                : 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-gray-300'
            }`}
          >
            {confirmDelete ? 'مطمئنید؟' : 'حذف'}
          </button>
        </div>
      </div>

      {/* محتوای باز شده */}
      {expanded && (
        <div className="mt-3 space-y-1.5 transition-all">
          {items.map(item => (
            <ItemDetail key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemDetail({ item }) {
  const [showNote, setShowNote] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-700 dark:text-gray-300">{item.title}</span>
        <div className="flex items-center gap-2">
          {item.duration > 0 && (
            <span className="text-xs text-gray-500">{formatMinutes(item.duration)}</span>
          )}
          {item.note && (
            <button
              onClick={() => setShowNote(!showNote)}
              className="text-xs text-blue-500"
            >
              {showNote ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>
      {showNote && item.note && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
          {item.note}
        </div>
      )}
    </div>
  );
}
