import dayjs from 'dayjs';
import type { Card, Grade } from './models';

const clamp = (n:number, lo:number, hi:number)=>Math.max(lo, Math.min(hi, n));

function sm2EF(prevEF:number, q:0|1|2|3|4|5){
  const ef = prevEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return clamp(parseFloat(ef.toFixed(2)), 1.3, 3.5);
}

function mapGradeToQ(grade: Grade): 0|1|2|3|4|5 {
  switch (grade) {
    case 'again': return 1; // you can use 0 or 1; 1 is a bit gentler
    case 'hard':  return 3;
    case 'good':  return 4;
    case 'easy':  return 5;
  }
}

export function gradeCard(card: Card, grade: Grade, now = new Date()): Card {
  const q = mapGradeToQ(grade);
  const srs = { ...card.srs };
  const today = dayjs(now).startOf('day');

  if (q < 3) {
    srs.reps = 0;
    srs.lapses += 1;
    srs.interval = 1;         // learning step: 1 day
    srs.ease = sm2EF(srs.ease, q);
    srs.dueAt = today.add(1, 'day').toISOString();
  } else {
    srs.reps += 1;
    if (srs.reps === 1) {
      srs.interval = 1;
    } else if (srs.reps === 2) {
      srs.interval = 3;       // gentle second step
    } else {
      srs.ease = sm2EF(srs.ease, q);
      srs.interval = Math.max(1, Math.round(srs.interval * srs.ease));
    }
    // little "easy" bonus
    if (grade === 'easy') srs.interval = Math.round(srs.interval * 1.3);
    srs.dueAt = today.add(srs.interval, 'day').toISOString();
  }
  srs.lastGrade = grade;

  return { ...card, srs, updatedAt: new Date().toISOString() };
}

export async function buildDueQueue(deckId: string | null, limit: number) {
  // naive: fetch due cards (<= today) optionally filtered by deck
  // NOTE: you can mix in “new” cards later if you want.
  const todayISO = dayjs().endOf('day').toISOString();
  // We’ll fetch all and filter in memory for simplicity (optimize later)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { db } = await import('./db');
  const coll = deckId ? db.cards.where('deckId').equals(deckId) : db.cards.toCollection();
  const due = await coll.filter(c => c.srs.dueAt <= todayISO).limit(limit).toArray();
  return due;
}
