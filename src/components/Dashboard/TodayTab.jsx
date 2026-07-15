import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db';
import { getToday, toJalali, toJalaliWeekday } from '../../utils/dateUtils';
import { toPersianNum } from '../../utils/timeUtils';
import TimeCircle from './TimeCircle';
import TodayPrograms from './TodayPrograms';

export default function TodayTab() {
  const today = getToday();
  const plans = useLiveQuery(() => db.dailyPlans.where('date').equals(today).toArray(), [today]);

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">{toJalaliWeekday(today)}</div>
        <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{toPersianNum(toJalali(today))}</div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mt-4">
        <TimeCircle plans={plans || []} />
      </div>

      <TodayPrograms />
    </div>
  );
}
