<script lang="ts">
    /**
     * Hatch mascot with continuous animations per stage.
     * Stages:
     *  - "egg"      : whole egg, shakes
     *  - "cracked"  : cracked egg, pulsates
     *  - "peeking"  : chick peeks up/down from shell
     *  - "hatched"  : full chick, dances
     *
     * You can pass either `stage` directly, or a numeric `progress` (0–100)
     * and let this component derive the stage using thresholds.
     */
    export let stage: 'egg' | 'cracked' | 'peeking' | 'hatched' | undefined = undefined;
    export let progress: number | undefined;
    export let size = 220;         // px square
    export let className = '';     // extra classes for container
  
    // thresholds: tweak to taste
    const thresholds = { cracked: 25, peeking: 60, hatched: 90 };
  
    $: derivedStage = (() => {
      if (stage) return stage;
      const p = Math.max(0, Math.min(100, progress ?? 0));
      if (p >= thresholds.hatched) return 'hatched';
      if (p >= thresholds.peeking) return 'peeking';
      if (p >= thresholds.cracked) return 'cracked';
      return 'egg';
    })();
  
    // A small helper for ARIA labelling
    $: label = {
      egg: 'Egg, shaking',
      cracked: 'Cracked egg, pulsating',
      peeking: 'Chick peeking from egg, bobbing',
      hatched: 'Chick fully hatched, dancing'
    }[derivedStage];
  
    // Prefer-reduced-motion support
    $: reduced = false;
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      reduced = mq.matches;
      mq.addEventListener?.('change', (e) => reduced = e.matches);
    }
  </script>
  
  <div
    class={`mascot-wrap ${className}`}
    style={`--size:${size}px`}
    role="img"
    aria-label={label}
  >
    <!-- Static ground shadow -->
    <div class="shadow"></div>
  
    <!-- Whole egg (egg stage) -->
    <svg
      class={`egg ${derivedStage === 'egg' ? 'is-active' : ''} ${reduced ? 'rm' : ''}`}
      viewBox="0 0 200 260"
      width="100%"
      height="100%"
      aria-hidden={derivedStage !== 'egg'}
    >
      <defs>
        <radialGradient id="eggGrad" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#fffaf0"/>
          <stop offset="100%" stop-color="#f0eadb"/>
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="130" rx="70" ry="100" fill="url(#eggGrad)" stroke="#d8d2c6" stroke-width="3"/>
      <!-- subtle gloss -->
      <path d="M70 60 q-30 40 -10 80" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="6" stroke-linecap="round"/>
    </svg>
  
    <!-- Cracked egg (cracked stage) -->
    <svg
      class={`cracked ${derivedStage === 'cracked' ? 'is-active' : ''} ${reduced ? 'rm' : ''}`}
      viewBox="0 0 200 260"
      width="100%"
      height="100%"
      aria-hidden={derivedStage !== 'cracked'}
    >
      <defs>
        <radialGradient id="eggGrad2" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#fffaf0"/>
          <stop offset="100%" stop-color="#f0eadb"/>
        </radialGradient>
        <filter id="pulseGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ffd966" flood-opacity="0.5"/>
        </filter>
      </defs>
      <!-- bottom shell -->
      <path d="M30 140 q70 50 140 0 q0 90 -70 90 q-70 0 -70 -90z" fill="url(#eggGrad2)" stroke="#d8d2c6" stroke-width="3"/>
      <!-- top shell with crack edge -->
      <path d="M30 140 q70 -100 140 0
               L140 140 l-10 -10 l-10 12 l-10 -12 l-10 12 l-10 -12 l-10 10 l-10 -10 l-10 12 l-10 -12 l-10 10 z"
            fill="url(#eggGrad2)" stroke="#d8d2c6" stroke-width="3" filter="url(#pulseGlow)"/>
    </svg>
  
    <!-- Peeking chick (peeking stage) -->
    <div class={`peeking ${derivedStage === 'peeking' ? 'is-active' : ''} ${reduced ? 'rm' : ''}`}>
      <svg viewBox="0 0 200 260" width="100%" height="100%" aria-hidden={derivedStage !== 'peeking'}>
        <defs>
          <radialGradient id="eggGrad3" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stop-color="#fffaf0"/>
            <stop offset="100%" stop-color="#f0eadb"/>
          </radialGradient>
        </defs>
        <!-- bottom shell -->
        <path d="M30 140 q70 50 140 0 q0 90 -70 90 q-70 0 -70 -90z" fill="url(#eggGrad3)" stroke="#d8d2c6" stroke-width="3"/>
        <!-- chick head peeking -->
        <g class="chick">
          <circle cx="100" cy="120" r="38" fill="#ffd54a" stroke="#e5a800" stroke-width="3"/>
          <circle cx="88" cy="118" r="5" fill="#2e2e2e"/>
          <circle cx="112" cy="118" r="5" fill="#2e2e2e"/>
          <path d="M98 130 l6 8 l6 -8" fill="#ff9f1c" stroke="#e57f00" stroke-width="2" stroke-linejoin="round"/>
          <!-- tiny head feather -->
          <path d="M100 85 q-6 -10 -2 -18 q6 10 14 12" fill="none" stroke="#e5a800" stroke-width="3" stroke-linecap="round"/>
        </g>
        <!-- cracked top shell sitting above -->
        <path d="M30 140 q70 -100 140 0
                 L140 140 l-10 -10 l-10 12 l-10 -12 l-10 12 l-10 -12 l-10 10 l-10 -10 l-10 12 l-10 -12 l-10 10 z"
              fill="url(#eggGrad3)" stroke="#d8d2c6" stroke-width="3"/>
      </svg>
    </div>
  
    <!-- Fully hatched dancing chick -->
    <div class={`hatched ${derivedStage === 'hatched' ? 'is-active' : ''} ${reduced ? 'rm' : ''}`}>
      <svg viewBox="0 0 200 260" width="100%" height="100%" aria-hidden={derivedStage !== 'hatched'}>
        <!-- body -->
        <g class="chick">
          <ellipse cx="100" cy="140" rx="46" ry="58" fill="#ffd54a" stroke="#e5a800" stroke-width="3"/>
          <circle cx="100" cy="92" r="36" fill="#ffd54a" stroke="#e5a800" stroke-width="3"/>
          <circle cx="88" cy="90" r="5" fill="#2e2e2e"/>
          <circle cx="112" cy="90" r="5" fill="#2e2e2e"/>
          <path d="M98 104 l6 8 l6 -8" fill="#ff9f1c" stroke="#e57f00" stroke-width="2" stroke-linejoin="round"/>
          <!-- wings -->
          <path class="wing wing-left"  d="M54 130 q-18 18 8 28 q10 2 18 -6" fill="#ffd54a" stroke="#e5a800" stroke-width="3"/>
          <path class="wing wing-right" d="M146 130 q18 18 -8 28 q-10 2 -18 -6" fill="#ffd54a" stroke="#e5a800" stroke-width="3"/>
          <!-- feet -->
          <path class="foot foot-left"  d="M86 194 l-10 16 m10 -16 l10 16" stroke="#e57f00" stroke-width="4" stroke-linecap="round"/>
          <path class="foot foot-right" d="M114 194 l-10 16 m10 -16 l10 16" stroke="#e57f00" stroke-width="4" stroke-linecap="round"/>
        </g>
  
        <!-- broken shells on ground -->
        <g opacity="0.9">
          <path d="M26 210 q30 -12 44 0 q-18 30 -44 16 q-10 -6 -0 -16z" fill="#f0eadb" stroke="#d8d2c6" stroke-width="3"/>
          <path d="M130 210 q30 -12 44 0 q-18 30 -44 16 q-10 -6 -0 -16z" fill="#f0eadb" stroke="#d8d2c6" stroke-width="3"/>
        </g>
      </svg>
    </div>
  </div>
  
  <style>
    .mascot-wrap {
      width: var(--size);
      height: var(--size);
      position: relative;
      display: grid;
      place-items: center;
      isolation: isolate;
    }
    .shadow {
      position: absolute;
      bottom: 8px;
      left: 50%;
      width: 60%;
      height: 14%;
      transform: translateX(-50%);
      background: radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,.25), rgba(0,0,0,0));
      filter: blur(6px);
      z-index: 0;
    }
    .egg, .cracked, .peeking, .hatched {
      position: absolute;
      inset: 0;
      transform-origin: 50% 85%;
      opacity: 0;
      pointer-events: none;
    }
    .is-active { opacity: 1; pointer-events: auto; }
  
    /* Animations */
    @keyframes shake {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      10% { transform: translateX(-2px) rotate(-2deg); }
      20% { transform: translateX(2px) rotate(2deg); }
      30% { transform: translateX(-3px) rotate(-3deg); }
      40% { transform: translateX(3px) rotate(3deg); }
      50% { transform: translateX(-2px) rotate(-2deg); }
      60% { transform: translateX(2px) rotate(2deg); }
      70% { transform: translateX(-1px) rotate(-1deg); }
      80% { transform: translateX(1px) rotate(1deg); }
      90% { transform: translateX(0) rotate(0deg); }
    }
    .egg.is-active { animation: shake 1.2s infinite; }
  
    @keyframes pulse {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(255,217,102,0)); }
      50% { transform: scale(1.04); filter: drop-shadow(0 0 12px rgba(255,217,102,.6)); }
    }
    .cracked.is-active { animation: pulse 1.6s ease-in-out infinite; }
  
    @keyframes bob {
      0%, 100% { transform: translateY(2px); }
      50% { transform: translateY(-8px); }
    }
    .peeking .chick { transform-origin: 50% 100%; }
    .peeking.is-active .chick { animation: bob 1.4s ease-in-out infinite; }
  
    @keyframes dance {
      0%   { transform: translateY(0) rotate(-6deg); }
      25%  { transform: translateY(-6px) rotate(0deg); }
      50%  { transform: translateY(0) rotate(6deg); }
      75%  { transform: translateY(-6px) rotate(0deg); }
      100% { transform: translateY(0) rotate(-6deg); }
    }
    @keyframes flapL { 50% { transform: rotate(-18deg) translate(-2px, -2px); } }
    @keyframes flapR { 50% { transform: rotate(18deg) translate(2px, -2px); } }
    @keyframes tap   { 50% { transform: translateY(3px); } }
  
    .hatched .chick { transform-origin: 50% 85%; }
    .hatched.is-active .chick { animation: dance 1.25s ease-in-out infinite; }
    .hatched .wing-left  { transform-origin: 58px 132px; }
    .hatched .wing-right { transform-origin: 142px 132px; }
    .hatched.is-active .wing-left  { animation: flapL 0.9s ease-in-out infinite; }
    .hatched.is-active .wing-right { animation: flapR 0.9s ease-in-out infinite; }
    .hatched.is-active .foot-left,
    .hatched.is-active .foot-right { animation: tap 0.45s ease-in-out infinite; }
  
    /* Reduced motion: keep things static/subtle */
    .rm.is-active { animation: none !important; }
  </style>
  