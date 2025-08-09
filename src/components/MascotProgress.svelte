<script lang="ts">
    import { getTodayCount } from '../lib/progress';
    import { db } from '../lib/db';
    import { buildDueQueue } from '../lib/srs';
  
    let doneToday = 0;
    let goal = 20;
    let dueCount = 0;
  
    const C = 2 * Math.PI * 44; // circumference (r=44)
  
    async function load() {
      doneToday = getTodayCount();
      const settings = await db.settings.get('singleton');
      if (settings?.dailyGoal) goal = settings.dailyGoal;
      const due = await buildDueQueue(null, 9999);
      dueCount = due.length;
    }
    load();
  
    $: pct = Math.max(0, Math.min(100, Math.round((doneToday / goal) * 100)));
  </script>
  
  <div class="grid sm:grid-cols-2 gap-4 mt-6">
    <div class="card p-5 flex items-center gap-4">
      <div class="text-4xl select-none">🐥</div>
      <div class="text-left">
        <div class="font-semibold">Hi! I’m Your Companion!</div>
        <div class="subtle text-sm">Let’s hit {goal} reviews today!</div>
      </div>
    </div>
  
    <div class="card p-5 flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12" />
        <circle cx="60" cy="60" r="44" fill="none" stroke-linecap="round"
                stroke="url(#grad)" stroke-width="12"
                stroke-dasharray="{C}" stroke-dashoffset="{C * (1 - pct/100)}" />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="120" y2="120">
            <stop offset="0%" stop-color="#4f46e5" />
            <stop offset="100%" stop-color="#22c55e" />
          </linearGradient>
        </defs>
        <text x="60" y="64" text-anchor="middle" fill="#e5e7eb" font-size="18" font-weight="700">{pct}%</text>
      </svg>
      <div class="text-left">
        <div class="font-semibold">Progress</div>
        <div class="subtle text-sm">{doneToday} / {goal} reviews</div>
        <div class="subtle text-sm mt-1">Due now: <span class="font-medium text-slate-200">{dueCount}</span></div>
      </div>
    </div>
  </div>
  