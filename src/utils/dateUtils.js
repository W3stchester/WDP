// dateUtils.js — Jalali date helpers via dayjs + jalaliday.
import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

dayjs.extend(jalaliday);

export function toJalali(date) {
  return dayjs(date).calendar('jalali').format('YYYY/MM/DD');
}

export function getToday() {
  return dayjs().format('YYYY-MM-DD');
}

export function addDays(date, n) {
  return dayjs(date).add(n, 'day').format('YYYY-MM-DD');
}

export function isBefore(date1, date2) {
  return dayjs(date1).isBefore(dayjs(date2), 'day');
}
