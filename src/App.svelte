<script lang="ts">
  import Home from './routes/Home.svelte';
  import Review from './routes/Review.svelte';
  import Add from './routes/AddCard.svelte';
  import Library from './routes/Library.svelte';
  import Settings from './routes/Settings.svelte';
  import Toasts from './components/Toasts.svelte';

  let route = location.hash || '#/';
  const onHash = () => (route = location.hash || '#/');
  window.addEventListener('hashchange', onHash);
</script>

<!-- Top nav -->
<header class="sticky top-0 z-30 backdrop-blur border-b border-white/10 bg-slate-950/50">
  <div class="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
    <a href="#/" class="flex items-center gap-2">
      <span class="text-lg font-semibold">🇰🇷 Korean SRS</span>
    </a>
    <nav class="flex items-center gap-2 text-sm">
      <a href="#/" class="btn btn-muted">Home</a>
      <a href="#/review" class="btn btn-muted">Review</a>
      <a href="#/add" class="btn btn-muted">Add</a>
      <a href="#/library" class="btn btn-muted">Library</a>
      <a href="#/settings" class="btn btn-muted">Settings</a>
    </nav>
  </div>
</header>

<main class="mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-8">
  {#if route === '#/'}
    <Home />
  {:else if route.startsWith('#/review')}
    <Review />
  {:else if route.startsWith('#/add')}
    <Add />
  {:else if route.startsWith('#/library')}
    <Library />
  {:else if route.startsWith('#/settings')}
    <Settings />
  {:else}
    <div class="card p-6">Not found</div>
  {/if}
</main>

<footer class="mx-auto max-w-5xl px-4 pb-10 text-center">
  <div class="text-xs text-slate-500">Built locally · Your data stays on your device</div>
</footer>

<Toasts />