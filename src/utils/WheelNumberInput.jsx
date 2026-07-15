// WheelNumberInput.jsx — Numeric input with mouse-wheel + arrow key support.
// State stays in English digits (for parseInt), display is Persian.
import { useEffect, useRef } from 'react';
import { toPersianNum } from './timeUtils';

export default function WheelNumberInput({ value, onChange, placeholder, max, min, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Mouse wheel: change value by ±1 when focused.
    function handleWheel(e) {
      if (document.activeElement !== el) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1 : -1;
      const current = parseInt(value) || 0;
      let next = current + delta;
      if (max != null) next = Math.min(max, next);
      if (min != null) next = Math.max(min, next);
      onChange(String(next));
    }

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [value, onChange, max, min]);

  const displayValue = value ? toPersianNum(value) : '';

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder={placeholder}
      value={displayValue}
      onChange={e => {
        // Accept both Persian and English digit input.
        const persianToEnglish = (str) => str.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
        let val = persianToEnglish(e.target.value);
        val = val.replace(/[^0-9]/g, '');
        onChange(val);
      }}
      onKeyDown={e => {
        // Arrow up/down: change value by ±1.
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const current = parseInt(value) || 0;
          const delta = e.key === 'ArrowUp' ? 1 : -1;
          let next = current + delta;
          if (max != null) next = Math.min(max, next);
          if (min != null) next = Math.max(min, next);
          onChange(String(next));
        }
      }}
      onFocus={e => e.target.select()}
      className={className}
    />
  );
}
