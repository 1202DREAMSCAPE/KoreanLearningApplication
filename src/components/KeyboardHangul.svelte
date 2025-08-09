<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let mode: 'roman' | 'beolsik' = 'roman';
  export let target: HTMLInputElement | null = null;

  const dispatch = createEventDispatcher<{ input: string; commit: string }>();

  // --- Jamo inventories ---
  const CHO  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

  const C = Object.fromEntries(CHO.map((c,i)=>[c,i]));
  const V = Object.fromEntries(JUNG.map((c,i)=>[c,i]));
  const T = Object.fromEntries(JONG.map((c,i)=>[c,i]));

  const DOUBLE_CHO: Record<string,string> = { 'ㄱ+ㄱ':'ㄲ','ㄷ+ㄷ':'ㄸ','ㅂ+ㅂ':'ㅃ','ㅅ+ㅅ':'ㅆ','ㅈ+ㅈ':'ㅉ' };
  const COMBO_V: Record<string,string> = {
    'ㅗ+ㅏ':'ㅘ','ㅗ+ㅐ':'ㅙ','ㅗ+ㅣ':'ㅚ',
    'ㅜ+ㅓ':'ㅝ','ㅜ+ㅔ':'ㅞ','ㅜ+ㅣ':'ㅟ',
    'ㅡ+ㅣ':'ㅢ'
  };
  const COMBO_T: Record<string,string> = {
    'ㄱ+ㅅ':'ㄳ','ㄴ+ㅈ':'ㄵ','ㄴ+ㅎ':'ㄶ',
    'ㄹ+ㄱ':'ㄺ','ㄹ+ㅁ':'ㄻ','ㄹ+ㅂ':'ㄼ','ㄹ+ㅅ':'ㄽ','ㄹ+ㅌ':'ㄾ','ㄹ+ㅍ':'ㄿ','ㄹ+ㅎ':'ㅀ',
    'ㅂ+ㅅ':'ㅄ'
  };

  const REV_D: Record<string,string> = Object.fromEntries(Object.entries(DOUBLE_CHO).map(([k,v])=>[v,k.split('+')[0]]));
  const SPLIT_V: Record<string,[string,string]> = Object.fromEntries(Object.entries(COMBO_V).map(([k,v])=>[v,k.split('+') as [string,string]]));
  const SPLIT_T: Record<string,[string,string]> = Object.fromEntries(Object.entries(COMBO_T).map(([k,v])=>[v,k.split('+') as [string,string]]));

  const isV = (x: string) => x in V;
  const isC = (x: string) => (x in C) || (x in T);
  const isValidFinal = (x: string) => (x in T) && T[x] !== 0;

  function compose(L: string, Vw: string, Tw = '') {
    const l = C[L], v = V[Vw], t = T[Tw] ?? 0;
    return String.fromCharCode(0xAC00 + ((l*21 + v)*28) + t);
  }

  // state for button-based composing (also used by beolsik mode)
  let cur: { L: string | null; V: string | null; T: string | null } = { L: null, V: null, T: null };

  function emitPreviewFromCur() {
    let preview = '';
    if (cur.L && cur.V) preview = compose(cur.L, cur.V, cur.T || '');
    else if (cur.L) preview = cur.L;
    else if (cur.V) preview = cur.V;
    dispatch('input', preview);
  }
  function commitFromCur() {
    if (cur.L || cur.V) {
      const out = cur.L && cur.V ? compose(cur.L, cur.V, cur.T || '') : (cur.L || cur.V || '');
      dispatch('commit', out);
    }
    cur = { L: null, V: null, T: null };
    emitPreviewFromCur();
  }

  function tap(j: string) {
    if (j === ' ')  { commitFromCur(); dispatch('commit',' '); return; }
    if (j === '\n') { commitFromCur(); dispatch('commit','\n'); return; }

    if (isV(j)) {
      if (!cur.L && !cur.V) { cur.L='ㅇ'; cur.V=j; return void emitPreviewFromCur(); }
      if (cur.L && !cur.V)  { cur.V=j;     return void emitPreviewFromCur(); }
      if (cur.L && cur.V && !cur.T) {
        const k = `${cur.V}+${j}`;
        if (COMBO_V[k]) { cur.V = COMBO_V[k]; return void emitPreviewFromCur(); }
        commitFromCur(); cur.L='ㅇ'; cur.V=j; return void emitPreviewFromCur();
      }
      if (cur.L && cur.V && cur.T) {
        let leftCoda: string | null = null, carryL: string;
        if (SPLIT_T[cur.T]) { const [t1,t2]=SPLIT_T[cur.T]; leftCoda=t1; carryL=t2; }
        else carryL = cur.T!;
        const prevOut = compose(cur.L, cur.V, leftCoda || '');
        dispatch('commit', prevOut);
        cur = { L: carryL, V: j, T: null };
        return void emitPreviewFromCur();
      }
      return;
    }

    if (isC(j)) {
      if (!cur.L && !cur.V) { cur.L=j; return void emitPreviewFromCur(); }
      if (cur.L && !cur.V) {
        const k=`${cur.L}+${j}`;
        if (DOUBLE_CHO[k]) { cur.L=DOUBLE_CHO[k]; return void emitPreviewFromCur(); }
        dispatch('commit', cur.L); cur={L:j,V:null,T:null}; return void emitPreviewFromCur();
      }
      if (cur.L && cur.V && !cur.T) {
        if (isValidFinal(j)) { cur.T=j; return void emitPreviewFromCur(); }
        commitFromCur(); cur.L=j; return void emitPreviewFromCur();
      }
      if (cur.L && cur.V && cur.T) {
        const k=`${cur.T}+${j}`;
        if (COMBO_T[k]) { cur.T=COMBO_T[k]; return void emitPreviewFromCur(); }
        commitFromCur(); cur.L=j; return void emitPreviewFromCur();
      }
    }
  }

  function backspace() {
    if (cur.T) { cur.T = SPLIT_T[cur.T]?.[0] ?? null; return void emitPreviewFromCur(); }
    if (cur.V) { cur.V = SPLIT_V[cur.V]?.[0] ?? null; return void emitPreviewFromCur(); }
    if (cur.L) { cur.L = REV_D[cur.L] ?? null;       return void emitPreviewFromCur(); }
    dispatch('commit', '__BACKSPACE__');
  }

  // ---- Physical keyboard capture ----
  const MAP_BEOLSIK: Record<string, string> = {
    r:'ㄱ', R:'ㄱ', s:'ㄴ', S:'ㄴ', e:'ㄷ', E:'ㄷ', f:'ㄹ', F:'ㄹ', a:'ㅁ', A:'ㅁ',
    q:'ㅂ', Q:'ㅂ', t:'ㅅ', T:'ㅅ', d:'ㅇ', D:'ㅇ', w:'ㅈ', W:'ㅈ', c:'ㅊ', C:'ㅊ',
    z:'ㅋ', Z:'ㅋ', x:'ㅌ', X:'ㅌ', v:'ㅍ', V:'ㅍ', g:'ㅎ', G:'ㅎ',
    k:'ㅏ', K:'ㅏ', o:'ㅐ', O:'ㅒ', i:'ㅑ', I:'ㅑ', j:'ㅓ', J:'ㅓ', p:'ㅔ', P:'ㅖ',
    u:'ㅕ', U:'ㅕ', h:'ㅗ', H:'ㅗ', y:'ㅛ', Y:'ㅛ', n:'ㅜ', N:'ㅜ', b:'ㅠ', B:'ㅠ',
    m:'ㅡ', M:'ㅡ', l:'ㅣ', L:'ㅣ'
  };

  function shouldCapture(ev: KeyboardEvent) {
    if (!target || document.activeElement !== target) return false;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return false;
    return true;
  }

  // -------- Romanization with syllable buffer --------
  const ROM_MAP: Record<string, string> = {
    // consonants
    g:'ㄱ', n:'ㄴ', d:'ㄷ', r:'ㄹ', m:'ㅁ', b:'ㅂ', s:'ㅅ', ng:'ㅇ', j:'ㅈ',
    k:'ㅋ', t:'ㅌ', p:'ㅍ', h:'ㅎ',
    kk:'ㄲ', tt:'ㄸ', pp:'ㅃ', ss:'ㅆ', jj:'ㅉ', ch:'ㅊ',
    // vowels
    a:'ㅏ', ae:'ㅐ', ya:'ㅑ', yae:'ㅒ', eo:'ㅓ', e:'ㅔ', yeo:'ㅕ', ye:'ㅖ',
    o:'ㅗ', wa:'ㅘ', wae:'ㅙ', oe:'ㅚ',
    yo:'ㅛ', u:'ㅜ', wo:'ㅝ', we:'ㅞ', wi:'ㅟ', yu:'ㅠ',
    eu:'ㅡ', ui:'ㅢ', i:'ㅣ'
  };
  const ROM_KEYS = Object.keys(ROM_MAP).sort((a,b)=>b.length-a.length);

  function matchRoman(str: string): [string,string] | null {
    for (const key of ROM_KEYS) if (str.startsWith(key)) return [key, ROM_MAP[key]];
    return null;
  }

  let romBuf = '';
  let onset: string | null = null;
  let nucleus: string | null = null;
  let coda: string | null = null;

  function emitPreviewRoman() {
    let preview = '';
    if (onset && nucleus) preview = compose(onset, nucleus, coda || '');
    else if (onset) preview = onset;
    else if (nucleus) preview = nucleus;
    dispatch('input', preview);
  }

  function flushBlock() {
    if (onset && nucleus) {
      const block = compose(onset, nucleus, coda || '');
      dispatch('commit', block);
    }
    onset = nucleus = coda = null;
    emitPreviewRoman();
  }

  function feedRomanParser() {
    // parse greedily into jamo, assemble syllables
    while (romBuf.length) {
      const m = matchRoman(romBuf);
      if (!m) break;
      const [key, jamo] = m;
      romBuf = romBuf.slice(key.length);

      if (isV(jamo)) {
        if (!onset) onset = 'ㅇ';
        if (!nucleus) {
          nucleus = jamo;
        } else {
          // vowel after vowel → commit previous block and start new
          flushBlock();
          onset = 'ㅇ';
          nucleus = jamo;
        }
      } else if (isC(jamo)) {
        if (!onset) {
          onset = jamo;
        } else if (onset && nucleus && !coda) {
          // tentative coda
          coda = jamo;
        } else if (onset && nucleus && coda) {
          // already have coda → commit and start new onset
          flushBlock();
          onset = jamo;
        } else if (onset && !nucleus) {
          // try double initial
          const k = `${onset}+${jamo}`;
          if (DOUBLE_CHO[k]) onset = DOUBLE_CHO[k];
          else { dispatch('commit', onset); onset = jamo; }
        }
      }
      emitPreviewRoman();
    }

    // NEW: if buffer is empty and we have a complete syllable with coda, commit it
    // This makes words like "annyeong" finish without needing a trailing space.
    if (!romBuf.length && onset && nucleus && coda) {
      flushBlock();
    }
  }

  function onKeydown(ev: KeyboardEvent) {
    if (!shouldCapture(ev)) return;

    if (mode === 'beolsik') {
      const j = MAP_BEOLSIK[ev.key as keyof typeof MAP_BEOLSIK];
      if (ev.key === 'Backspace') { ev.preventDefault(); backspace(); return; }
      if (ev.key === ' ')        { ev.preventDefault(); tap(' ');    return; }
      if (ev.key === 'Enter')    { ev.preventDefault(); tap('\n');   return; }
      if (j) { ev.preventDefault(); tap(j); }
      return;
    }

    // roman mode
    if (mode === 'roman') {
      // control keys
      if (ev.key === 'Backspace') {
        ev.preventDefault();
        if (romBuf.length) {
          romBuf = romBuf.slice(0,-1);
        } else if (coda) {
          coda = null;
        } else if (nucleus) {
          nucleus = null;
        } else if (onset) {
          onset = null;
        } else {
          dispatch('commit', '__BACKSPACE__');
        }
        emitPreviewRoman();
        return;
      }
      if (ev.key === ' ') {
        ev.preventDefault();
        flushBlock();
        dispatch('commit', ' ');
        return;
      }
      if (ev.key === 'Enter') {
        ev.preventDefault();
        flushBlock();
        dispatch('commit', '\n');
        return;
      }

      // letters
      if (ev.key.length === 1 && /[a-zA-Z]/.test(ev.key)) {
        ev.preventDefault();
        romBuf += ev.key.toLowerCase();

        // If the next token would be a vowel and we already have a coda, commit current block first (liaison behavior)
        const m = matchRoman(romBuf);
        if (m && isV(m[1]) && onset && nucleus && coda) {
          flushBlock();
        }

        feedRomanParser();
        return;
      }
    }
  }

  onMount(() => window.addEventListener('keydown', onKeydown, { capture: true }));
  onDestroy(() => window.removeEventListener('keydown', onKeydown, { capture: true }));

  // on-screen buttons
  const CONS = CHO;
  const VOWS = JUNG;
</script>

<div class="space-y-2">
  <div class="flex items-center gap-3 text-xs text-slate-400">
    <span>Input mode:</span>
    <button type="button"
      class="px-2 py-1 rounded border border-white/10"
      on:click={() => mode = mode === 'roman' ? 'beolsik' : 'roman'}>
      {mode === 'roman' ? 'Romanization (annyeong → 안녕)' : '2-Beolsik'}
    </button>
  </div>

  <div class="flex flex-wrap gap-2">
    {#each CONS as c}
      <button
        class="px-3 py-2 rounded-md border border-slate-600 bg-slate-800 hover:bg-slate-700"
        type="button"
        on:click={() => tap(c)}>{c}</button>
    {/each}
  </div>
  <div class="flex flex-wrap gap-2">
    {#each VOWS as v}
      <button
        class="px-3 py-2 rounded-md border border-slate-600 bg-slate-800 hover:bg-slate-700"
        type="button"
        on:click={() => tap(v)}>{v}</button>
    {/each}
  </div>
  <div class="flex gap-2">
    <button class="px-3 py-2 rounded-md border border-slate-600 bg-slate-800" type="button" on:click={() => tap(' ')}>Space</button>
    <button class="px-3 py-2 rounded-md border border-slate-600 bg-slate-800" type="button" on:click={() => tap('\n')}>Enter</button>
    <button class="px-3 py-2 rounded-md border border-slate-600 bg-slate-800" type="button" on:click={backspace}>⌫</button>
  </div>
</div>
