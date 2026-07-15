// JalaliDatePicker.jsx — Persian (Jalali) calendar picker.
import { useState, useEffect, useRef } from "react";
import jalaali from "jalaali-js";

const { toJalaali, toGregorian, jalaaliMonthLength } = jalaali;

function toGregorianStr(jy, jm, jd) {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

// First day of week (Saturday=0 ... Friday=6) for given Jalali month.
function firstDayOfWeek(jy, jm) {
  const { gy, gm, gd } = toGregorian(jy, jm, 1);
  const dow = new Date(gy, gm - 1, gd).getDay(); // 0=Sun
  return (dow + 1) % 7;
}

function toPersianNum(n) {
  return String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

const MONTH_NAMES = [
  "فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور",
  "مهر","آبان","آذر","دی","بهمن","اسفند",
];

const WEEK_DAYS = ["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه"];

const YEAR_MIN = 1400;
const YEAR_MAX = 1415;

export default function JalaliDatePicker({ selectedDate, onSelect, onClose }) {
  const today = (() => {
    const now = new Date();
    return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  })();

  const init = (() => {
    if (selectedDate) {
      const [gy, gm, gd] = selectedDate.split("-").map(Number);
      if (!isNaN(gy)) return toJalaali(gy, gm, gd);
    }
    return null;
  })();

  const [view, setView] = useState("day");
  const [cursor, setCursor] = useState({
    jy: init?.jy ?? today.jy,
    jm: init?.jm ?? today.jm,
  });
  const [selected, setSelected] = useState(init);
  const [slideDir, setSlideDir] = useState(null);

  // Close on Escape.
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const confirmSelection = () => {
    if (!selected || view !== "day") return;
    onSelect(toGregorianStr(selected.jy, selected.jm, selected.jd));
  };

  const selectToday = () => {
    setSelected(today);
    setCursor({ jy: today.jy, jm: today.jm });
    setView("day");
  };

  const prevMonth = () => {
    setSlideDir("left");
    setCursor(c => c.jm === 1 ? { jy: c.jy - 1, jm: 12 } : { ...c, jm: c.jm - 1 });
    setTimeout(() => setSlideDir(null), 220);
  };

  const nextMonth = () => {
    setSlideDir("right");
    setCursor(c => c.jm === 12 ? { jy: c.jy + 1, jm: 1 } : { ...c, jm: c.jm + 1 });
    setTimeout(() => setSlideDir(null), 220);
  };

  // Swipe: right-to-left = prev month, left-to-right = next month (RTL).
  const tx = useRef(null);
  const ty = useRef(null);
  const handleTouchStart = (e) => {
    tx.current = e.touches[0].clientX;
    ty.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (tx.current === null || view !== "day") return;
    const dx = e.changedTouches[0].clientX - tx.current;
    const dy = e.changedTouches[0].clientY - ty.current;
    tx.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) prevMonth(); else nextMonth();
  };

  const renderDays = () => {
    const total = jalaaliMonthLength(cursor.jy, cursor.jm);
    const offset = firstDayOfWeek(cursor.jy, cursor.jm);
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />);
    for (let d = 1; d <= total; d++) {
      const isToday = cursor.jy === today.jy && cursor.jm === today.jm && d === today.jd;
      const isSel = selected?.jy === cursor.jy && selected?.jm === cursor.jm && selected?.jd === d;
      const col = (offset + d - 1) % 7;
      cells.push(
        <button
          key={d}
          onClick={() => setSelected({ jy: cursor.jy, jm: cursor.jm, jd: d })}
          className={`
            w-9 h-9 rounded-full text-sm font-medium flex items-center justify-center mx-auto transition-all
            ${isSel ? "bg-blue-600 text-white"
              : isToday ? "border-2 border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
              : col === 6 ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200"}
          `}
        >
          {toPersianNum(d)}
        </button>
      );
    }
    return cells;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div
        dir="rtl"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="surface-modal w-full max-w-sm flex flex-col mx-4 overflow-hidden"
        style={{ height: 440, animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 shrink-0 border-b border-gray-200 dark:border-zinc-800">
          <button
            onClick={prevMonth}
            disabled={view !== "day"}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            ماه قبل
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setView(v => v === "month" ? "day" : "month")}
              className="text-sm font-bold text-gray-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {MONTH_NAMES[cursor.jm - 1]}
            </button>
            <button
              onClick={() => setView(v => v === "year" ? "day" : "year")}
              className="text-sm font-bold text-gray-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {toPersianNum(cursor.jy)}
            </button>
          </div>

          <button
            onClick={nextMonth}
            disabled={view !== "day"}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            ماه بعد
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-3">
          {view === "day" && (
            <div
              key={`${cursor.jy}-${cursor.jm}`}
              style={{
                animation: slideDir
                  ? `${slideDir === "left" ? "slideInLeft" : "slideInRight"} 0.22s ease-out`
                  : "none",
              }}
            >
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mt-3 mb-2">
                {WEEK_DAYS.map((d, i) => (
                  <div
                    key={d}
                    className={`text-center py-1 ${i === 6 ? "text-red-400" : "text-gray-400 dark:text-zinc-500"}`}
                    style={{ fontSize: "0.6rem" }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {renderDays()}
              </div>
            </div>
          )}

          {view === "month" && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {MONTH_NAMES.map((name, i) => (
                <button
                  key={i}
                  onClick={() => { setCursor(c => ({ ...c, jm: i + 1 })); setView("day"); }}
                  className={`h-10 rounded-xl text-sm font-medium transition-colors
                    ${cursor.jm === i + 1 ? "chip-active" : "chip text-gray-700 dark:text-zinc-200"}`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {view === "year" && (
            <div className="grid grid-cols-3 gap-2 pt-2 overflow-y-auto" style={{ maxHeight: 300 }}>
              {Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i).map(y => (
                <button
                  key={y}
                  onClick={() => { setCursor(c => ({ ...c, jy: y })); setView("month"); }}
                  className={`h-10 rounded-xl text-sm font-medium transition-colors
                    ${cursor.jy === y ? "chip-active" : "chip text-gray-700 dark:text-zinc-200"}`}
                >
                  {toPersianNum(y)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex gap-3 px-4 py-3.5 border-t border-gray-200 dark:border-zinc-800">
          <button
            onClick={selectToday}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            امروز
          </button>
          <button
            onClick={confirmSelection}
            disabled={!selected || view !== "day"}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ثبت تاریخ
          </button>
        </div>
      </div>
    </div>
  );
}
