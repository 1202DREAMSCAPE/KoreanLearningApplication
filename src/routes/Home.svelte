<script lang="ts">
  import { db } from '../lib/db';
  import type { Deck } from '../lib/models';
  import dayjs from 'dayjs';
  import { buildDueQueue } from '../lib/srs';
  import MascotProgress from '../components/MascotProgress.svelte';

  let decks: Deck[] = [];
  let dueCount = 0;

  async function load() {
    decks = await db.decks.toArray();
    if (decks.length === 0) {
      const now = new Date().toISOString();
      await db.decks.add({ id: crypto.randomUUID(), name: 'Default', newPerDay: 10, reviewLimit: 100, createdAt: now });
      decks = await db.decks.toArray();
    }
    const due = await buildDueQueue(null, 9999);
    dueCount = due.length;
  }
  load();
</script>

<section class="text-center space-y-6">
  <div class="space-y-3">
    <div class="badge">Today is {dayjs().format('YYYY-MM-DD')}</div>
    <h1 class="h1">Learn Korean ⋆𖦹⋆ˎˊ˗</h1>
    <p class="subtle">Spaced repetition, sentence building, and smooth native Korean input.</p>
  </div>

  <div class="flex flex-wrap justify-center gap-3">
    <a href="#/review" class="btn btn-primary">Start Review {#if dueCount>0}<span class="ml-2 badge">{dueCount} due</span>{/if}</a>
    <a href="#/add" class="btn btn-muted">Add Card</a>
    <a href="#/library" class="btn btn-muted">Library</a>
    <!-- <a href="#/settings" class="btn btn-muted">Settings</a> -->
  </div>
</section>

<section class="grid md:grid-cols-3 gap-4">
  <div class="card p-5">
    <div class="h2">Active recall</div>
    <p class="subtle mt-1">Type answers to force memory retrieval in both directions.</p>
  </div>
  <div class="card p-5">
    <div class="h2">Smart scheduling</div>
    <p class="subtle mt-1">SM-2 intervals keep reviews just before you forget.</p>
  </div>
  <div class="card p-5">
    <div class="h2">Native Korean input</div>
    <p class="subtle mt-1">Use your device’s Korean keyboard (IME) for fast, accurate typing.</p>
  </div>  
</section>

<MascotProgress />
