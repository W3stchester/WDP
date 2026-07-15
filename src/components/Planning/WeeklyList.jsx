import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db';
import WeeklyItem from './WeeklyItem';

export default function WeeklyList({ onEdit }) {
  const weeklyPlans = useLiveQuery(() => db.weeklyPlans.orderBy('startDate').reverse().toArray());

  if (!weeklyPlans) return null;

  return (
    <div className="space-y-2">
      {weeklyPlans.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">برنامه هفتگی ثبت نشده</p>
      ) : (
        weeklyPlans.map(week => (
          <WeeklyItem key={week.id} week={week} onEdit={onEdit} />
        ))
      )}
    </div>
  );
}
