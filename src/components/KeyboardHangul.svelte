<script lang="ts">
    import { createEventDispatcher } from 'svelte';
  
    const dispatch = createEventDispatcher<{ input: string, commit: string }>();
  
    // jamo inventories
    const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
    const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ',' ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    const C = Object.fromEntries(CHO.map((c,i)=>[c,i]));
    const V = Object.fromEntries(JUNG.map((c,i)=>[c,i]));
    const T = Object.fromEntries(JONG.map((c,i)=>[c,i]));
  
    const DOUBLE_CHO: Record<string,string> = { 'ㄱ+ㄱ':'ㄲ','ㄷ+ㄷ':'ㄸ','ㅂ+ㅂ':'ㅃ','ㅅ+ㅅ':'ㅆ','ㅈ+ㅈ':'ㅉ' };
    const COMBO_V: Record<string,string> = {
      'ㅗ+ㅏ':'ㅘ','ㅗ+ㅐ':'ㅙ','ㅗ+ㅣ':'ㅚ',
      'ㅜ+ㅓ':'ㅝ','ㅜ+ㅔ':'ㅞ','ㅜ+ㅣ':'ㅟ', 'ㅡ+ㅣ':'ㅢ'
    };
    const COMBO_T: Record<string,string> = {
      'ㄱ+ㅅ':'ㄳ','ㄴ+ㅈ':'ㄵ','ㄴ+ㅎ':'ㄶ','ㄹ+ㄱ':'ㄺ','ㄹ+ㅁ':'ㄻ',
      'ㄹ+ㅂ':'ㄼ','ㄹ+ㅅ':'ㄽ','ㄹ+ㅌ':'ㄾ','ㄹ+ㅍ':'ㄿ','ㄹ+ㅎ':'ㅀ','ㅂ+ㅅ':'ㅄ'
    };
    const REV_D: Record<string,string> = Object.fromEntries(Object.entries(DOUBLE_CHO).map(([k,v])=>[v,k.split('+')[0]]));
    const SPLIT_V: Record<string,[string,string]> = Object.fromEntries(Object.entries(COMBO_V).map(([k,v])=>[v,k.split('+') as [string,string]]));
    const SPLIT_T: Record<string,[string,string]> = Object.fromEntries(Object.entries(COMBO_T).map(([k,v])=>[v,k.split('+') as [string,string]]));
  
    function compose(L:string, Vw:string, Tw='') {
      const l=C[L], v=V[Vw], t=T[Tw] ?? 0;
      const code = 0xAC00 + ((l*21 + v)*28) + t;
      return String.fromCharCode(code);
    }
    const isV = (x:string)=>x in V;
    const isC = (x:string)=> (x in C) || (x in T);
  
    let cur:{L:string|null;V:string|null;T:string|null} = {L:null,V:null,T:null};
  
    function emitPreview() {
      let preview = '';
      if (cur.L && cur.V) preview = compose(cur.L,cur.V,cur.T||'');
      else if (cur.L) preview = cur.L;
      else if (cur.V) preview = cur.V;
      dispatch('input', preview);
    }
  
    function commit() {
      if (cur.L || cur.V) {
        const out = cur.L && cur.V ? compose(cur.L,cur.V,cur.T||'') : (cur.L || cur.V || '');
        dispatch('commit', out);
      }
      cur = {L:null,V:null,T:null};
      emitPreview();
    }
  
    function tap(j:string) {
      if (j === ' ') { commit(); dispatch('commit',' '); return; }
      if (j === '\n') { commit(); dispatch('commit','\n'); return; }
  
      if (isV(j)) {
        if (!cur.L && !cur.V) { cur.L='ㅇ'; cur.V=j; return void emitPreview(); }
        if (cur.L && !cur.V) { cur.V=j; return void emitPreview(); }
        if (cur.L && cur.V && !cur.T) {
          const k = `${cur.V}+${j}`;
          if (COMBO_V[k]) { cur.V = COMBO_V[k]; return void emitPreview(); }
          commit(); cur.L='ㅇ'; cur.V=j; return void emitPreview();
        }
        if (cur.L && cur.V && cur.T) { commit(); cur.L='ㅇ'; cur.V=j; return void emitPreview(); }
      } else if (isC(j)) {
        if (!cur.L && !cur.V) { cur.L=j; return void emitPreview(); }
        if (cur.L && !cur.V) {
          const k = `${cur.L}+${j}`;
          if (DOUBLE_CHO[k]) { cur.L=DOUBLE_CHO[k]; return void emitPreview(); }
          // commit bare L and start new
          dispatch('commit', cur.L); cur = {L:j,V:null,T:null}; return void emitPreview();
        }
        if (cur.L && cur.V && !cur.T) { cur.T=j; return void emitPreview(); }
        if (cur.L && cur.V && cur.T) {
          const k = `${cur.T}+${j}`;
          if (COMBO_T[k]) { cur.T=COMBO_T[k]; return void emitPreview(); }
          commit(); cur.L=j; return void emitPreview();
        }
      }
    }
  
    function backspace() {
      if (cur.T) {
        if (SPLIT_T[cur.T]) cur.T = SPLIT_T[cur.T][0]; else cur.T = null;
        return void emitPreview();
      }
      if (cur.V) {
        if (SPLIT_V[cur.V]) cur.V = SPLIT_V[cur.V][0]; else cur.V = null;
        return void emitPreview();
      }
      if (cur.L) {
        if (REV_D[cur.L]) cur.L = REV_D[cur.L]; else cur.L = null;
        return void emitPreview();
      }
      // nothing composing — tell parent to delete one char
      dispatch('commit', '__BACKSPACE__');
    }
  
    const CONS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    const VOWS = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  </script>
  
  <div class="space-y-2">
    <div class="flex flex-wrap gap-2">
      {#each CONS as c}<button class="px-3 py-2 rounded-md border border-slate-600 bg-slate-800 hover:bg-slate-700" on:click={() => tap(c)}>{c}</button>{/each}
    </div>
    <div class="flex flex-wrap gap-2">
      {#each VOWS as v}<button class="px-3 py-2 rounded-md border border-slate-600 bg-slate-800 hover:bg-slate-700" on:click={() => tap(v)}>{v}</button>{/each}
    </div>
    <div class="flex gap-2">
      <button class="px-3 py-2 rounded-md border border-slate-600 bg-slate-800" on:click={() => tap(' ')}>Space</button>
      <button class="px-3 py-2 rounded-md border border-slate-600 bg-slate-800" on:click={() => tap('\n')}>Enter</button>
      <button class="px-3 py-2 rounded-md border border-slate-600 bg-slate-800" on:click={backspace}>⌫</button>
    </div>
  </div>
  