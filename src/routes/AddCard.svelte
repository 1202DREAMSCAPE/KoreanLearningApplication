<script lang="ts">
  import { db } from '../lib/db';
  import type { Deck } from '../lib/models';
  import CardForm from '../components/CardForm.svelte';

  let decks: Deck[] = [];
  let deck: Deck | null = null;

  db.decks.toArray().then(d => { decks = d; deck = decks[0] ?? null; });
</script>

<section class="space-y-6">
  <div class="space-y-1">
    <h2 class="h2">Add a new card</h2>
    <p class="subtle">Enter Korean, meaning, and optional examples. Use the on-screen keyboard if you like.</p>
  </div>

  <div class="card p-5">
    {#if deck}
      <CardForm {deck} />
    {:else}
      <div class="subtle">Creating your first deck… reload in a second.</div>
    {/if}
  </div>
</section>
