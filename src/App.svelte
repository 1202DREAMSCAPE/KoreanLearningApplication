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

  const links = [
    { href: '#/',        label: 'Home' },
    { href: '#/review',  label: 'Review' },
    { href: '#/add',     label: 'Add' },
    { href: '#/library', label: 'Library' },
    { href: '#/settings',label: 'Settings' }
  ];
  const isActive = (h: string) => route === h || (h !== '#/' && route.startsWith(h));
  
  let isMenuOpen = false;  // Track the mobile menu state
  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;
  };
</script>

<!-- Header -->
<header class="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 supports-[backdrop-filter]:bg-slate-950/50 backdrop-blur pt-[max(env(safe-area-inset-top),0px)]">
  <div class="shell py-2 md:py-3">
    <!-- Brand + desktop nav -->
    <div class="flex items-center justify-between">
      <a href="#/" class="flex items-center gap-2">
        <span class="text-lg font-semibold">🇰🇷 Korean SRS</span>
      </a>

      <!-- Desktop -->
      <nav class="hidden md:flex items-center gap-2 text-sm">
        {#each links as l}
          <a href={l.href} class="btn {isActive(l.href) ? 'btn-primary' : 'btn-muted'}">
            {l.label}
          </a>
        {/each}
      </nav>

      <!-- Mobile: Menu Toggle Button -->
      <button class="md:hidden text-white" on:click={toggleMenu}>
        <span class="material-icons-outlined text-lg">{isMenuOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>  <!-- Arrow icon for toggle -->
      </button>
    </div>

    <!-- Mobile Dropdown: visible when menu is open -->
    {#if isMenuOpen}
      <nav class="md:hidden mt-2 -mx-1 overflow-x-auto no-scrollbar dropdown-animation">
        <div class="px-1 flex gap-2 flex-col">
          {#each links as l}
            <a href={l.href} class="shrink-0 btn text-sm {isActive(l.href) ? 'btn-primary' : 'btn-muted'}">
              {l.label}
            </a>
          {/each}
        </div>
      </nav>
    {/if}
  </div>
</header>

<main class="shell page space-y-8">
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

<footer class="shell mx-auto max-w-5xl px-4 pb-10 text-center">
  <div class="text-xs text-slate-500">Built locally · Your data stays on your device</div>
</footer>

<Toasts />

<!-- Add Material Icons CDN -->
<style>
  /* Include Material Icons font */
  @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Outlined');
  
  /* hide scrollbar for the mobile pill row */
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* Mobile menu adjustments */
  .material-icons-outlined {
    font-size: 32px; /* Adjust the size of the arrow icon */
  }

  /* Dropdown animation */
  .dropdown-animation {
    transition: all 0.3s ease-in-out;
    opacity: 0;
    transform: translateY(-10px);
  }

  /* When the menu is open */
  .dropdown-animation {
    opacity: 1;
    transform: translateY(0);
  }
</style>
