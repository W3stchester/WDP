// TimePicker.jsx — Wheel-style time picker with drag + scroll + loop support.
import { useState, useRef, useEffect, useCallback } from 'react';

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PAD = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;
const BAND_SIZE = ITEM_HEIGHT;
const LOOPS = 5; // Virtual copies for infinite loop.

const HOURS_COUNT = 24;
const MINUTES_COUNT = 12; // 00, 05, 10, ... 55 (5-min steps).

function toPersianNum(n) {
  return String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

// Snap minute to nearest 5-min index.
function minuteToIndex(minute) {
  return Math.round(minute / 5) % MINUTES_COUNT;
}

export default function TimePicker({ selectedTime, onSelect, onClose }) {
  // Parse initial time.
  const init = (() => {
    if (selectedTime) {
      const [h, m] = selectedTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        return { h, mIdx: minuteToIndex(m) };
      }
    }
    return { h: 0, mIdx: 0 };
  })();

  const [hour, setHour] = useState(init.h);
  const [minuteIdx, setMinuteIdx] = useState(init.mIdx);

  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const hourJumping = useRef(false);
  const minuteJumping = useRef(false);
  const hourJumpTimer = useRef(null);
  const minuteJumpTimer = useRef(null);

  // Drag state per column.
  const dragState = useRef({
    hour: { active: false, startY: 0, startScrollTop: 0, moved: false },
    minute: { active: false, startY: 0, startScrollTop: 0, moved: false },
  });

  const minute = minuteIdx * 5;

  // Scroll to initial position (middle copy).
  useEffect(() => {
    const t = setTimeout(() => {
      if (hourRef.current) hourRef.current.scrollTop = (2 * HOURS_COUNT + init.h) * ITEM_HEIGHT;
      if (minuteRef.current) minuteRef.current.scrollTop = (2 * MINUTES_COUNT + init.mIdx) * ITEM_HEIGHT;
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape.
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Handle scroll with infinite loop.
  const handleScroll = useCallback((ref, count, setter, jumpingFlag, jumpTimer) => {
    if (!ref.current || jumpingFlag.current) return;
    const scrollTop = ref.current.scrollTop;
    const idx = Math.round(scrollTop / ITEM_HEIGHT);
    const value = ((idx % count) + count) % count;
    setter(value);

    // Jump back to middle copy when near edges (debounced).
    if (jumpTimer.current) clearTimeout(jumpTimer.current);
    if (idx < count) {
      jumpTimer.current = setTimeout(() => {
        jumpingFlag.current = true;
        ref.current.scrollTop = (idx + count) * ITEM_HEIGHT;
        requestAnimationFrame(() => requestAnimationFrame(() => { jumpingFlag.current = false; }));
      }, 80);
    } else if (idx >= (LOOPS - 1) * count) {
      jumpTimer.current = setTimeout(() => {
        jumpingFlag.current = true;
        ref.current.scrollTop = (idx - count) * ITEM_HEIGHT;
        requestAnimationFrame(() => requestAnimationFrame(() => { jumpingFlag.current = false; }));
      }, 80);
    }
  }, []);

  const handleHourScroll = () => handleScroll(hourRef, HOURS_COUNT, setHour, hourJumping, hourJumpTimer);
  const handleMinuteScroll = () => handleScroll(minuteRef, MINUTES_COUNT, setMinuteIdx, minuteJumping, minuteJumpTimer);

  // Drag handlers (mouse + touch via Pointer Events).
  function onPointerDown(key, ref, e) {
    if (!ref.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const state = dragState.current[key];
    state.active = true;
    state.startY = e.clientY;
    state.startScrollTop = ref.current.scrollTop;
    state.moved = false;
    try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
  }

  function onPointerMove(key, ref, e) {
    const state = dragState.current[key];
    if (!state.active || !ref.current) return;
    const dy = e.clientY - state.startY;
    if (Math.abs(dy) > 3) state.moved = true;
    ref.current.scrollTop = state.startScrollTop - dy;
  }

  function onPointerUp(key, ref, e) {
    const state = dragState.current[key];
    if (!state.active) return;
    state.active = false;
    try { e.target.releasePointerCapture(e.pointerId); } catch (_) {}
    // Smooth snap to nearest item.
    if (ref.current && state.moved) {
      const idx = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
      ref.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
    }
  }

  function confirm() {
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    onSelect(`${h}:${m}`);
  }

  // Render a scrollable wheel column.
  function renderColumn(count, currentIdx, ref, onScroll, key, label, displayFn) {
    const totalItems = count * LOOPS;
    const middleStart = 2 * count;
    const activeIdx = middleStart + currentIdx;

    return (
      <div className="flex-1 flex flex-col items-center">
        <div className="text-[10px] text-gray-400 mb-1 font-medium">{label}</div>
        <div className="relative" style={{ height: CONTAINER_HEIGHT }}>
          {/* Center highlight band */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl pointer-events-none z-0"
            style={{ top: PAD, width: BAND_SIZE, height: BAND_SIZE }}
          />
          {/* Scrollable list with drag */}
          <div
            ref={ref}
            onScroll={onScroll}
            onPointerDown={(e) => onPointerDown(key, ref, e)}
            onPointerMove={(e) => onPointerMove(key, ref, e)}
            onPointerUp={(e) => onPointerUp(key, ref, e)}
            onPointerCancel={(e) => onPointerUp(key, ref, e)}
            className="h-full overflow-y-auto relative z-10 cursor-grab active:cursor-grabbing select-none"
            style={{
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              paddingTop: PAD,
              paddingBottom: PAD,
            }}
          >
            {Array.from({ length: totalItems }, (_, i) => {
              const realValue = i % count;
              const directDist = Math.abs(i - activeIdx);
              const wrappedDist = Math.min(
                directDist,
                Math.abs(i - (activeIdx - count)),
                Math.abs(i - (activeIdx + count))
              );
              const isActive = wrappedDist === 0;
              const opacity = isActive ? 1 : Math.max(0.2, 1 - wrappedDist * 0.25);
              return (
                <div
                  key={i}
                  className="flex items-center justify-center pointer-events-none"
                  style={{
                    height: ITEM_HEIGHT,
                    scrollSnapAlign: 'center',
                    opacity,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <span
                    className={`text-xl transition-all ${
                      isActive
                        ? 'font-bold text-blue-600 dark:text-blue-400 text-2xl'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {toPersianNum(displayFn(realValue))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div
        dir="rtl"
        onClick={e => e.stopPropagation()}
        className="surface-modal w-full max-w-sm flex flex-col overflow-hidden"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-center px-4 py-3.5 shrink-0 border-b border-gray-200 dark:border-zinc-800">
          <div className="text-sm font-bold text-gray-900 dark:text-zinc-100">
            انتخاب ساعت
          </div>
        </div>

        {/* Wheels: RTL — first child is on the right (minutes) */}
        <div className="flex items-stretch gap-2 px-4 py-3">
          {renderColumn(
            MINUTES_COUNT,
            minuteIdx,
            minuteRef,
            handleMinuteScroll,
            'minute',
            'دقیقه',
            (i) => String(i * 5).padStart(2, '0')
          )}
          <div className="flex items-center justify-center pb-5">
            <span className="text-2xl font-bold text-gray-300 dark:text-zinc-600">:</span>
          </div>
          {renderColumn(
            HOURS_COUNT,
            hour,
            hourRef,
            handleHourScroll,
            'hour',
            'ساعت',
            (i) => String(i).padStart(2, '0')
          )}
        </div>

        {/* Preview */}
        <div className="text-center py-2.5 shrink-0 border-y border-gray-200 dark:border-zinc-800">
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-wider">
            {toPersianNum(String(hour).padStart(2, '0'))}
            <span className="text-gray-300 dark:text-zinc-600 mx-1">:</span>
            {toPersianNum(String(minute).padStart(2, '0'))}
          </span>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex gap-3 px-4 py-3.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={confirm}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            تایید
          </button>
        </div>
      </div>
    </div>
  );
}
