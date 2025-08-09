<script lang="ts">
  import { onMount } from 'svelte';
  import { buildDueQueue } from '../lib/srs';
  import ReviewPanel from '../components/ReviewPanel.svelte';
  import type { Card, Settings } from '../lib/models';
  import { getSettings } from '../lib/db';

  let cards: Card[] = [];
  let settings: Settings | null = null;
  let loading = true;

  async function init() {
    loading = true;
    settings = await getSettings();                 // unified helper with defaults
    cards = await buildDueQueue(null, 100);         // adjust if your signature differs
    loading = false;
  }

  onMount(init);

  async function refresh() {
    loading = true;
    cards = await buildDueQueue(null, 100);
    loading = false;
  }

  function randomizeCards() {
    // Fisher–Yates shuffle into a NEW array so Svelte updates
    const a = [...cards];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    cards = a;
  }
</script>

<section class="mx-auto w-full max-w-5xl px-4 pt-2 pb-6 space-y-6">
  <!-- Header (matches Settings spacing) -->
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <h1 class="text-3xl font-semibold tracking-tight">Review</h1>
      {#if settings}
        <span class="badge">
          {settings.reviewDirection === 'ko2en'
            ? 'KO → EN'
            : settings.reviewDirection === 'en2ko'
              ? 'EN → KO'
              : 'Both'}
        </span>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <button
        class="rounded-xl bg-slate-800/60 px-3 py-2 text-sm border border-slate-700 hover:bg-slate-700"
        on:click={refresh}
        aria-label="Refresh due queue"
      >
        Refresh
      </button>
      <button
        class="rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white font-medium hover:bg-indigo-500"
        on:click={randomizeCards}
        aria-label="Randomize order"
      >
        🔀 Randomize
      </button>
    </div>
  </div>

  <!-- Single card: let ReviewPanel render its own card UI -->
  {#if loading}
    <div class="text-slate-400">Loading…</div>
  {:else if cards.length === 0}
    <div class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
      <div class="flex items-start gap-3">
        <div class="text-xl">🎉</div>
        <div>
          <div class="font-medium text-slate-200">You’re all caught up!</div>
          <div class="text-sm text-slate-400">No cards due right now. Add new cards or check back later.</div>
          <div class="mt-3 flex gap-2">
            <a href="#/add" class="rounded-lg bg-slate-800/60 px-3 py-2 text-sm border border-slate-700 hover:bg-slate-700">Add Card</a>
            <a href="#/library" class="rounded-lg bg-slate-800/60 px-3 py-2 text-sm border border-slate-700 hover:bg-slate-700">Open Library</a>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <ReviewPanel {cards} direction={settings!.reviewDirection} tolerance={settings!.typingTolerance} />
  {/if}
</section>
