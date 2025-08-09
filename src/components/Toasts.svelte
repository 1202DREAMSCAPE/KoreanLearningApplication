<script lang="ts">
    import { toasts, type Toast } from '../lib/toast';
    let items: Toast[] = [];
    const unsub = toasts.subscribe(v => items = v);
    // no need for onDestroy here—page scope is fine for this app
  </script>
  
  <div class="fixed bottom-4 right-4 z-50 space-y-2">
    {#each items as t (t.id)}
      <div class="px-3 py-2 rounded-xl border border-white/10 backdrop-blur shadow-soft
                  text-sm flex items-center gap-2
                  {t.kind === 'success' ? 'bg-emerald-600/80' : ''}
                  {t.kind === 'info' ? 'bg-slate-800/80' : ''}
                  {t.kind === 'warning' ? 'bg-amber-600/80' : ''}">
        {#if t.kind === 'success'}<span>✅</span>{/if}
        {#if t.kind === 'info'}<span>ℹ️</span>{/if}
        {#if t.kind === 'warning'}<span>⚠️</span>{/if}
        <div>{t.text}</div>
      </div>
    {/each}
  </div>
  