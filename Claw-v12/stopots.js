/* ================================================================
   CLAW — stopots.js  v8
   Reescrito do zero. Detecta letra + categorias do StopotS,
   consulta Groq e preenche com o trick correto do Angular.
================================================================ */
(function () {
  'use strict';

  const GROQ_KEY   = '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';
  const GROQ_MODEL = 'llama-3.3-70b-versatile';

  /* ── estado ── */
  let ON      = false;
  let busy    = false;
  let lastKey = '';
  let tickId  = null;
  let ui      = null;
  let barTimer= null;

  /* ── boot ── */
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'STOP_ON')  { ON = true;  buildUI(); startTick(); setState('idle', 'Aguardando rodada...'); }
    if (msg.type === 'STOP_OFF') { ON = false; stopTick(); removeUI(); }
    if (msg.type === 'STOP_NOW') { busy = false; lastKey = ''; tick(); }
  });

  function startTick() { stopTick(); tickId = setInterval(tick, 700); }
  function stopTick()  { clearInterval(tickId); tickId = null; }

  /* ================================================================
     TICK
  ================================================================ */
  async function tick() {
    if (!ON || busy) return;

    const letter  = getLetter();
    const pairs   = getPairs();
    if (!letter || pairs.length === 0) return;

    const empties = pairs.filter(p => p.el.value.trim() === '');
    if (empties.length === 0) return;

    const key = letter + '|' + empties.map(p => p.cat).join(',');
    if (key === lastKey) return;
    lastKey = key;

    await run(letter, empties);
  }

  /* ================================================================
     DETECTA A LETRA SORTEADA
  ================================================================ */
  function getLetter() {
    const SELS = [
      '.round-letter',
      '[class*="round-letter"]',
      '[class*="roundLetter"]',
      '[class*="RoundLetter"]',
      '[class*="letter-display"]',
      '[class*="current-letter"]',
      '[class*="game-letter"]',
      '[class*="gameLetter"]',
      '[class*="currentLetter"]',
      '[class*="sortedLetter"]',
      '[class*="the-letter"]',
      '[id*="letter"]',
    ];

    for (const s of SELS) {
      try {
        const el = document.querySelector(s);
        if (!el) continue;
        const t = (el.innerText || el.textContent || '').trim();
        if (t.length === 1 && /[A-Za-zÀ-ÿ]/.test(t)) return t.toUpperCase();
      } catch {}
    }

    /* fallback: elemento folha visível com 1 letra em fonte >= 20px */
    for (const el of document.querySelectorAll('span, div, h1, h2, h3, p, b, strong')) {
      try {
        if (el.children.length > 0) continue;
        const t = (el.innerText || '').trim();
        if (t.length !== 1 || !/[A-Za-zÀ-ÿ]/.test(t)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 20) continue;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return t.toUpperCase();
      } catch {}
    }

    return null;
  }

  /* ================================================================
     DETECTA INPUTS + CATEGORIA DE CADA UM
  ================================================================ */
  function getPairs() {
    return [...document.querySelectorAll('input[type="text"], input:not([type])')]
      .filter(el => {
        if (el.disabled || el.readOnly) return false;
        try {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        } catch { return false; }
      })
      .map(el => ({ el, cat: getLabel(el) }));
  }

  function getLabel(inp) {
    /* 1. placeholder */
    const ph = (inp.placeholder || '').trim();
    if (ph.length > 1) return ph;

    /* 2. aria-label */
    const al = (inp.getAttribute('aria-label') || '').trim();
    if (al.length > 1) return al;

    /* 3. label[for] */
    if (inp.id) {
      try {
        const lbl = document.querySelector(`label[for="${CSS.escape(inp.id)}"]`);
        if (lbl?.innerText?.trim()) return lbl.innerText.trim();
      } catch {}
    }

    /* 4. sobe o DOM até 8 níveis */
    let el = inp.parentElement;
    for (let i = 0; i < 8; i++) {
      if (!el) break;
      for (const child of el.querySelectorAll('span, label, p, div, b, strong, h1, h2, h3, h4')) {
        if (child === inp || child.contains(inp)) continue;
        const t = (child.innerText || '').trim();
        if (t.length > 1 && t.length < 60 && !t.includes('\n')) return t;
      }
      el = el.parentElement;
    }

    return 'campo';
  }

  /* ================================================================
     DICIONÁRIO DE ABREVIAÇÕES DO STOPOTS
  ================================================================ */
  const CATS = {
    'pch': 'Parte do Corpo Humano (órgão, osso, membro)',
    'p.c.h': 'Parte do Corpo Humano',
    'p.c.h.': 'Parte do Corpo Humano',
    'parte do corpo humano': 'Parte do Corpo Humano',
    'cep': 'Cidade, Estado ou País',
    'c.e.p': 'Cidade, Estado ou País',
    'c.e.p.': 'Cidade, Estado ou País',
    'cidade estado ou pais': 'Cidade, Estado ou País',
    'cidade estado ou país': 'Cidade, Estado ou País',
    'fds': 'Filme, Desenho ou Série (título real)',
    'f.d.s': 'Filme, Desenho ou Série',
    'f.d.s.': 'Filme, Desenho ou Série',
    'filme desenho ou serie': 'Filme, Desenho ou Série',
    'filme desenho ou série': 'Filme, Desenho ou Série',
    'jlr': 'Jornal, Livro ou Revista (título real)',
    'j.l.r': 'Jornal, Livro ou Revista',
    'j.l.r.': 'Jornal, Livro ou Revista',
    'pda': 'Personagem de Desenho Animado',
    'p.d.a': 'Personagem de Desenho Animado',
    'p.d.a.': 'Personagem de Desenho Animado',
    'mse': 'Adjetivo que descreve uma pessoa (ex: Bonita, Chata)',
    'msé': 'Adjetivo que descreve uma pessoa',
    'ms e': 'Adjetivo que descreve uma pessoa',
    'ms é': 'Adjetivo que descreve uma pessoa',
    'minha sogra e': 'Adjetivo que descreve uma pessoa',
    'minha sogra é': 'Adjetivo que descreve uma pessoa',
    'minha sogra é (mse)': 'Adjetivo que descreve uma pessoa',
    'mne': 'Adjetivo que descreve uma pessoa',
    'mné': 'Adjetivo que descreve uma pessoa',
    'meu namorado e': 'Adjetivo que descreve uma pessoa',
    'meu namorado é': 'Adjetivo que descreve uma pessoa',
    'minha namorada é': 'Adjetivo que descreve uma pessoa',
    'mst': 'Objeto ou coisa material',
    'minha sogra tem': 'Objeto ou coisa material',
    'snb': 'Bebida (alcoólica ou não)',
    'seu namorado bebe': 'Bebida',
    'mme': 'Marca famosa de produto ou empresa',
    'nome': 'Nome próprio de pessoa',
    'nome de pessoa': 'Nome próprio de pessoa',
    'nome proprio': 'Nome próprio de pessoa',
    'nome próprio': 'Nome próprio de pessoa',
    'nome feminino': 'Nome próprio feminino',
    'nome masculino': 'Nome próprio masculino',
    'sobrenome': 'Sobrenome de família',
    'animal': 'Animal (qualquer espécie)',
    'bicho': 'Animal',
    'fruta': 'Fruta comestível',
    'fruto': 'Fruta comestível',
    'cor': 'Cor ou tonalidade',
    'cores': 'Cor ou tonalidade',
    'objeto': 'Objeto ou coisa material',
    'coisa': 'Objeto material',
    'lugar': 'Lugar ou local',
    'local': 'Lugar ou local',
    'cidade': 'Nome de cidade',
    'estado': 'Nome de estado brasileiro',
    'pais': 'Nome de país',
    'país': 'Nome de país',
    'profissao': 'Profissão',
    'profissão': 'Profissão',
    'carro': 'Marca ou modelo de carro',
    'automovel': 'Marca de carro',
    'automóvel': 'Marca de carro',
    'veiculo': 'Veículo',
    'veículo': 'Veículo',
    'time': 'Time de futebol',
    'time de futebol': 'Time de futebol',
    'clube': 'Clube esportivo',
    'flor': 'Nome de flor',
    'flores': 'Nome de flor',
    'planta': 'Nome de planta',
    'arvore': 'Nome de árvore',
    'árvore': 'Nome de árvore',
    'alimento': 'Alimento ou comida',
    'comida': 'Comida ou prato',
    'bebida': 'Bebida',
    'musica': 'Título de música real',
    'música': 'Título de música',
    'cantor': 'Nome de cantor ou cantora',
    'cantora': 'Nome de cantora',
    'banda': 'Nome de banda musical',
    'ator': 'Nome de ator',
    'atriz': 'Nome de atriz',
    'artista': 'Nome de artista famoso',
    'personagem': 'Nome de personagem famoso',
    'personagem biblico': 'Personagem da Bíblia',
    'personagem bíblico': 'Personagem da Bíblia',
    'filme': 'Título de filme',
    'serie': 'Título de série de TV',
    'série': 'Título de série de TV',
    'desenho animado': 'Título de desenho animado',
    'desenho': 'Título de desenho animado',
    'novela': 'Título de novela brasileira',
    'anime': 'Título de anime japonês',
    'esporte': 'Nome de esporte',
    'instrumento': 'Instrumento musical',
    'instrumento musical': 'Instrumento musical',
    'doenca': 'Nome de doença',
    'doença': 'Nome de doença',
    'remedio': 'Nome de remédio',
    'remédio': 'Nome de remédio',
    'super heroi': 'Nome de super-herói',
    'super herói': 'Nome de super-herói',
    'heroi': 'Nome de herói',
    'herói': 'Nome de herói',
    'vilao': 'Nome de vilão',
    'vilão': 'Nome de vilão',
    'marca': 'Marca famosa',
    'marcas': 'Marca famosa',
    'marca de roupa': 'Marca de roupa',
    'roupa': 'Peça de roupa',
    'adjetivo': 'Adjetivo em português',
    'substantivo': 'Substantivo em português',
    'verbo': 'Verbo em português',
    'bairro': 'Nome de bairro',
    'capital': 'Cidade capital',
    'celebridade': 'Celebridade famosa',
    'famoso': 'Pessoa famosa',
    'santo': 'Nome de santo ou santa',
    'nome de santo': 'Nome de santo ou santa',
    'presidente': 'Nome de presidente',
    'jogo': 'Nome de jogo',
    'videogame': 'Nome de videogame',
    'pais da europa': 'País da Europa',
    'país da europa': 'País da Europa',
    'pais da america': 'País das Américas',
    'pais da africa': 'País da África',
    'pais da asia': 'País da Ásia',
    'objeto escolar': 'Objeto de escola',
    'objeto de cozinha': 'Utensílio de cozinha',
    'time de basquete': 'Time de basquete',
    'palavra': 'Qualquer palavra em português',
  };

  function expandCat(raw) {
    const norm = s => (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[().]/g, '').replace(/\s+/g, ' ').trim();
    const k = norm(raw);
    for (const [key, val] of Object.entries(CATS)) {
      if (norm(key) === k) return val;
    }
    for (const [key, val] of Object.entries(CATS)) {
      const nk = norm(key);
      if (k.includes(nk) || nk.includes(k)) return val;
    }
    return raw.trim();
  }

  /* ================================================================
     EXECUÇÃO PRINCIPAL
  ================================================================ */
  async function run(letter, pairs) {
    busy = true;
    setLetter(letter);
    setState('thinking', `Gerando respostas para "${letter}"...`);
    showList(pairs.map(p => ({ cat: p.cat, ans: '...' })));
    animBar(true);

    try {
      const expanded = pairs.map(p => expandCat(p.cat));

      // verifica cache primeiro — responde instantaneamente se já viu
      const cached = pairs.map(p =>
        window.ClawStats?.getCached(letter, p.cat) || null
      );
      const allCached = cached.every(a => a !== null);

      if (allCached) {
        animBar(false);
        showList(pairs.map((p, i) => ({ cat: p.cat, ans: cached[i] })));
        for (let i = 0; i < pairs.length; i++) {
          const { el, cat } = pairs[i];
          if (!cached[i] || el.value.trim() !== '') continue;
          await sleep(60 + rnd(40));
          fillAngular(el, cached[i]);
          markDone(i);
          setState('done', `${cat}: ${cached[i]} (cache)`);
        }
        await sleep(200);
        clickStop();
        setState('done', 'Pronto! (do cache)');
        try { window.ClawStats?.addStop(); } catch {}
        await sleep(6000);
        busy = false; lastKey = '';
        setState('idle', 'Aguardando rodada...');
        return;
      }

      const prompt =
        `Jogo Stop/Adedonha. Letra: "${letter}".\n` +
        `Para cada categoria, dê UMA resposta em português que comece com "${letter}".\n` +
        `- Real, conhecida, máx 3 palavras\n` +
        `- NÃO repetir\n` +
        `- Se impossível use "-"\n\n` +
        expanded.map((c, i) => `${i + 1}. ${c}`).join('\n') +
        `\n\nResponda SOMENTE JSON: {"r":["resp1","resp2",...]}`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body   : JSON.stringify({
          model      : GROQ_MODEL,
          messages   : [{ role: 'user', content: prompt }],
          max_tokens : 400,
          temperature: 0.2,
        }),
      });

      if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 80)}`);

      const data  = await res.json();
      const reply = (data.choices?.[0]?.message?.content || '').trim();
      const match = reply.match(/\{[\s\S]*?\}/);
      if (!match) throw new Error('IA não retornou JSON válido');

      const answers = (JSON.parse(match[0]).r || []).map(a => {
        const s = (a || '').trim();
        return (s === '-' || s === '---') ? '' : s;
      });

      animBar(false);
      showList(pairs.map((p, i) => ({ cat: p.cat, ans: answers[i] || '—' })));

      /* preenche cada input */
      for (let i = 0; i < pairs.length; i++) {
        const { el, cat } = pairs[i];
        const ans = answers[i];
        if (!ans || el.value.trim() !== '') continue;

        await sleep(80 + rnd(60));
        fillAngular(el, ans);
        markDone(i);
        setState('done', `${cat}: ${ans}`);
        await sleep(60);
      }

      /* tenta clicar STOP */
      await sleep(200);
      clickStop();

      // salva no cache e stats
      try {
        for (let i = 0; i < pairs.length; i++) {
          if (answers[i]) window.ClawStats?.setCache(letter, pairs[i].cat, answers[i]);
        }
        window.ClawStats?.addStop();
        window.ClawStats?.addHistory({ type: 'stop', letter, cats: pairs.map(p=>p.cat), answers });
      } catch {}

      setState('done', `Pronto! Aguardando próxima rodada...`);

    } catch (e) {
      animBar(false);
      setState('error', 'Erro: ' + String(e).slice(0, 50));
      console.error('[Claw/StopotS]', e);
    }

    await sleep(7000);
    busy    = false;
    lastKey = '';
    setState('idle', 'Aguardando rodada...');
  }

  /* ================================================================
     PREENCHE INPUT DO ANGULAR
     O Angular usa ngModel — precisa do nativeInputValueSetter
     + evento 'input' com bubbles:true para o two-way binding funcionar.
  ================================================================ */
  function fillAngular(el, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    el.focus();
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
  }

  /* ================================================================
     CLICA NO BOTÃO STOP
  ================================================================ */
  function clickStop() {
    for (const el of document.querySelectorAll('button, [role="button"]')) {
      const t = (el.innerText || '').trim().toUpperCase();
      if (['STOP', 'STOP!', 'PARAR', 'ENVIAR'].includes(t)) {
        try {
          const r = el.getBoundingClientRect();
          if (r.width > 0) { el.click(); return; }
        } catch {}
      }
    }
    for (const s of ['[class*="stop-btn"]', '[class*="stopBtn"]', 'button[class*="stop" i]']) {
      const el = document.querySelector(s);
      if (el) { el.click(); return; }
    }
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rnd   = n  => Math.floor(Math.random() * n);

  /* ================================================================
     OVERLAY UI
  ================================================================ */
  const MASCOT = 'data:image/png;base64,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';

  function buildUI() {
    document.getElementById('__claw_s__')?.remove();

    ui = document.createElement('div');
    ui.id = '__claw_s__';
    ui.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
#__claw_s__{position:fixed!important;top:14px!important;right:14px!important;z-index:2147483647!important;width:262px;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
#__cs_card__{background:#1c1c1e;border:1px solid #3a3a3e;border-radius:14px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.04);}
#__cs_hd__{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #3a3a3e;background:#222224;}
#__cs_mascot__{width:20px;height:20px;flex-shrink:0;object-fit:contain;border-radius:4px;}
#__cs_title__{font-size:12px;font-weight:600;color:#f0efed;flex:1;letter-spacing:.2px;}
#__cs_badge__{display:flex;align-items:center;gap:4px;font-size:9px;font-weight:500;color:#6b6b6b;background:#2a2a2d;border:1px solid #3a3a3e;border-radius:5px;padding:2px 7px;}
#__cs_badge__ svg{flex-shrink:0;}
#__cs_ltr__{min-width:24px;height:24px;border-radius:6px;background:#2a2a2d;border:1px solid #48484d;color:#d4a85a;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;}
#__cs_dot__{width:7px;height:7px;border-radius:50%;background:#48484d;flex-shrink:0;transition:background .3s,box-shadow .3s;}
#__cs_dot__.thinking{background:#d4a85a;box-shadow:0 0 0 3px rgba(212,168,90,.2);}
#__cs_dot__.done{background:#5a9e6f;box-shadow:0 0 0 3px rgba(90,158,111,.2);}
#__cs_dot__.error{background:#c46060;}
#__cs_close__{background:none;border:none;color:#48484d;cursor:pointer;width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;transition:color .15s,background .15s;flex-shrink:0;}
#__cs_close__:hover{color:#f0efed;background:#323235;}
#__cs_close__ svg{width:10px;height:10px;}
#__cs_body__{padding:10px 12px 11px;display:flex;flex-direction:column;gap:6px;}
#__cs_st__{font-size:11.5px;font-weight:500;color:#a8a8a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .25s;}
#__cs_st__.thinking{color:#d4a85a;}
#__cs_st__.done{color:#5a9e6f;}
#__cs_st__.error{color:#c46060;}
#__cs_list__{display:flex;flex-direction:column;gap:2px;max-height:130px;overflow-y:auto;}
#__cs_list__::-webkit-scrollbar{width:3px;}
#__cs_list__::-webkit-scrollbar-thumb{background:#3a3a3e;border-radius:2px;}
.cs-row{display:flex;align-items:center;gap:6px;padding:2px 0;font-size:10.5px;}
.cs-cat{flex:1;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cs-ans{color:#d4a85a;font-weight:600;min-width:60px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .25s;}
.cs-ans.ok{color:#5a9e6f;}
#__cs_pw__{height:2px;background:#2a2a2d;border-radius:2px;overflow:hidden;}
#__cs_pb__{height:100%;width:0%;background:#d4a85a;border-radius:2px;transition:width .15s linear;}
#__cs_btn__{background:#2a2a2d;border:1px solid #3a3a3e;border-radius:8px;color:#a8a8a8;font-family:'Inter',system-ui,sans-serif;font-size:11px;font-weight:500;padding:7px 10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;width:100%;transition:background .15s,border-color .15s,color .15s;}
#__cs_btn__:hover{background:#323235;border-color:#48484d;color:#f0efed;}
#__cs_btn__ svg{width:12px;height:12px;flex-shrink:0;}
</style>
<div id="__cs_card__">
  <div id="__cs_hd__">
    <img id="__cs_mascot__" src="${MASCOT}" alt=""/>
    <span id="__cs_title__">Claw</span>
    <span id="__cs_badge__">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/></svg>
      StopotS
    </span>
    <div id="__cs_ltr__">?</div>
    <div id="__cs_dot__"></div>
    <button id="__cs_close__">
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="1" y1="1" x2="11" y2="11"/>
        <line x1="11" y1="1" x2="1" y2="11"/>
      </svg>
    </button>
  </div>
  <div id="__cs_body__">
    <div id="__cs_st__">Aguardando rodada...</div>
    <div id="__cs_list__"></div>
    <div id="__cs_pw__"><div id="__cs_pb__"></div></div>
    <button id="__cs_btn__">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
      </svg>
      Preencher agora
    </button>
  </div>
</div>`;

    document.body.appendChild(ui);

    document.getElementById('__cs_close__').onclick = () => { ui?.remove(); ui = null; };
    document.getElementById('__cs_btn__').onclick   = () => { busy = false; lastKey = ''; tick(); };

    /* atualiza badge da letra a cada 900ms */
    setInterval(() => {
      const l  = getLetter();
      const el = document.getElementById('__cs_ltr__');
      if (el) el.textContent = l || '?';
    }, 900);
  }

  function removeUI() { ui?.remove(); ui = null; }

  /* ── helpers de UI ── */
  function setState(cls, msg) {
    const st  = document.getElementById('__cs_st__');
    const dot = document.getElementById('__cs_dot__');
    if (st)  { st.textContent = msg; st.className = cls; }
    if (dot) dot.className = cls;
  }

  function setLetter(l) {
    const el = document.getElementById('__cs_ltr__');
    if (el) el.textContent = l || '?';
  }

  function showList(items) {
    const el = document.getElementById('__cs_list__');
    if (!el) return;
    el.innerHTML = items.map(({ cat, ans }, i) =>
      `<div class="cs-row">
        <span class="cs-cat">${cat}</span>
        <span class="cs-ans" id="__cs_a${i}__">${ans}</span>
      </div>`
    ).join('');
  }

  function markDone(i) {
    const el = document.getElementById(`__cs_a${i}__`);
    if (el) el.classList.add('ok');
  }

  function animBar(on) {
    const b = document.getElementById('__cs_pb__');
    if (!b) return;
    clearInterval(barTimer);
    if (on) {
      let w = 5; b.style.width = '5%';
      barTimer = setInterval(() => { w = Math.min(w + 1.2, 88); b.style.width = w + '%'; }, 80);
    } else {
      b.style.width = '0%';
    }
  }

})();
