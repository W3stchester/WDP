import React, { useState } from 'react';
import TodayTab from './TodayTab';
import WeekTab from './WeekTab';
import StatsTab from './StatsTab';

export default function DashboardPage() {
  const [tab, setTab] = useState('today');

  const tabs = [
    { id: 'today', label: 'امروز' },
    { id: 'week', label: 'این هفته' },
    { id: 'stats', label: 'آمار کل' },
  ];

  return (
    <div className="p-4 md:p-0 md:mb-6">
      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'today' && <TodayTab />}
      {tab === 'week' && <WeekTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  );
}
