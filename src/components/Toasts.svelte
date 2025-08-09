<script lang="ts">
  import { toasts, type Toast } from '../lib/toast';
  import { fade } from 'svelte/transition';

  let items: Toast[] = [];
  toasts.subscribe(v => (items = v));

  function flyScale(
    node: Element,
    { y = 0, startScale = 0.9, duration = 200 } = {}
  ) {
    return {
      duration,
      css: (t: number) => {
        const translateY = y * (1 - t);
        const scale = startScale + (1 - startScale) * t;
        const opacity = t;
        return `transform: translateY(${translateY}px) scale(${scale}); opacity: ${opacity}`;
      }
    };
  }

  const icon = (k: Toast['kind']) => (k === 'success' ? '✨' : k === 'warning' ? '🫣' : '💡');
  const ring = (k: Toast['kind']) =>
    k === 'success' ? 'ring-emerald-400/40' : k === 'warning' ? 'ring-amber-400/40' : 'ring-sky-400/40';
  const bar = (k: Toast['kind']) =>
    k === 'success' ? 'bg-emerald-400' : k === 'warning' ? 'bg-amber-400' : 'bg-sky-400';
  const glow = (k: Toast['kind']) =>
    k === 'success'
      ? 'shadow-[0_10px_30px_-10px_rgba(16,185,129,.45)]'
      : k === 'warning'
      ? 'shadow-[0_10px_30px_-10px_rgba(245,158,11,.45)]'
      : 'shadow-[0_10px_30px_-10px_rgba(14,165,233,.45)]';

  const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#f87171', '#a78bfa'];
  function makePieces(n = 18) {
    return Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n;
      const radius = 60 + Math.random() * 40;
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;
      const rot = (Math.random() * 360) | 0;
      const size = 5 + Math.random() * 6;
      const delay = Math.random() * 60;
      const col = colors[i % colors.length];
      return { key: `${i}-${rot}`, dx, dy, rot, size, delay, col };
    });
  }
</script>

<div class="pointer-events-none fixed inset-0 z-[999] flex items-center justify-center">
  <div class="flex w-full max-w-[38rem] flex-col items-center gap-3 px-3">
    {#each items as t (t.id)}
      <div
        class="pointer-events-auto w-full"
        in:flyScale={{ y: 0, startScale: 0.9, duration: 200 }}
        out:fade={{ duration: 150 }}
      >
        <div
          class={`relative rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl ring-1 scale-105 ${ring(t.kind)} ${glow(t.kind)} toast-pop overflow-hidden`}
        >
          <!-- confetti -->
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
            {#each makePieces(18) as p (p.key)}
              <span
                class="confetti-piece"
                style={`--dx:${p.dx}px; --dy:${p.dy}px; --rot:${p.rot}deg; --size:${p.size}px; --delay:${p.delay}ms; background:${p.col}`}
              ></span>
            {/each}
          </div>

          <!-- body -->
          <div class="relative px-2 py-4 flex items-center gap-4">
            <div class="text-3xl animate-bobble flex-shrink-0">{icon(t.kind)}</div>
            <div class="text-lg text-slate-50">{t.text}</div>
          </div>

          <!-- bar -->
          <div class="h-1 overflow-hidden rounded-b-2xl">
            <div
              class={`h-full ${bar(t.kind)} rounded-b-2xl`}
              style={`animation: toastbar linear forwards; animation-duration: ${t.ttl ?? 1600}ms;`}
            ></div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  @keyframes pop {
    0% { transform: scale(.92); opacity: 0 }
    60% { transform: scale(1.04); opacity: 1 }
    100% { transform: scale(1) }
  }
  .toast-pop { animation: pop .2s ease-out both; }

  @keyframes bobble {
    0%, 100% { transform: translateY(0) }
    50% { transform: translateY(-2px) }
  }
  .animate-bobble { animation: bobble 1.2s ease-in-out infinite; }

  @keyframes toastbar { from { width: 100% } to { width: 0% } }

  .confetti-piece {
    position: absolute;
    width: var(--size);
    height: var(--size);
    border-radius: 2px;
    opacity: 0;
    transform: translate(0,0) rotate(0deg);
    animation: confetti 600ms ease-out forwards;
    animation-delay: var(--delay);
  }
  @keyframes confetti {
    0%   { opacity: 0; transform: translate(0, 0) rotate(0deg); }
    10%  { opacity: 1; }
    100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); }
  }
</style>
