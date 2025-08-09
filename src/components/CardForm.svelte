<script lang="ts">
  import type { Deck } from '../lib/models';
  import { db, uuid } from '../lib/db';

  export let deck: Deck;

  let hangul = '';
  let meaning = '';
  let romanization = '';
  let exampleKo = '';
  let exampleEn = '';
  let tags = '';

  // --- Due date (default: tomorrow) ---
  function fmtYYYYMMDD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  let dueDate = fmtYYYYMMDD(tomorrow); // e.g., "2025-08-10"

  async function save() {
    const now = new Date().toISOString();

    // Convert date-only to ISO (keeps it consistent with your existing srs.dueAt format)
    // Note: 'YYYY-MM-DD' is parsed as UTC midnight by Date().
    const dueISO = new Date(dueDate).toISOString();

    await db.cards.add({
      id: uuid(),
      deckId: deck.id,
      front: { hangul, romanization: romanization || undefined },
      back:  { meaning, exampleKo: exampleKo || undefined, exampleEn: exampleEn || undefined },
      tags: tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      srs: { ease: 2.5, interval: 0, dueAt: dueISO, reps: 0, lapses: 0 },
      createdAt: now, updatedAt: now
    });

    // Reset fields
    hangul = meaning = romanization = exampleKo = exampleEn = tags = '';
    const t = new Date(); t.setDate(t.getDate() + 1);
    dueDate = fmtYYYYMMDD(t);
    alert('Saved!');
  }

  function clearForm() {
    hangul = meaning = romanization = exampleKo = exampleEn = tags = '';
    const t = new Date(); t.setDate(t.getDate() + 1);
    dueDate = fmtYYYYMMDD(t);
  }
</script>

<div class="grid gap-4">
  <div>
    <label for="hangul" class="text-sm text-slate-300">Hangul</label>
    <input
      id="hangul"
      class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      bind:value={hangul}
      placeholder="e.g., 안녕하세요"
    />
  </div>

  <div class="grid md:grid-cols-2 gap-4">
    <div>
      <label for="meaning" class="text-sm text-slate-300">Meaning (EN)</label>
      <input
        id="meaning"
        class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:ring-2 focus:ring-indigo-500"
        bind:value={meaning}
        placeholder="Hello" />
    </div>
    <div>
      <label for="romanization" class="text-sm text-slate-300">Romanization (optional)</label>
      <input
        id="romanization"
        class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:ring-2 focus:ring-indigo-500"
        bind:value={romanization}
        placeholder="annyeonghaseyo" />
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-4">
    <div>
      <label for="exampleKo" class="text-sm text-slate-300">Example (KO)</label>
      <input
        id="exampleKo"
        class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:ring-2 focus:ring-indigo-500"
        bind:value={exampleKo}
        placeholder="안녕하세요, 저는 시재이에요." />
    </div>
    <div>
      <label for="exampleEn" class="text-sm text-slate-300">Example (EN)</label>
      <input
        id="exampleEn"
        class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:ring-2 focus:ring-indigo-500"
        bind:value={exampleEn}
        placeholder="Hello, I'm Cj." />
    </div>
  </div>

    <!-- Tags + Due Date in same row -->
    <div class="grid md:grid-cols-2 gap-4">
      <div>
        <label for="tags" class="text-sm text-slate-300">Tags (comma-separated)</label>
        <input
          id="tags"
          class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:ring-2 focus:ring-indigo-500"
          bind:value={tags}
          placeholder="greetings, basic" />
      </div>
  
      <div>
        <label for="dueDate" class="text-sm text-slate-300">Due Date</label>
        <input
          id="dueDate"
          type="date"
          class="w-full px-3 py-2 rounded-xl bg-ink-2 border border-white/10 focus:ring-2 focus:ring-indigo-500"
          bind:value={dueDate} />
      </div>
    </div>
  
  <div class="flex gap-3">
    <button class="btn btn-primary" on:click={save} type="button">Save Card</button>
    <button class="btn btn-muted" type="button" on:click={clearForm}>Clear</button>
  </div>
</div>
