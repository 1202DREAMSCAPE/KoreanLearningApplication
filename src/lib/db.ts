// src/lib/db.ts
import Dexie from 'dexie';
import type { Table } from 'dexie';
import { liveQuery } from 'dexie';
import dayjs from 'dayjs';
import { readable } from 'svelte/store';
import type { Card, Deck, Settings } from './models';
import { nanoid } from 'nanoid';

export interface ReviewLog {
  id: string; // YYYY-MM-DD
  count: number;
}
export const uuid = () => nanoid();

export const settingsStore = readable<{ dailyGoal: number }>(
  { dailyGoal: 20 },
  (set) => {
    const sub = liveQuery(async () => {
      const s = await getSettings();            // your helper that returns full Settings
      return { dailyGoal: s.dailyGoal ?? 20 };
    }).subscribe(set);
    return () => sub.unsubscribe();
  }
);

class AppDB extends Dexie {
  cards!: Table<Card, string>;
  decks!: Table<Deck, string>;
  settings!: Table<Settings, string>;
  reviewLogs!: Table<ReviewLog, string>;

  constructor() {
    super('KoreanRecall');

    // Bump this if you already used 3; increase by +1
    this.version(4).stores({
      cards: 'id, deckId, createdAt', // remove "due" index if you don't have it
      decks: 'id',
      settings: 'id',
      reviewLogs: 'id',
    }).upgrade(async tx => {
      // Ensure settings rows match the new shape
      const st = tx.table<Settings>('settings');

      await st.toCollection().modify((s: any) => {
        // theme default
        if (s.theme !== 'dark' && s.theme !== 'light' && s.theme !== 'system') {
          s.theme = 'system';
        }
        // reviewDirection default
        if (s.reviewDirection !== 'ko2en' && s.reviewDirection !== 'en2ko' && s.reviewDirection !== 'both') {
          s.reviewDirection = 'ko2en';
        }
        // typingTolerance: migrate number -> object
        if (typeof s.typingTolerance === 'number') {
          s.typingTolerance = { normalizeHangul: true, ignorePunctuation: true };
        }
        if (!s.typingTolerance || typeof s.typingTolerance !== 'object') {
          s.typingTolerance = { normalizeHangul: true, ignorePunctuation: true };
        }
        // font / language sane defaults
        if (!s.font) s.font = 'system';
        if (s.language !== 'en') s.language = 'en';

        // dailyGoal default
        if (s.dailyGoal == null) s.dailyGoal = 20;
      });
    });
  }
}
export const db = new AppDB();

/* ---------- Settings helpers ---------- */
const DEFAULT_SETTINGS: Settings = {
  id: 'main',
  theme: 'system',
  font: 'system',
  language: 'en',
  typingTolerance: { normalizeHangul: true, ignorePunctuation: true },
  reviewDirection: 'ko2en',
  dailyGoal: 20,
};

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('main');
  // merge to ensure all keys exist (and correct union values)
  return {
    ...DEFAULT_SETTINGS,
    ...(s ?? {}),
    // guard bad shapes at runtime too:
    typingTolerance:
      s && typeof (s as any).typingTolerance === 'object'
        ? (s as any).typingTolerance
        : DEFAULT_SETTINGS.typingTolerance,
  };
}

export async function setSettings(patch: Partial<Settings>) {
  const cur = await getSettings();
  await db.settings.put({ ...cur, ...patch, id: 'main' });
}

export async function getDailyGoal(): Promise<number> {
  const s = await getSettings();
  return s.dailyGoal ?? 20;
}
export async function setDailyGoal(n: number) {
  await setSettings({ dailyGoal: Math.max(1, Math.floor(n)) });
}

/* ---------- Review logging & stats ---------- */
export async function logOneReviewNow() {
  const key = dayjs().format('YYYY-MM-DD');
  await db.transaction('rw', db.reviewLogs, async () => {
    const cur = await db.reviewLogs.get(key);
    if (!cur) await db.reviewLogs.put({ id: key, count: 1 });
    else await db.reviewLogs.put({ id: key, count: cur.count + 1 });
  });
}

/** If your Card doesn't have a `due` field, change `getDueISO(c)` to whatever you use (e.g., c.nextReview) */
function getDueISO(c: any): string | undefined {
  return c?.srs?.dueAt ?? c?.due ?? c?.dueISO ?? c?.nextReview;
}

export const cardStats = readable(
  { totalCards: 0, dueToday: 0, reviewedToday: 0 },
  (set) => {
    const sub = liveQuery(async () => {
      const [totalCards, all, todayLog] = await Promise.all([
        db.cards.count(),
        db.cards.toArray(),
        db.reviewLogs.get(dayjs().format('YYYY-MM-DD')),
      ]);
      const start = dayjs().startOf('day').valueOf();
      const end   = dayjs().endOf('day').valueOf();

      const dueToday = all.filter((c: any) => {
        const iso = getDueISO(c);
        if (!iso) return false;
        const t = new Date(iso).getTime();
        return t >= start && t <= end;
      }).length;

      return { totalCards, dueToday, reviewedToday: todayLog?.count ?? 0 };
    }).subscribe(set);

    return () => sub.unsubscribe();
  }
);