export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface SRS {
  ease: number;        // SM-2 EF, min 1.3
  interval: number;    // days
  dueAt: string;       // ISO date
  reps: number;        // successful reps in a row
  lapses: number;      // times failed
  lastGrade?: Grade;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  newPerDay: number;
  reviewLimit: number;
  createdAt: string;
}

export interface Card {
  id: string;
  deckId: string;
  front: { hangul: string; romanization?: string; };
  back:  { meaning: string; exampleKo?: string; exampleEn?: string; };
  altAnswers?: string[];
  tags: string[];
  notes?: string;
  due?: string;  
  srs: SRS;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: string;
  theme: 'dark' | 'light' | 'system';
  font: string;
  language: 'en';
  typingTolerance: { normalizeHangul: boolean; ignorePunctuation: boolean };
  reviewDirection: 'ko2en' | 'en2ko' | 'both'; // NEW
  dailyGoal?: number;
}

