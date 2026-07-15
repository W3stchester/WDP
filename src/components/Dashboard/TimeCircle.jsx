import React from 'react';
import { toPersianNum } from '../../utils/timeUtils';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export default function TimeCircle({ plans }) {
  const size = 300;
  const center = size / 2;
  const radius = 100;
  const innerRadius = 60;

  const activePlans = plans.filter(p => !p.done && p.startTime && p.endTime);

  function timeToAngle(time) {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m;
    // 00:00 پایین، 12:00 بالا، ساعتگرد
    // 0 درجه = پایین (6 ساعت)، 90 = چپ (3 ساعت)
    const angle = (totalMinutes / 1440) * 360 - 90;
    return angle;
  }

  function polarToCartesian(angle, r) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  }

  function describeArc(startAngle, endAngle, r) {
    // تبدیل: 00:00 = پایین
    const adjustedStart = startAngle - 180;
    const adjustedEnd = endAngle - 180;
    const start = polarToCartesian(adjustedStart, r);
    const end = polarToCartesian(adjustedEnd, r);
    const largeArc = (adjustedEnd - adjustedStart + 360) % 360 > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* دایره پس‌زمینه */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#E5E7EB" strokeWidth="20" className="dark:stroke-gray-700" />

        {/* برچسب‌های ساعت */}
        {[0, 3, 6, 9, 12, 15, 18, 21].map(h => {
          const totalMin = h * 60;
          const angle = ((totalMin / 1440) * 360) + 180;
          const pos = polarToCartesian(angle, radius + 18);
          return (
            <text
              key={h}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-500 dark:fill-gray-400"
              fontSize="9"
            >
              {toPersianNum(String(h).padStart(2, '0'))}
            </text>
          );
        })}

        {/* بازه‌های فعال */}
        {activePlans.map((plan, idx) => {
          const [sh, sm] = plan.startTime.split(':').map(Number);
          const [eh, em] = plan.endTime.split(':').map(Number);
          let startMin = sh * 60 + sm;
          let endMin = eh * 60 + em;
          if (endMin === 0 && startMin >= 1380) endMin = 1440;

          const startAngle = (startMin / 1440) * 360;
          const endAngle = (endMin / 1440) * 360;
          const color = COLORS[idx % COLORS.length];

          return (
            <path
              key={plan.id}
              d={describeArc(startAngle, endAngle, radius)}
              fill="none"
              stroke={color}
              strokeWidth="18"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* راهنمای رنگ */}
      {activePlans.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {activePlans.map((plan, idx) => (
            <div key={plan.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {toPersianNum(plan.title || plan.subject || 'بدون عنوان')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
