import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db';
import { getToday, getWeekStart, getWeekEnd, toJalali } from '../../utils/dateUtils';
import { formatMinutes, toPersianNum } from '../../utils/timeUtils';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';

export default function WeekTab() {
  const today = getToday();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);

  // واکشی داده‌های عملکرد واقعی از دیتابیس
  const weeklyPlans = useLiveQuery(async () => {
    return await db.dailyPlans
      .where('date')
      .between(weekStart, weekEnd, true, true)
      .toArray();
  }, [weekStart, weekEnd]);

  // واکشی اهداف از پیش تعیین شده
  const presetWeekly = useLiveQuery(async () => {
    const wp = await db.weeklyPlans
      .where('startDate')
      .equals(weekStart)
      .first();
    if (!wp) return [];
    return await db.weeklyItems.where('weeklyPlanId').equals(wp.id).toArray();
  }, [weekStart]);

  // محاسبات تجمعی و مقایسه‌ای با استفاده از useMemo برای جلوگیری از رندرینگ اضافه
  const { aggregatedList, presetList, aggregated, presetAggregated, allTitles } = useMemo(() => {
    if (!weeklyPlans || !presetWeekly) {
      return { aggregatedList: [], presetList: [], aggregated: {}, presetAggregated: {}, allTitles: [] };
    }

    const agg = {};
    weeklyPlans.forEach(p => {
      const key = p.subject || 'بدون عنوان';
      if (!agg[key]) agg[key] = { subject: key, count: 0, totalDuration: 0 };
      agg[key].count++;
      agg[key].totalDuration += p.duration || 0;
    });

    const preAgg = {};
    presetWeekly.forEach(p => {
      const key = p.subject || 'بدون عنوان';
      if (!preAgg[key]) preAgg[key] = { subject: key, count: 0, totalDuration: 0 };
      preAgg[key].count++;
      preAgg[key].totalDuration += p.duration || 0;
    });

    return {
      aggregatedList: Object.values(agg),
      presetList: Object.values(preAgg),
      aggregated: agg,
      presetAggregated: preAgg,
      allTitles: Array.from(new Set([...Object.keys(agg), ...Object.keys(preAgg)]))
    };
  }, [weeklyPlans, presetWeekly]);

  // حالت Loading
  if (!weeklyPlans || !presetWeekly) return null;

  return (
    <div className="space-y-4">
      {/* هدر بازه زمانی */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
          هفته {toPersianNum(toJalali(weekStart))} تا {toPersianNum(toJalali(weekEnd))}
        </h3>
      </div>

      {/* بخش اول: عملکرد واقعی */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">برنامه‌های روزانه این هفته</h4>
        {aggregatedList.length === 0 ? (
          <p className="text-xs text-gray-400">بدون عملکرد ثبت شده</p>
        ) : (
          <div className="space-y-1">
            {aggregatedList.map(item => (
              <div key={item.subject} className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.subject}</span>
                <span className="text-xs text-gray-500 dark:text-gray-300 flex items-center">
                  <MdKeyboardArrowRight size={16} className="text-gray-300" />
                  {toPersianNum(item.count)}×
                  <MdKeyboardArrowLeft size={16} className="text-gray-300" />
                  {formatMinutes(item.totalDuration)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* بخش دوم: اهداف تعیین شده */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">اهداف این هفته</h4>
        {presetList.length === 0 ? (
          <p className="text-xs text-gray-400">برای این هفته هدف‌گذاری انجام نشده است.</p>
        ) : (
          <div className="space-y-1">
            {presetList.map(item => (
              <div key={item.subject} className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.subject}</span>
                <span className="text-xs text-gray-500 dark:text-gray-300">
                  {toPersianNum(item.count)}× {formatMinutes(item.totalDuration)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* بخش سوم: مقایسه هوشمند */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">تحلیل عملکرد</h4>
        
        {presetList.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-6">
              برنامه‌ای برای مقایسه وجود ندارد. <br />
              شما می‌توانید از بخش <span className="font-bold text-blue-500 dark:text-blue-400">برنامه هفتگی</span> برای خود هدف‌گذاری کنید.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {allTitles.map(subject => {
              const inWeek = aggregated[subject];
              const inPreset = presetAggregated[subject];

              let badge = null;

              if (inPreset && !inWeek) {
                badge = <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 px-2 py-0.5 rounded-lg">انجام نشده</span>;
              } else if (inWeek && !inPreset) {
                badge = <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-lg">خارج از هدف</span>;
              } else if (inWeek && inPreset) {
                const diff = inWeek.totalDuration - inPreset.totalDuration;
                if (diff < 0) {
                  badge = <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-lg">کمتر از هدف</span>;
                } else if (diff > 0) {
                  badge = <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-lg">بیشتر از هدف</span>;
                } else {
                  badge = <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-lg">تحقق کامل</span>;
                }
              }

              return (
                <div key={subject} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{subject}</span>
                  {badge}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
