<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '../lib/db';
  import type { Deck } from '../lib/models';
  import CardForm from '../components/CardForm.svelte';

  let decks: Deck[] = [];
  let deckId = '';
  let deck: Deck | null = null;
  let loading = true;

  async function init() {
    decks = await db.decks.toArray();
    if (decks.length === 0) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      await db.decks.add({ id, name: 'Default', newPerDay: 10, reviewLimit: 100, createdAt: now });
      decks = await db.decks.toArray();
    }
    deckId = decks[0].id;
    deck = decks[0];
    loading = false;
  }

  onMount(init);

  // keep deck object in sync with selector
  $: deck = decks.find(d => d.id === deckId) ?? null;
</script>

<section class="mx-auto w-full max-w-5xl px-4 pt-2 pb-6 space-y-6">
  <h1 class="text-3xl font-semibold tracking-tight">Add Card</h1>

  {#if loading}
    <div class="mt-8 text-slate-400">Loading…</div>
  {:else}
    <!-- Main card shell (matches Settings) -->
    <div class="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md">      

      {#if deck}
        <CardForm {deck} />
      {/if}
    </div>

    <div class="mt-4 text-xs text-slate-500">
      Pro tip: add tags like <code>greetings</code>, <code>food</code> to keep things organized.
    </div>
  {/if}
</section>
