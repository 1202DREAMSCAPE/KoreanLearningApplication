import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Card, Deck, Settings } from './models';

export class KoreanDB extends Dexie {
  cards!: Table<Card, string>;
  decks!: Table<Deck, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('korean-srs');
    this.version(1).stores({
      // primary key, plus indexes. *tags = multiEntry index
      cards: 'id, deckId, dueAt, *tags',
      decks: 'id, name',
      settings: 'id'
    });
  }
}
export const db = new KoreanDB();

export const uuid = () =>
  crypto.randomUUID ? crypto.randomUUID() :
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c=>{
    const r = (Math.random()*16)|0, v = c==='x'? r : (r&0x3|0x8);
    return v.toString(16);
  });
