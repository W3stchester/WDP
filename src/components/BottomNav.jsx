// BottomNav.jsx — Desktop sidebar + mobile bottom nav.
import React from 'react';
import { MdCalendarMonth, MdSettings } from 'react-icons/md';

const VERSION = '۱.۴.۶';

export default function BottomNav({ page, setPage }) {
  const tabs = [
    { id: 'planning', label: 'برنامه‌ریزی', icon: MdCalendarMonth, desc: 'برنامه‌های روزانه' },
    { id: 'settings', label: 'تنظیمات',     icon: MdSettings,      desc: 'تم، پشتیبان‌گیری و بیشتر' },
  ];

  return (
    <>
      {/* Desktop sidebar (right side in RTL) */}
      <aside
        className="
          hidden md:flex md:flex-col
          md:w-64 md:flex-shrink-0
          surface-nav md:border-l
          md:h-screen md:sticky md:top-0
        "
      >
        <div className="px-5 py-5 border-b border-gray-200 dark:border-zinc-800">
          <h1 className="text-base font-bold text-gray-900 dark:text-zinc-100 tracking-tight">W.D. Planner</h1>
          <p className="text-[11px] text-gray-500 dark:text-zinc-500 mt-0.5">برنامه‌ریز روزانه وست‌چستر</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = page === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPage(tab.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-right
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }
                `}
              >
                <Icon size={20} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{tab.label}</div>
                  <div className={`text-[11px] mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-400 dark:text-zinc-500'}`}>
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-gray-200 dark:border-zinc-800">
          <div className="text-[11px] text-gray-400 dark:text-zinc-600">
            نسخه {VERSION} — آفلاین
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="
          md:hidden
          fixed bottom-0 left-0 right-0
          max-w-md mx-auto
          surface-nav
          flex justify-around items-center
          h-14 z-50
          border-t
        "
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = page === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setPage(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-[11px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
