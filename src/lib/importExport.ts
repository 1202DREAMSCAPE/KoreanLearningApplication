import { exportSchema } from './schemas';
import type { Card, Deck, Settings } from './models';
import { db } from './db';

export async function exportAll() {
  const [decks, cards, settings] = await Promise.all([
    db.decks.toArray(), db.cards.toArray(), db.settings.get('singleton')
  ]);
  const payload = {
    meta: { version: '0.1.0', exportedAt: new Date().toISOString() },
    decks, cards, settings
  };
  const parsed = exportSchema.parse(payload); // validate
  const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'korean-srs-export.json'; a.click();
  URL.revokeObjectURL(url);
}

export async function importAll(file: File) {
  const text = await file.text();
  const json = JSON.parse(text);
  const data = exportSchema.parse(json);
  await db.transaction('rw', db.decks, db.cards, db.settings, async ()=>{
    await db.decks.clear(); await db.cards.clear();
    await db.decks.bulkAdd(data.decks as Deck[]);
    await db.cards.bulkAdd(data.cards as Card[]);
    if (data.settings) await db.settings.put(data.settings as Settings);
  });
}
