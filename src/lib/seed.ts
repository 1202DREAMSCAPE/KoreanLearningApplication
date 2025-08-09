// src/lib/seed.ts
import { db, uuid } from './db';
import type { Card, Deck } from './models';

export async function seedIfEmpty() {
  const nowISO = new Date().toISOString();

  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };

  // Find or create decks
  let beginner: Deck | undefined =
    (await db.decks.filter(d => d.name === 'Beginner Vocabulary').first()) ?? undefined;

  let intermediate: Deck | undefined =
    (await db.decks.filter(d => d.name === 'Intermediate Grammar').first()) ?? undefined;

  if (!beginner) {
    beginner = {
      id: uuid(),
      name: 'Beginner Vocabulary',
      newPerDay: 10,
      reviewLimit: 100,
      createdAt: nowISO
    };
    await db.decks.add(beginner);
  }

  if (!intermediate) {
    intermediate = {
      id: uuid(),
      name: 'Intermediate Grammar',
      newPerDay: 10,
      reviewLimit: 100,
      createdAt: nowISO
    };
    await db.decks.add(intermediate);
  }

  // Skip if any cards already exist
  const cardCount = await db.cards.count();
  if (cardCount > 0) {
    console.info('[seed] Cards already present, skipping seed.');
    return;
  }

  // --- SRS defaults (tomorrow). To make them due now, change to `new Date().toISOString()`.
  const baseSrs = () => ({
    ease: 2.5,
    interval: 0,
    dueAt: new Date().toISOString(),
    reps: 0,
    lapses: 0 as number
  });

  // Must follow your signature exactly: romanization? → exampleKo? → exampleEn? → tags[]
  const mk = (
    deckId: string,
    hangul: string,
    meaning: string,
    romanization?: string,
    exampleKo?: string,
    exampleEn?: string,
    tags: string[] = []
  ): Card => ({
    id: uuid(),
    deckId,
    front: { hangul, romanization: romanization || undefined },
    back: { meaning, exampleKo, exampleEn },
    tags,
    altAnswers: [],
    notes: undefined,
    srs: baseSrs(),
    createdAt: nowISO,
    updatedAt: nowISO
  });

  // Helper types/lists
  type Entry = {
    h: string; // hangul
    m: string; // meaning
    r?: string; // romanization
    ek?: string; // exampleKo
    ee?: string; // exampleEn
    t?: string[]; // tags
  };

  const toCards = (deckId: string, list: Entry[], defaultTags: string[] = []) =>
    list.map(e =>
      mk(deckId, e.h, e.m, e.r, e.ek, e.ee, e.t ?? defaultTags)
    );

  // -------------------------
  // BEGINNER: nouns/phrases
  // -------------------------
  const people: Entry[] = [
    { h: '사람', m: 'person', r: 'saram' },
    { h: '남자', m: 'man', r: 'namja' },
    { h: '여자', m: 'woman', r: 'yeoja' },
    { h: '아이', m: 'child', r: 'ai' },
    { h: '학생', m: 'student', r: 'haksaeng' },
    { h: '선생님', m: 'teacher', r: 'seonsaengnim' },
    { h: '친구', m: 'friend', r: 'chingu' }
  ];

  const family: Entry[] = [
    { h: '부모님', m: 'parents', r: 'bumonim' },
    { h: '어머니', m: 'mother', r: 'eomeoni' },
    { h: '아버지', m: 'father', r: 'abeoji' },
    { h: '엄마', m: 'mom', r: 'eomma' },
    { h: '아빠', m: 'dad', r: 'appa' },
    { h: '아들', m: 'son', r: 'adeul' },
    { h: '딸', m: 'daughter', r: 'ttal' }
  ];

  const objects: Entry[] = [
    { h: '가방', m: 'bag', r: 'gabang' },
    { h: '핸드폰', m: 'cell phone', r: 'haendeupon' },
    { h: '지갑', m: 'wallet', r: 'jigap' },
    { h: '열쇠', m: 'key', r: 'yeolsoe' },
    { h: '책', m: 'book', r: 'chaek' },
    { h: '펜', m: 'pen', r: 'pen' },
    { h: '종이', m: 'paper', r: 'jongi' },
    { h: '컴퓨터', m: 'computer', r: 'keompyuteo' },
    { h: '노트북', m: 'laptop', r: 'noteubuk' },
    { h: '티비', m: 'TV', r: 'tibi' }
  ];

  const transport: Entry[] = [
    { h: '자동차', m: 'car', r: 'jadongcha' },
    { h: '지하철', m: 'subway/metro', r: 'jihacheol' },
    { h: '기차', m: 'train', r: 'gicha' },
    { h: '버스', m: 'bus', r: 'beoseu' },
    { h: '택시', m: 'taxi', r: 'taegsi' },
    { h: '비행기', m: 'airplane', r: 'bihaenggi' },
    { h: '자전거', m: 'bicycle', r: 'jajeongeo' },
    { h: '역', m: 'station', r: 'yeok' },
    { h: '공항', m: 'airport', r: 'gonghang' }
  ];

  const places: Entry[] = [
    { h: '집', m: 'home/house', r: 'jip' },
    { h: '학교', m: 'school', r: 'hakgyo' },
    { h: '회사', m: 'company/workplace', r: 'hoesa' },
    { h: '공원', m: 'park', r: 'gongwon' },
    { h: '식당', m: 'restaurant', r: 'sikdang' },
    { h: '카페', m: 'cafe', r: 'kape' },
    { h: '마트', m: 'supermarket', r: 'mateu' },
    { h: '병원', m: 'hospital', r: 'byeongwon' },
    { h: '약국', m: 'pharmacy', r: 'yakguk' }
  ];

  const basicPhrases: Entry[] = [
    { h: '안녕', m: 'hi/bye (casual)', r: 'annyeong' },
    { h: '안녕하세요', m: 'hello (polite)', r: 'annyeonghaseyo', ek: '안녕하세요! 반갑습니다.', ee: 'Hello! Nice to meet you.' },
    { h: '감사합니다', m: 'thank you (formal)', r: 'gamsahamnida' },
    { h: '고마워요', m: 'thank you (polite)', r: 'gomawoyo' },
    { h: '죄송합니다', m: 'I’m sorry (formal)', r: 'joesonghamnida' },
    { h: '미안해요', m: 'sorry (polite)', r: 'mianhaeyo' },
    { h: '괜찮아요', m: 'it’s okay / no problem', r: 'gwaenchanayo' },
    { h: '주세요', m: 'please (give me)', r: 'juseyo', ek: '물 주세요.', ee: 'Water, please.' },
    { h: '얼마예요?', m: 'how much is it?', r: 'eolmayeyo' },
    { h: '어디예요?', m: 'where is it?', r: 'eodiyeyo' },
    { h: '맛있어요', m: 'it’s delicious', r: 'masisseoyo' },
    { h: '매워요', m: 'it’s spicy', r: 'maewoyo' },
    { h: '있어요', m: 'there is / I have', r: 'isseoyo' },
    { h: '없어요', m: 'there isn’t / I don’t have', r: 'eopseoyo' },
    { h: '도와주세요', m: 'please help', r: 'dowajuseyo' },
    { h: '천천히 말해 주세요', m: 'please speak slowly', r: 'cheoncheonhi malhae juseyo' },
    { h: '영수증 주세요', m: 'receipt, please', r: 'yeongsujeung juseyo' },
    { h: '화장실 어디예요?', m: 'where is the bathroom?', r: 'hwajangsil eodiyeyo' }
  ];

  // -------------------------
  // INTERMEDIATE: verbs/adj/adv/particles/cost
  // -------------------------
  const verbs: Entry[] = [
    { h: '하다', m: 'to do', r: 'hada' },
    { h: '주다', m: 'to give', r: 'juda' },
    { h: '받다', m: 'to receive', r: 'batda' },
    { h: '가다', m: 'to go', r: 'gada' },
    { h: '오다', m: 'to come', r: 'oda' },
    { h: '먹다', m: 'to eat', r: 'meokda', ek: '밥을 먹어요.', ee: 'I eat a meal.' },
    { h: '마시다', m: 'to drink', r: 'masida' },
    { h: '자다', m: 'to sleep', r: 'jada' },
    { h: '일어나다', m: 'to get up', r: 'ireonada' },
    { h: '만나다', m: 'to meet', r: 'mannada' },
    { h: '생각하다', m: 'to think', r: 'saenggakhada' },
    { h: '좋아하다', m: 'to like', r: 'joahada' },
    { h: '싫어하다', m: 'to dislike', r: 'sireo-hada' },
    { h: '알다', m: 'to know', r: 'alda' },
    { h: '이해하다', m: 'to understand', r: 'ihae-hada' },
    // 하다 compounds
    { h: '운동하다', m: 'to exercise', r: 'undong-hada' },
    { h: '공부하다', m: 'to study', r: 'gongbu-hada' },
    { h: '요리하다', m: 'to cook', r: 'yori-hada' },
    { h: '청소하다', m: 'to clean', r: 'cheongso-hada' },
    { h: '결정하다', m: 'to decide', r: 'gyeoljeong-hada' },
    { h: '도착하다', m: 'to arrive', r: 'dochag-hada' },
    { h: '출발하다', m: 'to depart', r: 'chulbal-hada' },
    { h: '운전하다', m: 'to drive', r: 'unjeon-hada' }
  ];

  const adjectives: Entry[] = [
    { h: '크다', m: 'to be big', r: 'keuda' },
    { h: '작다', m: 'to be small', r: 'jakda' },
    { h: '빠르다', m: 'to be fast', r: 'ppareuda' },
    { h: '느리다', m: 'to be slow', r: 'neurida' },
    { h: '좋다', m: 'to be good', r: 'jota' },
    { h: '나쁘다', m: 'to be bad', r: 'nappeuda' },
    { h: '행복하다', m: 'to be happy', r: 'haengbok-hada' },
    { h: '슬프다', m: 'to be sad', r: 'seulpeuda' },
    { h: '멀다', m: 'to be far', r: 'meolda' },
    { h: '가깝다', m: 'to be near', r: 'gakkapda' }
  ];

  const adverbs: Entry[] = [
    { h: '천천히', m: 'slowly', r: 'cheoncheonhi' },
    { h: '빨리', m: 'quickly', r: 'ppalli' },
    { h: '조용히', m: 'quietly', r: 'joyonghi' },
    { h: '완전히', m: 'completely', r: 'wanjeonhi' },
    { h: '특별히', m: 'especially', r: 'teukbyeolhi' },
    { h: '항상', m: 'always', r: 'hangsang' },
    { h: '가끔', m: 'sometimes', r: 'gakkeum' },
    { h: '보통', m: 'usually', r: 'botong' },
    { h: '자주', m: 'often', r: 'jaju' }
  ];

  const particles: Entry[] = [
    { h: '은/는', m: 'topic marker', r: 'eun/neun' },
    { h: '이/가', m: 'subject marker', r: 'i/ga' },
    { h: '을/를', m: 'object marker', r: 'eul/reul' },
    { h: '에', m: 'at/in/on; to (time/place/destination)', r: 'e' },
    { h: '에서', m: 'at/in/from (location/origin)', r: 'eseo' },
    { h: '로/으로', m: 'toward; by/with (method)', r: 'ro/euro' },
    { h: '하고', m: 'and/with', r: 'hago' },
    { h: '부터', m: 'from (start)', r: 'buteo' },
    { h: '까지', m: 'until (end)', r: 'kkaji' },
    { h: '에게/한테', m: 'to (recipient)', r: 'ege/hante' }
  ];

  const costFamily: Entry[] = [
    { h: '비용', m: 'cost/expense', r: 'biyong' },
    { h: '생활비', m: 'living expenses', r: 'saenghwalbi' },
    { h: '식비', m: 'food expenses', r: 'sikbi' },
    { h: '학비', m: 'tuition', r: 'hakbi' },
    { h: '여행비', m: 'travel expenses', r: 'yeohaengbi' },
    { h: '이사 비용', m: 'moving expenses', r: 'isa biyong' },
    { h: '결혼 비용', m: 'wedding expenses', r: 'gyeolhon biyong' }
  ];

  // Build beginner deck
  const beginnerCards: Card[] = [
    ...toCards(beginner!.id, people, ['people']),
    ...toCards(beginner!.id, family, ['family']),
    ...toCards(beginner!.id, objects, ['objects']),
    ...toCards(beginner!.id, transport, ['transport']),
    ...toCards(beginner!.id, places, ['places']),
    ...toCards(beginner!.id, basicPhrases, ['phrase'])
  ];

  // Build intermediate deck
  const intermediateCards: Card[] = [
    ...toCards(intermediate!.id, verbs, ['verb']),
    ...toCards(intermediate!.id, adjectives, ['adjective']),
    ...toCards(intermediate!.id, adverbs, ['adverb']),
    ...toCards(intermediate!.id, particles, ['particle']),
    ...toCards(intermediate!.id, costFamily, ['cost'])
  ];

  await db.cards.bulkAdd([...beginnerCards, ...intermediateCards]);
  console.info('[seed] Inserted', beginnerCards.length + intermediateCards.length, 'cards');
}
