<script lang="ts">
  import { buildDueQueue } from '../lib/srs';
  import ReviewPanel from '../components/ReviewPanel.svelte';
  import type { Card, Settings } from '../lib/models';
  import { db } from '../lib/db';

  let cards: Card[] = [];
  let settings: Settings | null = null;

  async function init() {
    const existing = await db.settings.get('singleton');
    settings = existing ?? null;

    if (!settings) {
      settings = {
        id: 'singleton',
        dailyGoal: 20,
        theme: 'dark',
        font: 'system-ui',
        language: 'en',
        typingTolerance: { normalizeHangul: true, ignorePunctuation: true },
        reviewDirection: 'ko2en'
      };
      await db.settings.put(settings);
    }
    cards = await buildDueQueue(null, 100);
  }
  init();
</script>

<section class="space-y-4">
  <div class="flex items-center gap-2">
    <h2 class="h2">Review</h2>
    {#if settings}<span class="badge">{settings.reviewDirection === 'ko2en' ? 'KO → EN' : settings.reviewDirection === 'en2ko' ? 'EN → KO' : 'Both'}</span>{/if}
  </div>

  <div class="card p-5">
    {#if settings}
      <ReviewPanel {cards} direction={settings.reviewDirection} tolerance={settings.typingTolerance} />
    {:else}
      <div class="subtle">Loading…</div>
    {/if}
  </div>
</section>
