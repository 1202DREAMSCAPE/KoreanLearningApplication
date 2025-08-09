import { z } from 'zod';

export const srsSchema = z.object({
  ease: z.number().min(1.3).max(3.5),
  interval: z.number().int().min(0),
  dueAt: z.string(),
  reps: z.number().int().min(0),
  lapses: z.number().int().min(0),
  lastGrade: z.enum(['again','hard','good','easy']).optional()
});

export const deckSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  newPerDay: z.number().int().min(0),
  reviewLimit: z.number().int().min(0),
  createdAt: z.string()
});

export const cardSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  front: z.object({ hangul: z.string(), romanization: z.string().optional() }),
  back:  z.object({ meaning: z.string(), exampleKo: z.string().optional(), exampleEn: z.string().optional() }),
  altAnswers: z.array(z.string()).optional(),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  srs: srsSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

export const settingsSchema = z.object({
  id: z.literal('singleton'),
  dailyGoal: z.number().int().min(1),
  theme: z.enum(['dark','light']),
  font: z.string(),
  language: z.literal('en'),
  typingTolerance: z.object({
    normalizeHangul: z.boolean(),
    ignorePunctuation: z.boolean()
  }),
  reviewDirection: z.enum(['ko2en','en2ko','both']) // NEW
});


export type ExportBlob = z.infer<typeof exportSchema>;
export const exportSchema = z.object({
  meta: z.object({ version: z.string(), exportedAt: z.string() }),
  decks: z.array(deckSchema),
  cards: z.array(cardSchema),
  settings: settingsSchema.optional(),
  dictionary: z.array(z.object({
    headwordKo: z.string(), pos: z.string().optional(),
    gloss: z.string(), notes: z.string().optional(), tags: z.array(z.string()).optional()
  })).optional()
});
