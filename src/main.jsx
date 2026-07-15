// main.jsx — Entry point. Disables Space/Enter activation on buttons.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Prevent Space/Enter from re-triggering button click (browser default).
document.addEventListener('keydown', (e) => {
  const target = e.target;
  if (!target) return;
  const tag = target.tagName;
  if (tag !== 'BUTTON' && target.getAttribute('role') !== 'button') return;
  if (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space' || e.key === 'Enter') {
    e.preventDefault();
  }
}, true);

// Blur buttons after mouse click (removes lingering focus state).
document.addEventListener('mouseup', (e) => {
  const target = e.target;
  if (!target) return;
  const tag = target.tagName;
  if (tag === 'BUTTON' || target.getAttribute('role') === 'button') {
    setTimeout(() => {
      if (target && typeof target.blur === 'function') target.blur();
    }, 0);
  }
}, true);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
