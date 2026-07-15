// DailyList.jsx — Two-column grid of plans (single column on mobile).
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db';
import DailyItem from './DailyItem';

export default function DailyList({ date, isPast, onEdit }) {
  const plans = useLiveQuery(
    () => db.dailyPlans.where('date').equals(date).toArray(),
    [date]
  );

  if (!plans) return null;

  // Sort by start time (empty times go last), then by duration.
  const sorted = [...plans].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return (b.duration || 0) - (a.duration || 0);
  });

  return (
    <>
      {sorted.length === 0 ? (
        <div className="surface-card text-center py-12 px-4">
          <p className="text-gray-500 dark:text-zinc-400 text-sm">برنامه‌ای ثبت نشده</p>
          <p className="text-gray-400 dark:text-zinc-600 text-xs mt-1">«افزودن برنامه جدید» را بزنید</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {sorted.map(plan => (
            <DailyItem
              key={plan.id}
              plan={plan}
              isPast={isPast}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </>
  );
}
