<script lang="ts">
  import { onDestroy } from 'svelte';
  import { cardStats, settingsStore } from '../lib/db';
  import MascotHatch from './MascotHatch.svelte';

  // stores → reactive values
  $: stats = $cardStats;                        // { totalCards, dueToday, reviewedToday }
  $: goal  = Math.max(1, ($settingsStore?.dailyGoal ?? 20));

  // progress math
  $: reviewed = stats?.reviewedToday ?? 0;
  $: pct = Math.min(100, Math.round((reviewed / goal) * 100)) || 0;

  // stage mapping (keep in sync with MascotHatch thresholds)
  function stageFromPct(p: number): 'egg' | 'cracked' | 'peeking' | 'hatched' {
    if (p >= 90) return 'hatched';
    if (p >= 60) return 'peeking';
    if (p >= 25) return 'cracked';
    return 'egg';
  }
  $: stage = stageFromPct(pct);

  // friendly copy per stage
  $: statusTitle = ({
    egg: 'Cheep cheep!',
    cracked: 'Cracks are showing!',
    peeking: 'I can see the light!',
    hatched: 'Goal crushed!'
  } as const)[stage];

  $: statusSubtitle = ({
    egg: 'Let’s hit today’s goal.',
    cracked: 'Keep reviewing!',
    peeking: 'Almost there—finish strong.',
    hatched: 'See you tomorrow.'
  } as const)[stage];

  // milestone pulse
  let nextMilestone = 25;
  let pulse = false;
  let pulseTimer: ReturnType<typeof setTimeout> | null = null;

  $: {
    if (pct >= nextMilestone) {
      if (pulseTimer) clearTimeout(pulseTimer);
      pulse = true;
      pulseTimer = setTimeout(() => (pulse = false), 600);
      nextMilestone = Math.min(100, nextMilestone + 25);
    }
    // reset milestones when progress drops back under 25% (e.g., new day)
    if (pct < 25) nextMilestone = 25;
  }

  onDestroy(() => { if (pulseTimer) clearTimeout(pulseTimer); });

  // aria live text
  $: liveText = `${reviewed} of ${goal} reviewed (${pct} percent)`;
</script>

<div class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 md:p-6 space-y-5">
  <div class="flex items-center justify-between">
    <div class="text-lg font-semibold">Today’s Progress</div>
  </div>

  <!-- Mascot in its own column; progress to the side -->
  <div class="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 md:gap-6 items-center">
    <!-- Mascot column -->
    <div class="justify-self-center md:justify-self-start">
      <!-- Pass pct so MascotHatch can animate continuously; also pass explicit stage if you prefer -->
      <MascotHatch progress={pct} size={200} className="md:mr-2" />
      <div class="mt-3 text-center md:text-left">
        <div class="text-slate-200 font-medium">{statusTitle}</div>
        <div class="text-slate-400 text-sm">{statusSubtitle}</div>
      </div>
    </div>

    <!-- Progress column -->
    <div>
      <div
        class="relative h-3 w-full rounded-full bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={pct}
        aria-live="polite"
        aria-label="Daily review progress"
      >
        <!-- fill -->
        <div
          class="h-3 bg-sky-500 transition-all duration-700 ease-out will-change-[width]"
          style={`width: ${pct}%;`}
        ></div>

        <!-- pulse ring on milestones (motion-safe means disabled for reduced-motion users) -->
        {#if pulse}
          <div
            class="pointer-events-none absolute inset-0 rounded-full motion-safe:animate-[ping_0.6s_ease-out_1]"
            style="--tw-ring-color: rgb(14 165 233 / 0.4); box-shadow: 0 0 0.75rem rgba(14,165,233,0.35) inset;"
          ></div>
        {/if}
      </div>

      <div class="mt-2 flex items-center justify-between text-sm text-slate-300">
        <div aria-hidden="true">{reviewed} / {goal} reviewed</div>
        <div class="text-slate-400" aria-hidden="true">{pct}%</div>
        <span class="sr-only">{liveText}</span>
      </div>

      <!-- bottom stats -->
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="rounded-xl bg-slate-800/40 border border-slate-800 px-4 py-3">
          <div class="text-xs text-slate-400">Total cards</div>
          <div class="text-xl font-semibold">{stats?.totalCards ?? 0}</div>
        </div>
        <div class="rounded-xl bg-slate-800/40 border border-slate-800 px-4 py-3">
          <div class="text-xs text-slate-400">Due today</div>
          <div class="text-xl font-semibold">{stats?.dueToday ?? 0}</div>
        </div>
      </div>
    </div>
  </div>
</div>
