import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db';
import { getToday } from '../../utils/dateUtils';
import { timeToMinutes, formatMinutes, toPersianNum, getRemainingSecondsToday } from '../../utils/timeUtils';

export default function TodayPrograms() {
  const today = getToday();
  const plans = useLiveQuery(() => db.dailyPlans.where('date').equals(today).toArray(), [today]);
  const [remainingSeconds, setRemainingSeconds] = useState(getRemainingSecondsToday());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(getRemainingSecondsToday());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!plans) return null;

  const totalDuration = plans.reduce((sum, p) => sum + (p.duration || 0), 0);
  const remainingDuration = plans.filter(p => !p.done).reduce((sum, p) => sum + (p.duration || 0), 0);

  const remainingHours = Math.floor(remainingSeconds / 3600);
  const remainingMins = Math.floor((remainingSeconds % 3600) / 60);
  const remainingSecs = remainingSeconds % 60;

  async function toggleDone(plan) {
    await db.dailyPlans.update(plan.id, { done: !plan.done });
  }

  const sorted = [...plans].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return (b.duration || 0) - (a.duration || 0);
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mt-4">
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">برنامه‌های امروز</h3>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">کل فعالیت‌ها</div>
          <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{formatMinutes(totalDuration)}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">باقی‌مانده</div>
          <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{formatMinutes(remainingDuration)}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">تا پایان روز</div>
          <div className="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">
            {toPersianNum(String(remainingHours).padStart(2, '0'))}:
            {toPersianNum(String(remainingMins).padStart(2, '0'))}:
            {toPersianNum(String(remainingSecs).padStart(2, '0'))}
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-4">برنامه‌ای برای امروز ثبت نشده</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(plan => (
            <div
              key={plan.id}
              onClick={() => toggleDone(plan)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                plan.done
                  ? 'bg-gray-100 dark:bg-gray-700 opacity-50'
                  : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                plan.done
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {plan.done && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${
                  plan.done
                    ? 'line-through text-gray-400'
                    : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {toPersianNum(plan.title || plan.subject || 'بدون عنوان')}
                </div>
                <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {plan.startTime && plan.endTime && (
                    <span>{toPersianNum(plan.startTime)} - {toPersianNum(plan.endTime)}</span>
                  )}
                  {plan.duration > 0 && <span>{formatMinutes(plan.duration)}</span>}
                </div>
              </div>
              {plan.reviewBadge && (
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-white px-2 py-0.5 rounded-lg">
                  مرور
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
