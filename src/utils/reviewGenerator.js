import { addDays } from './dateUtils';
import { REVIEW_SCHEDULE } from '../constants';
import db from '../db';

// Generate default reviews for a base plan.
export async function generateReviews(basePlan) {
  const { date, subject, chapter, note, id } = basePlan;
  const reviews = [];

  for (let i = 0; i < REVIEW_SCHEDULE.length; i++) {
    const schedule = REVIEW_SCHEDULE[i];
    reviews.push(buildReview({
      date: addDays(date, schedule.days),
      label: schedule.label,
      titlePrefix: schedule.titlePrefix,
      mode: schedule.type,
      subject, chapter, note,
      baseId: id,
      baseDate: date,
      reviewIndex: i,
    }));
  }

  await db.dailyPlans.bulkAdd(reviews);
  return reviews;
}

// Generate custom reviews from user-defined schedule.
export async function generateCustomReviews(basePlan, customSchedule) {
  const { date, subject, chapter, note, id } = basePlan;
  const reviews = [];

  for (let i = 0; i < customSchedule.length; i++) {
    const item = customSchedule[i];
    reviews.push(buildReview({
      date: addDays(date, item.days),
      label: item.label,
      titlePrefix: item.label,
      mode: 'مرور',
      subject, chapter, note,
      baseId: id,
      baseDate: date,
      reviewIndex: i,
    }));
  }

  await db.dailyPlans.bulkAdd(reviews);
  return reviews;
}

// Shared review-plan builder.
function buildReview({ date, label, titlePrefix, mode, subject, chapter, note, baseId, baseDate, reviewIndex }) {
  return {
    date,
    title: `${titlePrefix} ${subject} فصل ${chapter}`,
    type: 'درسی',
    mode,
    subject,
    chapter,
    startTime: '',
    endTime: '',
    duration: 0,
    baseNote: note || '',
    inheritedExtraNotes: [],
    extraNote: '',
    done: false,
    baseId,
    reviewIndex,
    reviewBadge: label,
    baseDate,
  };
}

// Cascade edits to derived reviews when base plan changes.
// Rebuilds title from each review's stored reviewBadge (works for both default & custom).
export async function cascadeEditToReviews(baseId, updatedFields) {
  const reviews = await db.dailyPlans.where('baseId').equals(baseId).toArray();

  for (const review of reviews) {
    const updates = {};

    // Rebuild title if subject or chapter changed — use stored badge, not REVIEW_SCHEDULE.
    if (updatedFields.subject !== undefined || updatedFields.chapter !== undefined) {
      const sub = updatedFields.subject ?? review.subject;
      const ch = updatedFields.chapter ?? review.chapter;
      updates.title = `${review.reviewBadge} ${sub} فصل ${ch}`;
      if (updatedFields.subject !== undefined) updates.subject = updatedFields.subject;
      if (updatedFields.chapter !== undefined) updates.chapter = updatedFields.chapter;
    }

    if (updatedFields.note !== undefined) {
      updates.baseNote = updatedFields.note;
    }

    if (Object.keys(updates).length > 0) {
      await db.dailyPlans.update(review.id, updates);
    }
  }
}

// Cascade delete: remove all reviews derived from a base plan.
export async function cascadeDeleteReviews(baseId) {
  const reviews = await db.dailyPlans.where('baseId').equals(baseId).toArray();
  const ids = reviews.map(r => r.id);
  if (ids.length > 0) {
    await db.dailyPlans.bulkDelete(ids);
  }
}

// When a review's extraNote changes, rebuild inheritedExtraNotes for later reviews.
export async function propagateExtraNote(baseId, editedReviewIndex, newExtraNote) {
  const reviews = await db.dailyPlans
    .where('baseId')
    .equals(baseId)
    .toArray();

  reviews.sort((a, b) => a.reviewIndex - b.reviewIndex);

  for (const review of reviews) {
    if (review.reviewIndex <= editedReviewIndex) continue;

    const inherited = [];
    for (const prev of reviews) {
      if (prev.reviewIndex >= review.reviewIndex) break;
      if (prev.extraNote && prev.extraNote.trim()) {
        inherited.push({ badge: prev.reviewBadge, note: prev.extraNote });
      }
    }

    await db.dailyPlans.update(review.id, { inheritedExtraNotes: inherited });
  }
}
