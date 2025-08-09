<script lang="ts">
  import type { Card, Grade } from '../lib/models';
  import { db, logOneReviewNow } from '../lib/db';
  import { gradeCard } from '../lib/srs';
  import { showToast } from '../lib/toast';
  import { onMount, onDestroy, tick } from 'svelte';

  export let cards: Card[] = [];
  export let direction: 'ko2en' | 'en2ko' | 'both' = 'ko2en';
  export let tolerance = { normalizeHangul: true, ignorePunctuation: true };

  let idx = 0;
  let input = '';
  let revealed = false;
  let current: Card | null = null;
  $: current = cards[idx] ?? null;

  // IME composition guard (for native keyboards)
  let composing = false;

  // focus management
  let inputEl: HTMLInputElement | null = null;
  async function focusInput() {
    await tick();
    inputEl?.focus();
    inputEl?.select?.();
  }
  $: if (current) { input = ''; revealed = false; focusInput(); }

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
    await logOneReviewNow();

    if (g === 'again') showToast('Again → review soon', 'warning');
    else if (g === 'hard') showToast('Hard → small step', 'info');
    else if (g === 'good') showToast('Good!', 'success');
    else if (g === 'easy') showToast('Easy!', 'success');

    idx += 1; // reactive block resets input & focuses next
  }

  // keyboard: only grading shortcuts after reveal; Enter-to-reveal handled on inputs
  function keyHandler(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (isTyping) return;

    if (!current || !revealed) return;

    const k = e.key.toLowerCase();
    if (k === '1' || k === 'a') { e.preventDefault(); grade('again'); }
    if (k === '2' || k === 'h') { e.preventDefault(); grade('hard'); }
    if (k === '3' || k === 'g') { e.preventDefault(); grade('good'); }
    if (k === '4' || k === 'e') { e.preventDefault(); grade('easy'); }
  }

  onMount(() => window.addEventListener('keydown', keyHandler));
  onDestroy(() => window.removeEventListener('keydown', keyHandler));

  function toggleReveal() { revealed = !revealed; }
</script>

{#if !current}
  <div class="subtle">No more cards due. 🎉</div>
{:else}
  <div class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-5">

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="text-xs text-slate-400">Card {idx + 1} / {cards.length}</div>
    </div>

    {#if activeDir === 'ko2en'}
      <div class="space-y-1">
        <div class="text-3xl font-semibold tracking-tight">{current.front.hangul}</div>
        {#if current.front.romanization}
          <div class="text-xs text-slate-400">{current.front.romanization}</div>
        {/if}
      </div>
      <div class="mt-3">
        <input
          bind:this={inputEl}
          class="w-full px-3 py-3 rounded-xl border border-slate-800 bg-slate-950/60 focus:outline-none focus:border-slate-700"
          placeholder="Type the English meaning…"
          bind:value={input}
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          inputmode="text"
          on:keydown={(e) => {
            // don't reveal mid-composition; reveal on Enter otherwise
            if ((e as KeyboardEvent).key === 'Enter' && !composing) {
              e.preventDefault(); revealed = true;
            }
          }}
          on:compositionstart={() => composing = true}
          on:compositionend={() => composing = false}
        />
      </div>
    {:else}
      <div class="space-y-1">
        <div class="subtle text-sm">Type this in Korean:</div>
        <div class="text-3xl font-semibold tracking-tight">{current.back.meaning}</div>
      </div>
      <div class="mt-3">
        <input
          bind:this={inputEl}
          class="w-full px-3 py-3 rounded-xl border border-slate-800 bg-slate-950/60 focus:outline-none focus:border-slate-700"
          placeholder="여기에 입력…"
          bind:value={input}
          lang="ko"               
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          inputmode="text"
          on:keydown={(e) => {
            if ((e as KeyboardEvent).key === 'Enter' && !composing) {
              e.preventDefault(); revealed = true;
            }
          }}
          on:compositionstart={() => composing = true}
          on:compositionend={() => composing = false}
        />
        <div class="mt-2 text-xs text-slate-500">
          Tip: enable the Korean keyboard on your device (e.g., iOS/Android/macOS/Windows) and switch with your OS shortcut.
        </div>
      </div>
    {/if}

    <div class="mt-2 flex items-center gap-3">
      <button
        class="rounded-xl bg-slate-800/60 px-4 py-2 border border-slate-700 hover:bg-slate-700"
        on:click={toggleReveal}
      >
        {revealed ? 'Hide Answer' : 'Show Answer'}
      </button>

      {#if !revealed}
        <span class="text-xs text-slate-400">Tip: grade with 1–4 / A H G E after revealing</span>
      {/if}
    </div>

    {#if revealed}
      <div class="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
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
          <div class="mt-3 text-slate-100">{current.back.exampleKo}</div>
          <div class="text-sm text-slate-400">{current.back.exampleEn}</div>
        {/if}

        <div class="mt-3">
          {#if isCorrect()}
            <span class="text-emerald-400">Your answer is correct.</span>
          {:else}
            <span class="text-rose-300">Not quite—grade it honestly below.</span>
          {/if}
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button class="rounded-xl px-3 py-2 bg-rose-700 hover:bg-rose-600"  on:click={() => grade('again')}>Again (1/A)</button>
        <button class="rounded-xl px-3 py-2 bg-amber-700 hover:bg-amber-600" on:click={() => grade('hard')}>Hard (2/H)</button>
        <button class="rounded-xl px-3 py-2 bg-emerald-700 hover:bg-emerald-600" on:click={() => grade('good')}>Good (3/G)</button>
        <button class="rounded-xl px-3 py-2 bg-sky-600 hover:bg-sky-500"    on:click={() => grade('easy')}>Easy (4/E)</button>
      </div>
    {/if}
  </div>
{/if}
