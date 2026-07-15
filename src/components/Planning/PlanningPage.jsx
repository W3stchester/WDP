// PlanningPage.jsx — Only daily planning (weekly/general tabs removed).
import React from 'react';
import DailyPlanning from './DailyPlanning';

export default function PlanningPage() {
  return (
    <div className="p-4 md:p-0 md:mb-6">
      <DailyPlanning />
    </div>
  );
}
