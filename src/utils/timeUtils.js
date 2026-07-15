// timeUtils.js — Time helpers + Persian digit conversion.

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

// Convert any number/string to Persian digits.
export function toPersianNum(num) {
  return String(num).replace(/\d/g, d => PERSIAN_DIGITS[d]);
}

// Convert "HH:MM" to minutes.
function timeToMinutes(time) {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Duration in minutes between two times. Returns -1 if invalid.
// Overnight range: end=00:00 with start>=23:00 is valid.
export function calculateDuration(start, end) {
  if (!start || !end) return 0;
  let s = timeToMinutes(start);
  let e = timeToMinutes(end);
  if (e === 0 && s >= 1380) e = 1440;
  if (e <= s) return -1;
  return e - s;
}

// Check if two time ranges overlap.
export function hasOverlap(start1, end1, start2, end2) {
  if (!start1 || !end1 || !start2 || !end2) return false;
  let s1 = timeToMinutes(start1);
  let e1 = timeToMinutes(end1);
  let s2 = timeToMinutes(start2);
  let e2 = timeToMinutes(end2);
  if (e1 === 0 && s1 >= 1380) e1 = 1440;
  if (e2 === 0 && s2 >= 1380) e2 = 1440;
  return s1 < e2 && s2 < e1;
}

// Format minutes as Persian "X ساعت و Y دقیقه".
export function formatMinutes(min) {
  if (min == null || min === 0) return '۰ دقیقه';
  const h = Math.floor(min / 60);
  const m = min % 60;
  let result = '';
  if (h > 0 && m > 0) result += `${toPersianNum(h)} ساعت و `;
  if (h > 0 && m <= 0) result += `${toPersianNum(h)} ساعت `;
  if (m > 0) result += `${toPersianNum(m)} دقیقه`;
  return result.trim();
}
