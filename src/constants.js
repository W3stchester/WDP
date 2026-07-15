// constants.js — Subjects, modes, and default review schedule.

export const subjectsList = [
  'زبان انگلیسی',
  'ریاضی عمومی ۱',
  'ریاضی عمومی ۲',
  'آمار و احتمال',
  'گسسته',
  'جبر خطی',
  'نظریه زبان',
  'سیگنال',
  'ساختمان داده',
  'الگوریتم',
  'هوش مصنوعی',
  'مبانی برنامه‌نویسی',
  'مدار منطقی',
  'معماری',
  'الکترونیک دیجیتال',
  'سیستم‌عامل',
  'شبکه',
  'پایگاه داده',
];

export const MODES = ['درس', 'تست', 'مرور', 'آزمون'];

// Default review schedule: {days after base, label, type, title prefix}.
export const REVIEW_SCHEDULE = [
  { days: 1,  label: 'مرور درسنامه روز بعد', type: 'مرور', titlePrefix: 'مرور درسنامه' },
  { days: 3,  label: 'تست‌های فرد ۳ روز بعد', type: 'تست', titlePrefix: 'تست‌های فرد' },
  { days: 10, label: 'تست‌های زوج ۱۰ روز بعد', type: 'تست', titlePrefix: 'تست‌های زوج' },
  { days: 35, label: 'مرور اول ۳۵ روز بعد', type: 'تست', titlePrefix: 'مرور اول تست‌های' },
  { days: 90, label: 'مرور دوم ۹۰ روز بعد', type: 'تست', titlePrefix: 'مرور دوم تست‌های' },
];
