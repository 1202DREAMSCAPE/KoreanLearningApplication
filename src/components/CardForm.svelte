<script lang="ts">
  import type { Deck } from '../lib/models';
  import KeyboardHangul from './KeyboardHangul.svelte';
  import { db, uuid } from '../lib/db';

  export let deck: Deck;

  let hangul = '';
  let meaning = '';
  let romanization = '';
  let exampleKo = '';
  let exampleEn = '';
  let tags = '';

  let previewCompose = '';

  function onIMEInput(e: CustomEvent<string>) { previewCompose = e.detail; }
  function onIMECommit(e: CustomEvent<string>) {
    const v = e.detail;
    if (v === '__BACKSPACE__') { hangul = hangul.slice(0,-1); return; }
    hangul += v;
  }

  async function save() {
    const now = new Date().toISOString();
    await db.cards.add({
      id: uuid(),
      deckId: deck.id,
      front: { hangul, romanization: romanization || undefined },
      back:  { meaning, exampleKo: exampleKo || undefined, exampleEn: exampleEn || undefined },
      tags: tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      srs: { ease: 2.5, interval: 0, dueAt: new Date().toISOString(), reps: 0, lapses: 0 },
      createdAt: now, updatedAt: now
    });
    hangul = meaning = romanization = exampleKo = exampleEn = tags = '';
    alert('Saved!');
  }
</script>

<div class="grid gap-4">
  <div>
    <label for="hangul" class="text-sm text-slate-300">Hangul</label>
    <input id="hangul" class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
           bind:value={hangul} placeholder="e.g., 안녕하세요" />
    <div class="mt-2">
      <KeyboardHangul on:input={onIMEInput} on:commit={onIMECommit} />
      {#if previewCompose}
        <div class="text-xs text-slate-400 mt-1">Composing: {previewCompose}</div>
      {/if}
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-4">
    <div>
      <label for="meaning" class="text-sm text-slate-300">Meaning (EN)</label>
      <input id="meaning" class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:ring-2 focus:ring-indigo-500"
             bind:value={meaning} placeholder="Hello" />
    </div>
    <div>
      <label for="romanization" class="text-sm text-slate-300">Romanization (optional)</label>
      <input id="romanization" class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:ring-2 focus:ring-indigo-500"
             bind:value={romanization} placeholder="annyeonghaseyo" />
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-4">
    <div>
      <label for="exampleKo" class="text-sm text-slate-300">Example (KO)</label>
      <input id="exampleKo" class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:ring-2 focus:ring-indigo-500"
             bind:value={exampleKo} placeholder="안녕하세요, 저는 시재이에요." />
    </div>
    <div>
      <label for="exampleEn" class="text-sm text-slate-300">Example (EN)</label>
      <input id="exampleEn" class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:ring-2 focus:ring-indigo-500"
             bind:value={exampleEn} placeholder="Hello, I'm Cj." />
    </div>
  </div>

  <div>
    <label for="tags" class="text-sm text-slate-300">Tags (comma-separated)</label>
    <input id="tags" class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:ring-2 focus:ring-indigo-500"
           bind:value={tags} placeholder="greetings, basic" />
  </div>

  <div class="flex gap-3">
    <button class="btn btn-primary" on:click={save}>Save Card</button>
    <button class="btn btn-muted" type="button" on:click={() => { hangul=meaning=romanization=exampleKo=exampleEn=tags=''; }}>Clear</button>
  </div>
</div>
