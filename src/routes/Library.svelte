<script lang="ts">
  import { db } from '../lib/db';
  import type { Card } from '../lib/models';
  let cards: Card[] = [];
  db.cards.toArray().then(c => cards = c);
</script>

<section class="space-y-4">
  <h2 class="h2">Library</h2>
  {#if cards.length === 0}
    <div class="card p-5 subtle">No cards yet. Add your first one on the Add page.</div>
  {:else}
    <div class="grid md:grid-cols-2 gap-4">
      {#each cards as c}
        <div class="card p-4">
          <div class="flex items-baseline justify-between">
            <div class="text-xl font-medium">{c.front.hangul}</div>
            <span class="badge">Due: {new Date(c.srs.dueAt).toLocaleDateString()}</span>
          </div>
          <div class="text-sm text-slate-400">{c.back.meaning}</div>
          {#if c.back.exampleKo}
            <div class="mt-2 text-slate-100">{c.back.exampleKo}</div>
            <div class="text-xs text-slate-400">{c.back.exampleEn}</div>
          {/if}
          {#if c.tags?.length}
            <div class="mt-2 flex flex-wrap gap-1">
              {#each c.tags as t}<span class="badge">#{t}</span>{/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</section>
