<script lang="ts">
  import { exportAll, importAll } from '../lib/importExport';
  import { db } from '../lib/db';
  import type { Settings } from '../lib/models';

  let file: File | null = null;
  let settings: Settings | null = null;

  async function load() {
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
  }
  load();

  async function save() {
    if (!settings) return;
    await db.settings.put(settings);
    alert('Saved settings');
  }

  async function doImport() {
    if (!file) return;
    await importAll(file);
    alert('Imported. Reload the page.');
  }
</script>

<section class="space-y-6">
  <h2 class="h2">Settings</h2>

  <div class="card p-5 space-y-5">
    {#if settings}
      <div>
        <div class="text-sm text-slate-300">Review direction</div>
        <div class="flex flex-wrap gap-3 mt-2">
          <label class="btn btn-muted">
            <input class="mr-2" type="radio" name="dir" value="ko2en" bind:group={settings.reviewDirection} />
            KO → EN
          </label>
          <label class="btn btn-muted">
            <input class="mr-2" type="radio" name="dir" value="en2ko" bind:group={settings.reviewDirection} />
            EN → KO
          </label>
          <label class="btn btn-muted">
            <input class="mr-2" type="radio" name="dir" value="both" bind:group={settings.reviewDirection} />
            Both
          </label>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2">
          <input type="checkbox" bind:checked={settings.typingTolerance.normalizeHangul} />
          <span class="text-sm text-slate-300">Normalize Hangul</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" bind:checked={settings.typingTolerance.ignorePunctuation} />
          <span class="text-sm text-slate-300">Ignore punctuation</span>
        </label>
      </div>

      <button class="btn btn-primary" on:click={save}>Save</button>
    {:else}
      <div class="subtle">Loading…</div>
    {/if}
  </div>

  <div class="card p-5 space-y-3">
    <div class="h2">Backup</div>
    <div class="flex flex-wrap items-center gap-2">
      <button class="btn btn-muted" on:click={exportAll}>Export JSON</button>
      <input type="file" on:change={(e)=> file = (e.currentTarget as HTMLInputElement).files?.[0] ?? null} />
      <button class="btn btn-muted" on:click={doImport}>Import</button>
    </div>
  </div>
</section>
