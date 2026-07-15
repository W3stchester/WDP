// db.js — IndexedDB database via Dexie.
import Dexie from 'dexie';

const db = new Dexie('PlannerDB');

db.version(1).stores({
  dailyPlans: '++id, date, title, type, mode, subject, chapter, startTime, endTime, duration, note, done, baseId',
  weeklyPlans: '++id, startDate, endDate',
  weeklyItems: '++id, weeklyPlanId, title, type, subject, duration, note',
  settings: 'key'
});

export default db;
