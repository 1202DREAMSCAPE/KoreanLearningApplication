// src/lib/seed.ts
import { db, uuid } from './db';
import type { Card, Deck } from './models';

export async function seedIfEmpty() {
  const nowISO = new Date().toISOString();

  // Look up by name without requiring an index
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

  const baseSrs = () => ({
    ease: 2.5,
    interval: 0,
    dueAt: new Date().toISOString(),
    reps: 0,
    lapses: 0 as number
  });

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
    front: { hangul, romanization },
    back: { meaning, exampleKo, exampleEn },
    tags,
    altAnswers: [],
    notes: undefined,
    srs: baseSrs(),
    createdAt: nowISO,
    updatedAt: nowISO
  });

  // 30 Beginner vocab cards
  const beginnerCards: Card[] = [
    mk(beginner.id, '안녕하세요', 'Hello (formal)', 'annyeonghaseyo', '안녕하세요! 반갑습니다.', 'Hello! Nice to meet you.', ['greetings']),
    mk(beginner.id, '감사합니다', 'Thank you (formal)', 'gamsahamnida', '도와주셔서 감사합니다.', 'Thank you for your help.', ['greetings']),
    mk(beginner.id, '네', 'Yes', 'ne', '', '', ['basics']),
    mk(beginner.id, '아니요', 'No', 'aniyo', '', '', ['basics']),
    mk(beginner.id, '물', 'Water', 'mul', '물 좀 주세요.', 'Please give me some water.', ['food']),
    mk(beginner.id, '밥', 'Cooked rice / meal', 'bap', '밥 먹었어요?', 'Did you eat?', ['food']),
    mk(beginner.id, '사랑', 'Love', 'sarang', '', '', ['feelings']),
    mk(beginner.id, '학교', 'School', 'hakgyo', '학교에 가요.', 'I go to school.', ['places']),
    mk(beginner.id, '친구', 'Friend', 'chingu', '친구를 만나요.', 'I meet a friend.', ['people']),
    mk(beginner.id, '가족', 'Family', 'gajok', '', '', ['people']),
    mk(beginner.id, '저는 학생이에요', 'I am a student', 'jeoneun haksaeng-ieyo', '저는 학생이에요.', 'I am a student.', ['intro']),
    mk(beginner.id, '어디에요?', 'Where is it?', 'eodieyo?', '', '', ['travel']),
    mk(beginner.id, '얼마에요?', 'How much is it?', 'eolmaeyo?', '', '', ['shopping']),
    mk(beginner.id, '오늘', 'Today', 'oneul', '', '', ['time']),
    mk(beginner.id, '내일', 'Tomorrow', 'naeil', '', '', ['time']),
    mk(beginner.id, '어제', 'Yesterday', 'eoje', '', '', ['time']),
    mk(beginner.id, '좋아요', 'It’s good / I like it', 'joayo', '정말 좋아요!', 'I really like it!', ['feelings']),
    mk(beginner.id, '싫어요', 'I don’t like it', 'silheoyo', '', '', ['feelings']),
    mk(beginner.id, '알겠습니다', 'Understood / Got it', 'algesseumnida', '', '', ['polite']),
    mk(beginner.id, '잠시만요', 'Just a moment', 'jamsimanyo', '', '', ['polite']),
    mk(beginner.id, '죄송합니다', 'Sorry (formal)', 'joesonghamnida', '정말 죄송합니다.', 'I am truly sorry.', ['polite']),
    mk(beginner.id, '맛있어요', 'It’s delicious', 'masisseoyo', '이 음식 맛있어요.', 'This food is delicious.', ['food']),
    mk(beginner.id, '괜찮아요', 'It’s okay / No problem', 'gwaenchanayo', '', '', ['polite']),
    mk(beginner.id, '병원', 'Hospital', 'byeongwon', '', '', ['places']),
    mk(beginner.id, '약국', 'Pharmacy', 'yakguk', '', '', ['places']),
    mk(beginner.id, '지하철', 'Subway', 'jihacheol', '지하철을 타요.', 'I take the subway.', ['transport']),
    mk(beginner.id, '버스', 'Bus', 'beoseu', '', '', ['transport']),
    mk(beginner.id, '택시', 'Taxi', 'taegsi', '', '', ['transport']),
    mk(beginner.id, '시장', 'Market', 'sijang', '', '', ['places']),
    mk(beginner.id, '은행', 'Bank', 'eunhaeng', '', '', ['places'])
  ];

  // 20 Intermediate grammar/sentences
  const inter = intermediate!;
  const intermediateCards: Card[] = [
    mk(inter.id, '저는 학생이에요.', 'I am a student.', 'jeoneun haksaeng-ieyo', '저는 학생이에요.', 'I am a student.', ['intro','grammar']),
    mk(inter.id, '저는 한국 사람이에요.', 'I am Korean.', 'jeoneun hanguk saram-ieyo', '', '', ['intro']),
    mk(inter.id, '저는 미국에서 왔어요.', 'I came from the USA.', 'jeoneun migug-eseo wasseoyo', '', '', ['travel','intro']),
    mk(inter.id, '이것은 책이에요.', 'This is a book.', 'igeoseun chaeg-ieyo', '', '', ['grammar','demonstratives']),
    mk(inter.id, '저는 밥을 먹어요.', 'I eat (rice)/I eat a meal.', 'jeoneun babeul meogeoyo', '', '', ['verbs']),
    mk(inter.id, '저는 친구를 만나요.', 'I meet a friend.', 'jeoneun chingureul mannayo', '', '', ['verbs']),
    mk(inter.id, '저는 영화를 봐요.', 'I watch a movie.', 'jeoneun yeonghwareul bwayo', '', '', ['verbs']),
    mk(inter.id, '날씨가 좋아요.', 'The weather is nice.', 'nalssiga joayo', '', '', ['adjectives']),
    mk(inter.id, '비가 와요.', 'It is raining.', 'biga wayo', '', '', ['weather']),
    mk(inter.id, '학교에 가요.', 'I go to school.', 'hakgyoe gayo', '', '', ['location']),
    mk(inter.id, '저는 커피를 마셔요.', 'I drink coffee.', 'jeoneun keopireul masyeoyo', '', '', ['verbs','food']),
    mk(inter.id, '저는 음악을 들어요.', 'I listen to music.', 'jeoneun eumageul deureoyo', '', '', ['verbs']),
    mk(inter.id, '책을 읽어요.', 'I read a book.', 'chaegeul ilgeoyo', '', '', ['verbs']),
    mk(inter.id, '운동을 해요.', 'I exercise.', 'undongeul haeyo', '', '', ['verbs','health']),
    mk(inter.id, '저는 요리를 해요.', 'I cook.', 'jeoneun yorireul haeyo', '', '', ['verbs','food']),
    mk(inter.id, '산에 가요.', 'I go to the mountain.', 'sane gayo', '', '', ['location','nature']),
    mk(inter.id, '바다에 가요.', 'I go to the sea.', 'badae gayo', '', '', ['location','nature']),
    mk(inter.id, '저는 여행을 해요.', 'I travel.', 'jeoneun yeohaengeul haeyo', '', '', ['travel']),
    mk(inter.id, '한국어를 공부해요.', 'I study Korean.', 'hangug-eoreul gongbuhaeyo', '', '', ['study']),
    mk(inter.id, '저는 쉬어요.', 'I rest.', 'jeoneun swi-eoyo', '', '', ['health'])
  ];

  await db.cards.bulkAdd([...beginnerCards, ...intermediateCards]);
  console.info('[seed] Inserted', beginnerCards.length + intermediateCards.length, 'cards');
}
