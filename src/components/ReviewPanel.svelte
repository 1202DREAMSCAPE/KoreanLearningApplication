<script lang="ts">
  import type { Card, Grade } from '../lib/models';
  import { db } from '../lib/db';
  import { gradeCard } from '../lib/srs';
  import KeyboardHangul from './KeyboardHangul.svelte';
  import { incReviews } from '../lib/progress';
  import { showToast } from '../lib/toast';
  import { onMount, onDestroy } from 'svelte';

  export let cards: Card[] = [];
  export let direction: 'ko2en' | 'en2ko' | 'both' = 'ko2en';
  export let tolerance: { normalizeHangul: boolean; ignorePunctuation: boolean } = { normalizeHangul: true, ignorePunctuation: true };

  let idx = 0;
  let input = '';
  let revealed = false;
  let current: Card | null = null;
  $: current = cards[idx] ?? null;

  $: activeDir = direction === 'both'
    ? (idx % 2 === 0 ? 'ko2en' : 'en2ko')
    : direction;

  function normalizeEN(s: string) {
    let out = s.trim().toLowerCase();
    if (tolerance.ignorePunctuation) out = out.replace(/[.,!?;:'"()\-_/]/g, '');
    return out;
  }
  function normalizeKO(s: string) {
    let out = s.trim();
    if (tolerance.normalizeHangul) out = out.normalize('NFC');
    return out;
  }

  function isCorrect(): boolean {
    if (!current) return false;
    if (activeDir === 'ko2en') {
      const answers = [current.back.meaning, ...(current.altAnswers || [])].map(normalizeEN);
      return answers.includes(normalizeEN(input));
    } else {
      const answers = [current.front.hangul].map(normalizeKO);
      return answers.includes(normalizeKO(input));
    }
  }

  async function grade(g: Grade) {
    if (!current) return;
    const updated = gradeCard(current, g, new Date());
    await db.cards.put(updated);
    incReviews(1);

    // toast feedback
    if (g === 'again') showToast('Again → review soon', 'warning');
    else if (g === 'hard') showToast('Hard → small step', 'info');
    else if (g === 'good') showToast('Good! next due in ' + updated.srs.interval + 'd', 'success');
    else if (g === 'easy') showToast('Easy! boosted to ' + updated.srs.interval + 'd', 'success');

    input = ''; revealed = false; idx += 1;
  }

  function onIMECommit(e: CustomEvent<string>) {
    const v = e.detail;
    if (v === '__BACKSPACE__') { input = input.slice(0,-1); return; }
    input += v;
  }

  // Hotkeys: Enter/Space to reveal, 1-4 to grade when revealed
  function keyHandler(e: KeyboardEvent) {
    if (!current) return;
    const k = e.key.toLowerCase();
    if (!revealed && (k === 'enter' || k === ' ')) { e.preventDefault(); revealed = true; return; }
    if (revealed) {
      if (k === '1') { e.preventDefault(); grade('again'); }
      if (k === '2') { e.preventDefault(); grade('hard'); }
      if (k === '3') { e.preventDefault(); grade('good'); }
      if (k === '4') { e.preventDefault(); grade('easy'); }
      // letter aliases
      if (k === 'a') { e.preventDefault(); grade('again'); }
      if (k === 'h') { e.preventDefault(); grade('hard'); }
      if (k === 'g') { e.preventDefault(); grade('good'); }
      if (k === 'e') { e.preventDefault(); grade('easy'); }
    }
  }

  onMount(() => window.addEventListener('keydown', keyHandler));
  onDestroy(() => window.removeEventListener('keydown', keyHandler));
</script>

{#if !current}
  <div class="subtle">No more cards due. 🎉</div>
{:else}
  <div class="space-y-4">
    <div class="text-xs text-slate-400">Card {idx+1} / {cards.length} · Mode: {activeDir === 'ko2en' ? 'KO → EN' : 'EN → KO'}</div>

    {#if activeDir === 'ko2en'}
      <div class="text-3xl">{current.front.hangul}</div>
      {#if current.front.romanization}
        <div class="text-xs text-slate-400 mt-1">{current.front.romanization}</div>
      {/if}
      <div class="mt-4">
        <input class="w-full px-3 py-3 rounded-xl bg-ink-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
               placeholder="Type the English meaning…" bind:value={input}
               on:keydown={(e)=>{ if((e as KeyboardEvent).key==='Enter') revealed=true; }} />
      </div>
    {:else}
      <div class="subtle text-sm mb-1">Type this in Korean:</div>
      <div class="text-3xl">{current.back.meaning}</div>
      <div class="mt-3">
        <input class="w-full px-3 py-3 rounded-xl bg-ink-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
               placeholder="Hangul here…" bind:value={input}
               on:keydown={(e)=>{ if((e as KeyboardEvent).key==='Enter') revealed=true; }} />
        <div class="mt-2">
          <KeyboardHangul on:commit={onIMECommit} />
        </div>
      </div>
    {/if}

    {#if revealed}
      <div class="mt-3 p-4 rounded-xl bg-slate-900/80 border border-white/10">
        {#if activeDir === 'ko2en'}
          <div class="text-slate-200">
            Correct (EN): <b class="text-white">{current.back.meaning}</b>
            {#if current.altAnswers?.length}
              <span class="text-xs text-slate-400"> (also: {current.altAnswers.join(', ')})</span>
            {/if}
          </div>
        {:else}
          <div class="text-slate-200">Correct (KO): <b class="text-white">{current.front.hangul}</b></div>
          {#if current.front.romanization}
            <div class="text-xs text-slate-400">({current.front.romanization})</div>
          {/if}
        {/if}
        {#if current.back.exampleKo}
          <div class="mt-2 text-slate-100">{current.back.exampleKo}</div>
          <div class="text-sm text-slate-400">{current.back.exampleEn}</div>
        {/if}
        <div class="mt-2">
          {#if isCorrect()}<span class="text-green-400">Your answer is correct.</span>
          {:else}<span class="text-rose-300">Not quite—grade it honestly below.</span>{/if}
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn bg-rose-700 hover:bg-rose-600" on:click={() => grade('again')}>Again (1/A)</button>
        <button class="btn bg-amber-700 hover:bg-amber-600" on:click={() => grade('hard')}>Hard (2/H)</button>
        <button class="btn bg-emerald-700 hover:bg-emerald-600" on:click={() => grade('good')}>Good (3/G)</button>
        <button class="btn btn-primary" on:click={() => grade('easy')}>Easy (4/E)</button>
      </div>
    {:else}
      <div class="mt-3 flex items-center gap-3">
        <button class="btn btn-muted" on:click={() => revealed=true}>Show Answer</button>
        <span class="text-xs text-slate-400">Tip: press Enter/Space to reveal</span>
      </div>
    {/if}
  </div>
{/if}
