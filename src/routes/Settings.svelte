<script lang="ts">
  import { onMount } from 'svelte';
  import { getSettings, setSettings, db } from '../lib/db';
  import type { Settings } from '../lib/models';

  let settings: Settings | null = null;
  let saving = false;
  let savedAt = '';

  // import/export UI state
  let importError = '';
  let importSuccess = '';
  let selectedName = '';

  onMount(async () => {
    settings = await getSettings();
  });

  async function save() {
    if (!settings) return;
    saving = true;
    await setSettings(settings);
    saving = false;
    savedAt = new Date().toLocaleTimeString();
  }

  async function exportCards() {
    const cards = await db.cards.toArray();
    const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cards-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importCards(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    selectedName = file.name;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid file format (expected an array).');

      let addedCount = 0;
      for (const card of data) {
        // minimal validation
        if (card && card.front && card.back) {
          await db.cards.put(card); // upsert: add or overwrite by id
          addedCount++;
        }
      }
      importSuccess = `Imported ${addedCount} cards.`;
      importError = '';
    } catch (err: any) {
      importError = err?.message ?? 'Failed to import file.';
      importSuccess = '';
    } finally {
      input.value = ''; // allow re-selecting same file
    }
  }
</script>

<section class="mx-auto w-full max-w-5xl px-4 pt-2 pb-6">
  <h1 class="text-3xl font-semibold tracking-tight">Settings</h1>
  <p class="mt-2 text-sm text-slate-400">Tune how reviews behave. Goal powers the Home progress bar.</p>

  {#if !settings}
    <div class="mt-8 text-slate-400">Loading…</div>
  {:else}
    <!-- Main settings card -->
    <div class="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div class="grid grid-cols-1 gap-6">
        <!-- Typing tolerance -->
        <div>
          <span class="block text-sm text-slate-300">Typing tolerance</span>
          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label
              for="tol-normalize"
              class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 cursor-pointer"
            >
              <input
                id="tol-normalize"
                type="checkbox"
                class="h-4 w-4 accent-sky-500"
                bind:checked={settings.typingTolerance.normalizeHangul}
              />
              <div>
                <div class="text-slate-200">Normalize Hangul</div>
                <div class="text-xs text-slate-400">Treat equivalent jamo/syllables as matches.</div>
              </div>
            </label>

            <label
              for="tol-ignore"
              class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 cursor-pointer"
            >
              <input
                id="tol-ignore"
                type="checkbox"
                class="h-4 w-4 accent-sky-500"
                bind:checked={settings.typingTolerance.ignorePunctuation}
              />
              <div>
                <div class="text-slate-200">Ignore punctuation</div>
                <div class="text-xs text-slate-400">“안녕!” equals “안녕”.</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Review direction -->
        <div>
          <span class="block text-sm text-slate-300">Review direction</span>
          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 cursor-pointer">
              <input type="radio" name="reviewDirection" class="h-4 w-4 accent-sky-500" value="ko2en" bind:group={settings.reviewDirection} />
              <div>
                <div class="text-slate-200">Korean → English</div>
                <div class="text-xs text-slate-400">Prompt in Korean, answer in English.</div>
              </div>
            </label>

            <label class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 cursor-pointer">
              <input type="radio" name="reviewDirection" class="h-4 w-4 accent-sky-500" value="en2ko" bind:group={settings.reviewDirection} />
              <div>
                <div class="text-slate-200">English → Korean</div>
                <div class="text-xs text-slate-400">Prompt in English, answer in Korean.</div>
              </div>
            </label>

            <label class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 cursor-pointer">
              <input type="radio" name="reviewDirection" class="h-4 w-4 accent-sky-500" value="both" bind:group={settings.reviewDirection} />
              <div>
                <div class="text-slate-200">Both</div>
                <div class="text-xs text-slate-400">Mix of both directions.</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Daily goal -->
        <div>
          <label for="dailyGoal" class="block text-sm text-slate-300">Daily review goal</label>
          <div class="mt-2 flex items-center gap-3">
            <input
              id="dailyGoal"
              type="number"
              min="1"
              bind:value={settings.dailyGoal}
              class="w-28 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-center outline-none ring-0 focus:border-slate-700"
            /> 
        </div>
        <button
          on:click={save}
          disabled={saving}
          class="rounded-xl w-28 bg-green-600 px-4 py-2 mt-2 font-medium text-white shadow hover:bg-green-500 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {#if savedAt}
          <span class="text-xs text-slate-500">Saved {savedAt}</span>
        {/if}
      </div>
      </div>
    </div>

    <!-- Card data (export/import) -->
    <div class="mt-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-md">
      <h2 class="text-lg font-semibold text-slate-200 mb-4">Card data</h2>

      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Export -->
        <div class="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div class="text-sm text-slate-300 mb-2">Export all cards</div>
          <p class="text-xs text-slate-400 mb-3">Download your cards as a JSON file.</p>
          <button
            on:click={exportCards}
            class="rounded-xl text-sm bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
          >
            Export cards as JSON
          </button>
        </div>

        <!-- Import -->
        <div class="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div class="text-sm text-slate-300 mb-2">Import cards</div>
          <p class="text-xs text-slate-400 mb-3">Load cards from a JSON file you exported earlier.</p>

          <!-- Hidden file input + styled button -->
          <input id="fileJSON" type="file" accept="application/json" class="hidden" on:change={importCards} />
          <div class="flex items-center gap-3">
            <label
              for="fileJSON"
              class="cursor-pointer text-sm rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2 text-slate-100 hover:bg-slate-700/80"
            >
              Choose file…
            </label>
            {#if importSuccess}
              <span class="text-xs text-emerald-400">{importSuccess}</span>
            {:else if importError}
              <span class="text-xs text-rose-400">{importError}</span>
            {/if}
          </div>
          {#if selectedName}
            <div class="mt-2 text-xs text-slate-400">{selectedName}</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</section>
