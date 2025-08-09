<script lang="ts">
  import { onMount } from 'svelte';
  import dayjs from 'dayjs';
  import { db } from '../lib/db';
  import type { Card } from '../lib/models';

  // ----------------- FILTER / SORT / PAGINATION STATE -----------------
  // Debounced search
  let qRaw = '';
  let q = '';
  let qTimer: number | null = null;
  $: {
    if (qTimer) clearTimeout(qTimer);
    qTimer = window.setTimeout(() => { q = qRaw.trim(); page = 1; }, 2000);
  }

  // Debounced "type-a-tag" filter
  let tagFilterRaw = '';
  let tagFilter = '';
  let tagTimer: number | null = null;
  $: {
    if (tagTimer) clearTimeout(tagTimer);
    tagTimer = window.setTimeout(() => { tagFilter = tagFilterRaw.trim(); page = 1; }, 2000);
  }

  let selectedTags: string[] = []; // chip filter (AND with tagFilter)
  let dueFilter: 'all' | 'due' | 'overdue' | 'new' | 'learned' = 'all';

  let sort: 'dueAt' | 'createdAt' | 'updatedAt' | 'ease' | 'interval' | 'hangul' | 'meaning' = 'dueAt';
  let sortDir: 'asc' | 'desc' = 'asc';

  let page = 1;
  let pageSize: 25 | 50 | 100 = 50;

  // ----------------- DATA & SELECTION -----------------
  let total = 0;
  let filtered = 0;
  let rows: Card[] = [];
  let allTags: { name: string; count: number }[] = [];

  let selectedIds = new Set<string>();
  const toggleSel = (id: string) =>
    selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
  const clearSel = () => selectedIds.clear();

  // ----------------- LOAD META + QUERY -----------------
  onMount(async () => {
    await refreshMeta();
    await runQuery();
  });

  async function refreshMeta() {
    const cards = await db.cards.toArray();
    total = cards.length;
    const map = new Map<string, number>();
    for (const c of cards) (c.tags || []).forEach(t => map.set(t, (map.get(t) || 0) + 1));
    allTags = [...map.entries()].map(([name, count]) => ({ name, count })).sort((a,b)=>b.count-a.count);
  }

  async function runQuery() {
    const now = dayjs();
    const cards = await db.cards.toArray();

    let list = cards.filter((c) => {
      // search across fields
      if (q) {
        const needle = q.toLowerCase();
        const hay = [
          c.front?.hangul, c.front?.romanization, c.back?.meaning,
          c.back?.exampleKo, c.back?.exampleEn, ...(c.tags || [])
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(needle)) return false;
      }

      // typed tag filter
      if (tagFilter) {
        const tset = new Set(c.tags || []);
        if (!tset.has(tagFilter)) return false;
      }

      // chip tag filters (AND)
      if (selectedTags.length) {
        const tset = new Set(c.tags || []);
        for (const t of selectedTags) if (!tset.has(t)) return false;
      }

      // due filter
      const due = c.srs?.dueAt ? dayjs(c.srs.dueAt) : null;
      const interval = c.srs?.interval ?? 0;
      const reps = c.srs?.reps ?? 0;

      if (dueFilter === 'due')       { if (!due || due.isAfter(now, 'day')) return false; }
      if (dueFilter === 'overdue')   { if (!due || due.isAfter(now)) return false; }
      if (dueFilter === 'new')       { if (interval !== 0) return false; }
      if (dueFilter === 'learned')   { if (!(interval >= 21 || reps >= 10)) return false; }

      return true;
    });

    // sort
    list.sort((a,b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const get = (x: Card) =>
        sort === 'hangul'   ? (x.front?.hangul || '')
      : sort === 'meaning'  ? (x.back?.meaning || '')
      : sort === 'ease'     ? (x.srs?.ease ?? 0)
      : sort === 'interval' ? (x.srs?.interval ?? 0)
      : sort === 'updatedAt'? (x.updatedAt || '')
      : sort === 'createdAt'? (x.createdAt || '')
      : /* dueAt */           (x.srs?.dueAt || '');
      const av = get(a), bv = get(b);
      return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
    });

    filtered = list.length;
    const start = (page - 1) * pageSize;
    rows = list.slice(start, start + pageSize);
  }

  // re-run query when these change
  $: runQuery(), [q, tagFilter, selectedTags, dueFilter, sort, sortDir, page, pageSize];

  function resetFilters() {
    qRaw = ''; q = '';
    tagFilterRaw = ''; tagFilter = '';
    selectedTags = [];
    dueFilter = 'all';
    sort = 'dueAt';
    sortDir = 'asc';
    page = 1;
  }

  // ----------------- BULK ACTIONS -----------------
  let bulkTagInput = '';
  async function bulkDelete() {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} selected card(s)?`)) return;
    await db.cards.bulkDelete([...selectedIds]);
    clearSel();
    await refreshMeta();
    await runQuery();
  }
  async function bulkTag(tag: string) {
    const t = tag.trim();
    if (!selectedIds.size || !t) return;
    const ids = [...selectedIds];
    await db.transaction('rw', db.cards, async () => {
      for (const id of ids) {
        const c = await db.cards.get(id);
        if (!c) continue;
        const set = new Set(c.tags || []);
        set.add(t);
        c.tags = [...set];
        c.updatedAt = new Date().toISOString();
        await db.cards.put(c);
      }
    });
    bulkTagInput = '';
    await refreshMeta();
    await runQuery();
  }

  // ----------------- PER-CARD EDIT / DELETE -----------------
  let showEdit = false;
  let editCard: Card | null = null;
  let tagNew = '';

  function openEdit(c: Card) {
    // clone so we can cancel
    editCard = JSON.parse(JSON.stringify(c));
    tagNew = '';
    showEdit = true;
  }
  function closeEdit() {
    showEdit = false;
    editCard = null;
    tagNew = '';
  }
  function removeTagAt(idx: number) {
    if (!editCard) return;
    const arr = editCard.tags || [];
    arr.splice(idx, 1);
    editCard.tags = [...arr];
  }
  function addTagToEdit() {
    const t = tagNew.trim();
    if (!editCard || !t) return;
    const set = new Set(editCard.tags || []);
    set.add(t);
    editCard.tags = [...set];
    tagNew = '';
  }
  async function saveEdit() {
    if (!editCard) return;
    editCard.updatedAt = new Date().toISOString();
    await db.cards.put(editCard);
    await refreshMeta();
    await runQuery();
    closeEdit();
  }
  async function deleteOne(id: string) {
    if (!confirm('Delete this card?')) return;
    await db.cards.delete(id);
    selectedIds.delete(id);
    await refreshMeta();
    await runQuery();
  }
</script>

<section class="mx-auto w-full max-w-5xl px-4 pt-4 pb-8">
  <!-- Header -->
  <div class="flex items-end justify-between gap-3 flex-wrap">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight">Library</h1>
      <p class="mt-1 text-sm text-slate-400">{filtered} / {total} cards shown</p>
    </div>
    <div class="flex gap-2">
      <button class="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm hover:bg-slate-800/60"
              on:click={() => { resetFilters(); runQuery(); }}>
        Reset
      </button>
    </div>
  </div>

  <!-- Filters -->
  <div class="mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
    <div class="grid gap-3 md:grid-cols-3">
      <!-- Debounced search -->
      <input
        class="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:border-slate-700"
        placeholder="hangul / meaning / examples / tags"
        bind:value={qRaw}
      />

      <!-- Due + sort -->
      <div class="flex items-center gap-2">
        <select class="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 focus:border-slate-700" bind:value={dueFilter}>
          <option value="all">All</option>
          <option value="due">Due today</option>
          <option value="overdue">Overdue</option>
          <option value="new">New</option>
          <option value="learned">Learned</option>
        </select>

        <select class="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 focus:border-slate-700" bind:value={sort}>
          <option value="dueAt">Sort by due</option>
          <option value="createdAt">Created</option>
          <option value="updatedAt">Updated</option>
          <option value="ease">Ease</option>
          <option value="interval">Interval</option>
          <option value="hangul">Hangul</option>
          <option value="meaning">Meaning</option>
        </select>

        <button class="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-1 hover:bg-slate-800/60"
                on:click={() => (sortDir = sortDir === 'asc' ? 'desc' : 'asc')}>
          {sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <!-- Tag chips -->
      <div class="flex flex-wrap gap-2 max-h-24 overflow-auto md:col-span-3">
        {#each allTags as t}
          <button
            class="rounded-full border px-3 py-1 text-xs transition
                   {selectedTags.includes(t.name) ? 'bg-sky-600 text-white border-sky-500' : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/60'}"
            on:click={() => {
              selectedTags = selectedTags.includes(t.name)
                ? selectedTags.filter(x => x !== t.name)
                : [...selectedTags, t.name];
              page = 1;
            }}>
            {t.name} <span class="opacity-60">({t.count})</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Bulk actions 
  <div class="mt-4 flex items-center gap-2 flex-wrap">
    <button class="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm hover:bg-slate-800/60 disabled:opacity-50"
            on:click={bulkDelete}
            disabled={!selectedIds.size}>
      Delete selected
    </button>
    <div class="flex items-center gap-2">
      <input
        class="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-700 disabled:opacity-50"
        placeholder={selectedIds.size ? "Add tag to selected…" : "Select cards to enable"}
        bind:value={bulkTagInput}
        disabled={!selectedIds.size}
        on:keydown={(e) => { if ((e as KeyboardEvent).key === 'Enter') bulkTag(bulkTagInput); }}
      />
      <button class="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm hover:bg-slate-800/60 disabled:opacity-50"
              on:click={() => bulkTag(bulkTagInput)}
              disabled={!selectedIds.size || !bulkTagInput.trim()}>
        Apply tag
      </button>
      <span class="text-xs text-slate-500">{selectedIds.size} selected</span>
    </div>
  </div> -->

<!-- List -->
<div class="mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 divide-y divide-slate-800/60">
  {#if rows.length === 0}
    <div class="p-6 text-slate-400">No cards match your filters.</div>
  {:else}
    {#each rows as c}
      <!-- make row relative so we can pin icons -->
      <div class="relative p-4 flex items-start gap-3">
        <!-- top-right icon actions -->
        <div class="absolute right-3 top-3 flex items-center gap-2 opacity-70 hover:opacity-100 transition">
          <button
            class="rounded-lg p-1.5 hover:bg-slate-800/60 border border-transparent hover:border-slate-700"
            title="Edit"
            aria-label="Edit"
            on:click={() => openEdit(c)}
          >
            <!-- pencil -->
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="text-slate-300">
              <path d="M12 20h9" stroke-width="2" stroke-linecap="round"/>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <button
            class="rounded-lg p-1.5 hover:bg-rose-900/40 border border-transparent hover:border-rose-800"
            title="Delete"
            aria-label="Delete"
            on:click={() => deleteOne(c.id)}
          >
            <!-- trash -->
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="text-rose-300">
              <path d="M3 6h18" stroke-width="2" stroke-linecap="round"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" stroke-linecap="round"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 11v6M14 11v6" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- selection checkbox -->
        <input
          type="checkbox"
          class="mt-1 accent-sky-500"
          checked={selectedIds.has(c.id)}
          on:change={() => toggleSel(c.id)}
        />

        <!-- main content -->
        <div class="flex-1">
          <div class="text-lg">{c.front?.hangul}</div>
          {#if c.front?.romanization}
            <div class="text-xs text-slate-400">{c.front.romanization}</div>
          {/if}
          <div class="text-slate-200">{c.back?.meaning}</div>

          {#if c.tags?.length}
            <div class="mt-1 flex flex-wrap gap-1">
              {#each c.tags as t}
                <span class="rounded-full border border-slate-800 px-2 py-[2px] text-[10px] bg-slate-950/60">#{t}</span>
              {/each}
            </div>
          {/if}

          <div class="mt-2 text-xs text-slate-500 flex flex-wrap gap-3">
            <span>Due: {c.srs?.dueAt ? dayjs(c.srs.dueAt).format('YYYY-MM-DD') : '—'}</span>
            <!-- <span>Int: {c.srs?.interval ?? 0}d</span> -->
            <!-- <span>Ease: {c.srs?.ease?.toFixed?.(2) ?? '—'}</span> -->
            <!-- <span>Reps: {c.srs?.reps ?? 0}</span> -->
            <span>Updated: {c.updatedAt ? dayjs(c.updatedAt).format('YYYY-MM-DD HH:mm') : '—'}</span>
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>


  <!-- Pagination -->
  <div class="mt-4 flex items-center justify-between">
    <div class="text-xs text-slate-500">Page {page} · {pageSize} per page</div>
    <div class="flex items-center gap-2">
      <button class="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm disabled:opacity-50"
              on:click={() => { if (page > 1) page--; }} disabled={page === 1}>
        Prev
      </button>
      <button class="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm disabled:opacity-50"
              on:click={() => { if (page * pageSize < filtered) page++; }} disabled={page * pageSize >= filtered}>
        Next
      </button>
      <select class="rounded-xl border border-slate-800 bg-slate-950/60 px-2 py-2 text-sm"
              bind:value={pageSize}
              on:change={() => { page = 1; }}>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
  </div>

  <!-- Edit Drawer -->
  {#if showEdit && editCard}
    <div class="fixed inset-0 z-[999]">
      <!-- overlay -->
      <button type="button" class="absolute inset-0 bg-black/50" on:click={closeEdit} aria-label="Close edit overlay"></button>

      <!-- drawer -->
      <div class="absolute right-0 top-0 h-full w-full max-w-md p-4">
        <div class="h-full rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-4 flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold">Edit card</h3>
            <button class="rounded-lg px-3 py-1 border border-slate-800 hover:bg-slate-800/60" on:click={closeEdit}>Close</button>
          </div>

          <div class="space-y-3 overflow-auto pr-1">
            <div>
              <label for="hangul-input" class="block text-xs text-slate-400">Hangul</label>
              <input id="hangul-input" class="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:border-slate-700"
                     bind:value={editCard.front.hangul} />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="meaning-input" class="block text-xs text-slate-400">Meaning (EN)</label>
                <input id="meaning-input" class="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:border-slate-700"
                       bind:value={editCard.back.meaning} />
              </div>
              <div>
                <label for="romanization" class="block text-xs text-slate-400">Romanization</label>
                <input id="romanization" class="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:border-slate-700"
                       bind:value={editCard.front.romanization} />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="example-ko" class="block text-xs text-slate-400">Example (KO)</label>
                <input id="example-ko" class="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:border-slate-700"
                       bind:value={editCard.back.exampleKo} />
              </div>
              <div>
                <label for="example-en" class="block text-xs text-slate-400">Example (EN)</label>
                <input id="example-en" class="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:border-slate-700"
                       bind:value={editCard.back.exampleEn} />
              </div>
            </div>

            <div>
              <label for="tags-input" class="block text-xs text-slate-400 mb-1">Tags</label>
              <div class="flex flex-wrap gap-2">
                {#each (editCard.tags || []) as t, i}
                  <span class="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/60 px-2 py-[2px] text-[11px]">
                    #{t}
                    <button class="opacity-70 hover:opacity-100" on:click={() => removeTagAt(i)}>✕</button>
                  </span>
                {/each}
              </div>
              <div class="mt-2 flex gap-2">
                <input id="tags-input" class="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-700"
                       placeholder="Add a tag…" bind:value={tagNew}
                       on:keydown={(e)=>{ if ((e as KeyboardEvent).key === 'Enter') addTagToEdit(); }} />
                <button class="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm hover:bg-slate-800/60"
                        on:click={addTagToEdit}>Add</button>
              </div>
            </div>

            <div class="text-xs grid grid-cols-2 gap-3">
              <div>
                <label for="due-date" class="block text-xs text-slate-400">Due</label>
                <input
                  id="due-date"
                  type="date"
                  class="mt-1 text-slate-50 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:border-slate-700 text-sm"
                  bind:value={editCard.srs.dueAt}
                />
              </div>
              <!-- <div>Interval: {editCard.srs?.interval ?? 0}d · Ease: {editCard.srs?.ease ?? '—'} · Reps: {editCard.srs?.reps ?? 0}</div> -->
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <button class="flex-1 rounded-xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-500" on:click={saveEdit}>Save</button>
            <button class="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 hover:bg-slate-800/60" on:click={closeEdit}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</section>
