/* ================================================================
   CLAW — kahoot.js  v7
   Detecta perguntas com precisão máxima.
   Destaca a resposta certa + apaga as erradas.
   Usuário clica — sem auto-click (mais seguro e preciso).
================================================================ */
(function () {
  'use strict';

  const GROQ_KEY   = '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';
  const GROQ_MODEL = 'llama-3.3-70b-versatile';
  const DELAY_MS   = 2600;
  let   STEALTH    = false;  // modo invisível
  let   USER_DELAY  = 0;      // delay extra configurável

  let ON = false, busy = false, lastQ = '', tickId = null, ui = null;

  /* ── mensagens do popup ── */
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'KAHOOT_ON')  { ON = true;  STEALTH = msg.stealth||false; USER_DELAY = msg.delay||0; buildUI(); startTick(); }
    if (msg.type === 'KAHOOT_OFF') { ON = false; stopTick(); removeUI(); clearHighlight(); }
    if (msg.type === 'KAHOOT_NOW') { busy = false; lastQ = ''; tick(); }
  });

  function startTick() { stopTick(); tickId = setInterval(tick, 700); }
  function stopTick()  { clearInterval(tickId); tickId = null; }

  /* ================================================================
     TICK
  ================================================================ */
  function tick() {
    if (!ON || busy) return;
    const state = readScreen();
    if (!state.question) return;
    if (state.question === lastQ) return;
    lastQ = state.question;
    busy  = true;
    run(state);
  }

  /* ================================================================
     LÊ A TELA — estratégia em camadas
  ================================================================ */
  function readScreen() {
    const question = getQuestion();
    const { els, options } = getAnswerEls();
    return { question, els, options };
  }

  function getQuestion() {
    // camada 1: seletores funcionais (mais estáveis no Kahoot)
    const exact = [
      '[data-functional-selector="question-title"]',
      '[data-functional-selector="block-title"]',
      '[data-functional-selector="question-text"]',
    ];
    for (const s of exact) {
      const el = document.querySelector(s);
      const t  = el?.innerText?.trim();
      if (t && t.length > 2) return t;
    }

    // camada 2: class fragments
    const frags = [
      '[class*="QuestionTitle"]', '[class*="questionTitle"]',
      '[class*="question-title"]', '[class*="TitleText"]',
      '[class*="title--"]', '[class*="Title__"]',
    ];
    for (const s of frags) {
      const el = document.querySelector(s);
      const t  = el?.innerText?.trim();
      if (t && t.length > 2 && t.length < 500) return t;
    }

    return null;
  }

  function getAnswerEls() {
    // camada 1: data-functional-selector
    const funcSels = [
      '[data-functional-selector="answer-text"]',
      '[data-functional-selector="answer"]',
      '[data-functional-selector*="choice"]',
    ];
    for (const s of funcSels) {
      const els = [...document.querySelectorAll(s)].filter(visible);
      if (els.length >= 2) return pack(els);
    }

    // camada 2: class fragments de texto das respostas
    const textSels = [
      '[class*="answerText"]', '[class*="AnswerText"]',
      '[class*="answer-text"]', '[class*="choiceText"]',
      '[class*="ChoiceText"]', '[class*="answer__text"]',
    ];
    for (const s of textSels) {
      const els = [...document.querySelectorAll(s)].filter(visible);
      if (els.length >= 2) return pack(els);
    }

    // camada 3: botões de resposta com aria-label
    const btns = [...document.querySelectorAll('button[aria-label]')]
      .filter(b => visible(b) && b.getAttribute('aria-label').length > 0);
    if (btns.length >= 2) return packButtons(btns);

    return { els: [], options: [] };
  }

  function pack(els) {
    // pega o botão pai de cada elemento de texto
    const btns = els.map(e => {
      let el = e;
      for (let i = 0; i < 5; i++) {
        if (!el) break;
        if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') return el;
        el = el.parentElement;
      }
      return e; // fallback: o próprio elemento
    });
    const options = els.map(e => e.innerText?.trim()).filter(Boolean);
    return { els: btns, options };
  }

  function packButtons(btns) {
    const options = btns.map(b => b.getAttribute('aria-label')?.trim() || b.innerText?.trim()).filter(Boolean);
    return { els: btns, options };
  }

  function visible(el) {
    try {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 &&
        getComputedStyle(el).visibility !== 'hidden' &&
        getComputedStyle(el).display    !== 'none';
    } catch { return false; }
  }

  /* ================================================================
     RUN — consulta IA e destaca
  ================================================================ */
  async function run(state) {
    setUI('thinking', 'Consultando IA...');
    setQuestion(state.question);

    // tradução opcional
    let q = state.question;
    if (window.__clawTranslateOn__?.() && window.__clawTranslate__) {
      try {
        setUI('thinking', 'Traduzindo...');
        const translated = await window.__clawTranslate__(q);
        if (translated && translated !== q) {
          q = translated;
          setQuestion(`${state.question}\n→ ${q}`);
        }
      } catch {}
    }

    // aguarda delay
    await sleep(DELAY_MS + USER_DELAY);
    if (!ON) { busy = false; return; }

    // re-lê tela (pode ter mudado)
    const fresh = readScreen();
    if (!fresh.options.length) {
      setUI('error', 'Alternativas não encontradas');
      await sleep(4000);
      busy = false;
      setUI('idle', 'Monitorando...');
      return;
    }

    try {
      const idx = await askGroq(q, fresh.options);

      if (idx >= 0 && idx < fresh.els.length) {
        highlight(fresh.els, idx);
        setUI('done', fresh.options[idx]);
        setQuestion(state.question);
        // salva no histórico e stats
        try {
          window.ClawStats?.addKahoot();
          window.ClawStats?.addHistory({ type: 'kahoot', question: state.question, answer: fresh.options[idx] });
        } catch {}
      } else {
        setUI('error', 'Não identificou a resposta');
      }
    } catch (e) {
      setUI('error', e.message.slice(0, 45));
      console.error('[Claw/Kahoot]', e);
    }

    // limpa após 9s (tempo suficiente para o usuário clicar)
    await sleep(9000);
    clearHighlight();
    busy = false;
    setUI('idle', 'Monitorando...');
    setQuestion('');
  }

  /* ================================================================
     GROQ
  ================================================================ */
  async function askGroq(question, options) {
    const prompt =
      `Você é especialista em quizzes. Responda SOMENTE com o número da alternativa correta.\n\n` +
      `Pergunta: "${question}"\n\n` +
      options.map((o, i) => `${i + 1}. ${o}`).join('\n') +
      `\n\nResponda APENAS com o número (${options.map((_, i) => i+1).join(', ')}). Nada mais.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body   : JSON.stringify({
        model      : GROQ_MODEL,
        messages   : [{ role: 'user', content: prompt }],
        max_tokens : 5,
        temperature: 0.0,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Groq ${res.status}: ${t.slice(0, 60)}`);
    }

    const data  = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '';
    let idx = parseInt(reply) - 1;

    if (isNaN(idx) || idx < 0 || idx >= options.length) {
      // fallback: procura o texto da opção na resposta
      for (let i = 0; i < options.length; i++) {
        if (reply.toLowerCase().includes(options[i].toLowerCase().slice(0, 12))) {
          return i;
        }
      }
      return -1;
    }
    return idx;
  }

  /* ================================================================
     HIGHLIGHT — destaca certa, apaga erradas
  ================================================================ */
  function highlight(els, correctIdx) {
    clearHighlight();
    els.forEach((el, i) => {
      if (i === correctIdx) {
        el.style.setProperty('opacity',       '1',                            'important');
        el.style.setProperty('filter',        'brightness(1.1)',              'important');
        el.style.setProperty('transform',     'scale(1.03)',                  'important');
        el.style.setProperty('transition',    'all .3s ease',                 'important');
        el.style.setProperty('outline',       '3px solid rgba(255,255,255,.9)','important');
        el.style.setProperty('outline-offset','3px',                          'important');
        el.style.setProperty('box-shadow',    '0 0 0 7px rgba(255,255,255,.1)','important');
        el.setAttribute('data-claw-k', 'correct');
      } else {
        el.style.setProperty('opacity',    '0.13',                          'important');
        el.style.setProperty('filter',     'grayscale(1) brightness(0.35)', 'important');
        el.style.setProperty('transform',  'scale(0.97)',                   'important');
        el.style.setProperty('transition', 'all .3s ease',                  'important');
        el.setAttribute('data-claw-k', 'wrong');
      }
    });
  }

  function clearHighlight() {
    document.querySelectorAll('[data-claw-k]').forEach(el => {
      ['opacity','filter','transform','transition','outline','outline-offset','box-shadow']
        .forEach(p => el.style.removeProperty(p));
      el.removeAttribute('data-claw-k');
    });
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ================================================================
     OVERLAY UI — interface limpa estilo Claude
  ================================================================ */

  // ícone do mascote em base64 (embutido)
  const MASCOT_B64 = 'data:image/png;base64,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';

  /* ── stealth: Alt+H mostra/oculta overlay ── */
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key === 'h') {
      const box = document.getElementById('__ck_card__');
      if (box) box.style.display = box.style.display === 'none' ? '' : 'none';
    }
  });

  function buildUI() {
    document.getElementById('__claw_k__')?.remove();
    ui = document.createElement('div');
    ui.id = '__claw_k__';

    ui.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

#__claw_k__ {
  position: fixed !important;
  top: 14px !important;
  right: 14px !important;
  z-index: 2147483647 !important;
  width: 258px;
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* card principal */
#__ck_card__ {
  background: #1c1c1e;
  border: 1px solid #3a3a3e;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.04);
}

/* header */
#__ck_hd__ {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #3a3a3e;
  background: #222224;
}

#__ck_mascot__ {
  width: 20px; height: 20px;
  flex-shrink: 0;
  object-fit: contain;
  border-radius: 4px;
}

#__ck_title__ {
  font-size: 12px;
  font-weight: 600;
  color: #f0efed;
  flex: 1;
  letter-spacing: .2px;
}

/* badge de modo com ícone */
#__ck_badge__ {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  font-weight: 500;
  color: #6b6b6b;
  background: #2a2a2d;
  border: 1px solid #3a3a3e;
  border-radius: 5px;
  padding: 2px 7px;
  letter-spacing: .3px;
}
#__ck_badge__ svg { flex-shrink: 0; }

/* indicador de estado (bolinha) */
#__ck_dot__ {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #48484d;
  flex-shrink: 0;
  transition: background .3s, box-shadow .3s;
}
#__ck_dot__.thinking { background: #d4a85a; box-shadow: 0 0 6px rgba(212,168,90,.5); }
#__ck_dot__.done     { background: #5a9e6f; box-shadow: 0 0 6px rgba(90,158,111,.5); }
#__ck_dot__.error    { background: #c46060; }

/* fechar */
#__ck_close__ {
  background: none; border: none;
  color: #48484d; cursor: pointer;
  width: 20px; height: 20px;
  border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  transition: color .15s, background .15s;
  flex-shrink: 0;
}
#__ck_close__:hover { color: #f0efed; background: #323235; }
#__ck_close__ svg { width: 10px; height: 10px; }

/* body */
#__ck_body__ {
  padding: 10px 12px 11px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

/* linha de status */
#__ck_status_row__ {
  display: flex;
  align-items: center;
  gap: 7px;
}
#__ck_st__ {
  font-size: 11.5px;
  font-weight: 500;
  color: #a8a8a8;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color .25s;
}
#__ck_st__.thinking { color: #d4a85a; }
#__ck_st__.done     { color: #5a9e6f; }
#__ck_st__.error    { color: #c46060; }

/* pergunta */
#__ck_q__ {
  font-size: 10px;
  color: #6b6b6b;
  line-height: 1.45;
  max-height: 34px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* barra de progresso */
#__ck_pw__ {
  height: 2px;
  background: #2a2a2d;
  border-radius: 2px;
  overflow: hidden;
}
#__ck_pb__ {
  height: 100%;
  width: 0%;
  background: #d4a85a;
  border-radius: 2px;
  transition: width .15s linear;
}

/* botão forçar análise */
#__ck_btn__ {
  background: #2a2a2d;
  border: 1px solid #3a3a3e;
  border-radius: 8px;
  color: #a8a8a8;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 500;
  padding: 7px 10px;
  cursor: pointer;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background .15s, border-color .15s, color .15s;
}
#__ck_btn__:hover {
  background: #323235;
  border-color: #48484d;
  color: #f0efed;
}
#__ck_btn__ svg { width: 12px; height: 12px; flex-shrink: 0; }
</style>

<div id="__ck_card__">
  <div id="__ck_hd__">
    <img id="__ck_mascot__" src="${MASCOT_B64}" alt=""/>
    <span id="__ck_title__">Claw</span>
    <span id="__ck_badge__">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      Kahoot
    </span>
    <div id="__ck_dot__"></div>
    <button id="__ck_close__">
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="1" y1="1" x2="11" y2="11"/>
        <line x1="11" y1="1" x2="1" y2="11"/>
      </svg>
    </button>
  </div>

  <div id="__ck_body__">
    <div id="__ck_status_row__">
      <div id="__ck_st__">Monitorando...</div>
    </div>
    <div id="__ck_q__"></div>
    <div id="__ck_pw__"><div id="__ck_pb__"></div></div>
    <button id="__ck_btn__">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      Analisar agora
    </button>
  </div>
</div>`;

    document.body.appendChild(ui);
    document.getElementById('__ck_close__').onclick = () => { ui?.remove(); ui = null; clearHighlight(); };
    document.getElementById('__ck_btn__').onclick   = () => { busy = false; lastQ = ''; tick(); };
  }

  function removeUI() { ui?.remove(); ui = null; }

  let barTimer = null;

  function setUI(state, msg) {
    const st  = document.getElementById('__ck_st__');
    const dot = document.getElementById('__ck_dot__');
    const bar = document.getElementById('__ck_pb__');
    if (!st) return;

    st.textContent = msg;
    st.className   = state;
    if (dot) dot.className = state;

    clearInterval(barTimer);
    if (!bar) return;
    if (state === 'thinking') {
      let w = 5; bar.style.width = '5%';
      barTimer = setInterval(() => { w = Math.min(w + 1.2, 88); bar.style.width = w + '%'; }, 80);
    } else if (state === 'done') {
      bar.style.width = '100%';
    } else {
      bar.style.width = '0%';
    }
  }

  function setQuestion(q) {
    const el = document.getElementById('__ck_q__');
    if (el) el.textContent = q || '';
  }

})();
