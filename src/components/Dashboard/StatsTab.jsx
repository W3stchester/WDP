import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db';
import { formatMinutes, toPersianNum } from '../../utils/timeUtils';

export default function StatsTab() {
  const stats = useLiveQuery(async () => {
    const allPlans = await db.dailyPlans.where('type').equals('درسی').toArray();
    const grouped = {};
    allPlans.forEach(p => {
      const key = p.subject || 'بدون عنوان';
      if (!grouped[key]) {
        grouped[key] = { title: key, count: 0, totalDuration: 0 };
      }
      grouped[key].count++;
      grouped[key].totalDuration += p.duration || 0;
    });
    return Object.values(grouped).sort((a, b) => b.totalDuration - a.totalDuration);
  });

  if (!stats) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">آمار کل (درسی)</h3>
      {stats.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-4">داده‌ای موجود نیست</p>
      ) : (
        <div className="space-y-2">
          {stats.map(item => (
            <div key={item.title} className="flex justify-between items-center py-2 bg-gray-50 dark:bg-gray-700 rounded-xl px-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">{item.title}</span>
              <div className="text-left">
                <div className="text-xs text-gray-500">{toPersianNum(item.count)} بار</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatMinutes(item.totalDuration)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
