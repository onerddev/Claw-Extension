/* ================================================================
   KAHOOT AI — content.js
   Detecta pergunta + alternativas, chama Groq, clica na resposta.
   
   O Kahoot é um app React. Os botões de resposta têm estrutura:
     <div data-functional-selector="answer-...">
       <span>texto da alternativa</span>
     </div>
   
   Estratégia:
   1. Tick a cada 800ms verificando se apareceu pergunta nova
   2. Aguarda delay configurável (padrão 3s) para parecer humano
   3. Chama Groq com a pergunta + alternativas
   4. Clica no botão da resposta correta
================================================================ */
(function () {
  'use strict';

  /* ═══ CONFIG ═══ */
  const GROQ_KEY = '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';
  const GROQ_MODEL = 'llama-3.3-70b-versatile';
  const DELAY_MS = 3000; // ms antes de responder (parece humano)

  /* ═══ ESTADO ═══ */
  let ON      = false;
  let busy    = false;
  let lastQ   = '';
  let tickId  = null;
  let ui      = null;

  /* ═══ BOOT ═══ */
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'ON')  { ON = true;  buildUI(); startTick(); setStatus('🟢 Monitorando...', '#4ade80'); }
    if (msg.type === 'OFF') { ON = false; stopTick(); setStatus('⭕ Pausado', '#888'); }
    if (msg.type === 'NOW') { busy = false; lastQ = ''; doTick(); }
  });

  /* ═══ TICK ═══ */
  function startTick() { stopTick(); tickId = setInterval(doTick, 800); }
  function stopTick()  { clearInterval(tickId); tickId = null; }

  function doTick() {
    if (!ON || busy) return;
    const { question, options, buttons } = readScreen();
    if (!question || options.length < 2) return;
    if (question === lastQ) return;
    lastQ = question;
    busy  = true;

    setStatus('❓ Pergunta detectada!', '#fbbf24');
    setQuestion(question);

    // aguarda antes de responder
    setTimeout(() => answer(question, options, buttons), DELAY_MS);
  }

  /* ═══ LÊ A TELA ═══
     Kahoot usa data-functional-selector que é estável entre updates.
     Também tenta class fragments como fallback.
  ═══════════════════════════════════════════════════════════════ */
  function readScreen() {
    /* ── pergunta ── */
    const qSels = [
      '[data-functional-selector="question-title"]',
      '[data-functional-selector="block-title"]',
      '[class*="QuestionTitle"]',
      '[class*="question-title"]',
      '[class*="questionTitle"]',
      '[class*="TitleText"]',
    ];
    let question = '';
    for (const s of qSels) {
      const el = document.querySelector(s);
      if (el?.innerText?.trim().length > 2) { question = el.innerText.trim(); break; }
    }

    /* ── alternativas + botões ── */
    const aSels = [
      '[data-functional-selector="answer-text"]',
      '[data-functional-selector*="answer"]',
      '[class*="answerText"]',
      '[class*="AnswerText"]',
      '[class*="answer-text"]',
      '[class*="choiceText"]',
      '[class*="ChoiceText"]',
    ];
    let answerEls = [];
    for (const s of aSels) {
      const els = [...document.querySelectorAll(s)];
      if (els.length >= 2) { answerEls = els; break; }
    }

    const options = answerEls.map(e => e.innerText?.trim()).filter(Boolean);
    const buttons = answerEls.map(e => e.closest('button,[role="button"]') || e);

    return { question, options, buttons };
  }

  /* ═══ HIGHLIGHT — não clica, só destaca ═══ */
  async function answer(question, options, buttons) {
    if (!ON) { busy = false; return; }
    setStatus('🧠 Consultando IA...', '#60a5fa');

    try {
      const idx = await askGroq(question, options);

      if (idx >= 0 && idx < buttons.length) {
        highlightAnswer(buttons, idx);
        setStatus(`💡 Resposta: "${options[idx]}"`, '#4ade80');
        setQuestion(`✅ ${options[idx]}`);
      } else {
        setStatus('⚠️ IA não identificou a resposta', '#f97316');
      }

    } catch (e) {
      setStatus('❌ ' + String(e).slice(0, 55), '#f87171');
      console.error('[KahootAI]', e);
    }

    await sleep(8000);
    clearHighlight();
    busy = false;
    setStatus('🟢 Aguardando próxima pergunta...', '#4ade80');
    setQuestion('');
  }

  /* ═══ DESTACA A RESPOSTA CERTA, ESCURECE AS ERRADAS ═══ */
  const STYLE_ID = '__kai_style__';

  function highlightAnswer(buttons, correctIdx) {
    // remove highlight anterior
    clearHighlight();

    buttons.forEach((btn, i) => {
      if (i === correctIdx) {
        // resposta certa: brilha verde com borda pulsante
        btn.style.setProperty('opacity', '1',          'important');
        btn.style.setProperty('filter',  'brightness(1.15) saturate(1.3)', 'important');
        btn.style.setProperty('transform','scale(1.06)','important');
        btn.style.setProperty('transition','all .3s',  'important');
        btn.style.setProperty('outline', '4px solid #4ade80', 'important');
        btn.style.setProperty('outline-offset', '2px', 'important');
        btn.style.setProperty('box-shadow','0 0 20px rgba(74,222,128,.6)', 'important');
        btn.setAttribute('data-kai', 'correct');
      } else {
        // respostas erradas: ficam transparentes/escuras
        btn.style.setProperty('opacity',  '0.18',      'important');
        btn.style.setProperty('filter',   'grayscale(0.6) brightness(0.5)', 'important');
        btn.style.setProperty('transform','scale(0.97)','important');
        btn.style.setProperty('transition','all .3s',  'important');
        btn.setAttribute('data-kai', 'wrong');
      }
    });
  }

  function clearHighlight() {
    document.querySelectorAll('[data-kai]').forEach(btn => {
      btn.style.removeProperty('opacity');
      btn.style.removeProperty('filter');
      btn.style.removeProperty('transform');
      btn.style.removeProperty('transition');
      btn.style.removeProperty('outline');
      btn.style.removeProperty('outline-offset');
      btn.style.removeProperty('box-shadow');
      btn.removeAttribute('data-kai');
    });
  }

  /* ═══ GROQ ═══ */
  async function askGroq(question, options) {
    const prompt =
`Você é especialista em quizzes. Responda SOMENTE com o número da alternativa correta.

Pergunta: "${question}"

${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Responda APENAS com o número (1, 2, 3 ou 4). Nada mais.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 5,
        temperature: 0.0,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Groq ${res.status}: ${t.slice(0, 80)}`);
    }

    const data  = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '';
    const idx   = parseInt(reply) - 1;

    if (!isNaN(idx) && idx >= 0 && idx < options.length) return idx;

    // fallback: tenta casar o texto
    for (let i = 0; i < options.length; i++) {
      if (reply.toLowerCase().includes(options[i].toLowerCase().slice(0, 10))) return i;
    }

    return -1;
  }

  /* ═══ UTILS ═══ */
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ═══ OVERLAY UI ═══ */
  function buildUI() {
    document.getElementById('__kai__')?.remove();

    ui = document.createElement('div');
    ui.id = '__kai__';
    ui.innerHTML = `
<style>
#__kai__{position:fixed!important;top:14px!important;right:14px!important;z-index:2147483647!important;width:268px;font-family:system-ui,sans-serif;font-size:12px}
#__kb__{background:rgba(5,3,14,.97);border:1px solid rgba(99,102,241,.4);border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.7)}
#__kh__{display:flex;align-items:center;gap:8px;padding:9px 12px;background:linear-gradient(90deg,rgba(79,70,229,.4),rgba(30,20,80,.2));border-bottom:1px solid rgba(99,102,241,.15)}
#__ki__{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
#__kt__{font-weight:700;color:#fff;letter-spacing:1px;flex:1;font-size:12px}
#__kx__{background:none;border:none;color:rgba(255,255,255,.25);cursor:pointer;font-size:15px;padding:0;line-height:1}
#__kx__:hover{color:#f87171}
#__kd__{padding:9px 12px 11px;display:flex;flex-direction:column;gap:5px}
#__ks__{font-size:11.5px;font-weight:600;color:#4ade80;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .3s}
#__kq__{font-size:10px;color:rgba(180,170,220,.5);line-height:1.4;max-height:38px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
#__kbw__{height:2px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}
#__kbp__{height:100%;width:0%;background:linear-gradient(90deg,#4f46e5,#a78bfa);border-radius:2px;transition:width .15s linear}
#__kn__{background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.4);border-radius:7px;color:#a78bfa;font-size:11px;font-weight:600;padding:6px;cursor:pointer;text-align:center;transition:background .2s}
#__kn__:hover{background:rgba(99,102,241,.3)}
</style>
<div id="__kb__">
  <div id="__kh__">
    <div id="__ki__">🎮</div>
    <span id="__kt__">KAHOOT AI</span>
    <button id="__kx__">✕</button>
  </div>
  <div id="__kd__">
    <div id="__ks__">🟢 Aguardando pergunta...</div>
    <div id="__kq__"></div>
    <div id="__kbw__"><div id="__kbp__"></div></div>
    <button id="__kn__">⚡ Responder Agora</button>
  </div>
</div>`;

    document.body.appendChild(ui);
    document.getElementById('__kx__').onclick = () => { ui?.remove(); ui = null; };
    document.getElementById('__kn__').onclick = () => { busy = false; lastQ = ''; doTick(); };
  }

  let barT = null;
  function setStatus(msg, color = '#4ade80') {
    const el = document.getElementById('__ks__');
    if (el) { el.textContent = msg; el.style.color = color; }
    const b = document.getElementById('__kbp__');
    if (!b) return;
    clearInterval(barT);
    if (msg.includes('🧠')) {
      let w = 5; b.style.width = '5%';
      barT = setInterval(() => { w = Math.min(w + 2, 88); b.style.width = w + '%'; }, 80);
    } else if (msg.includes('✅')) {
      clearInterval(barT); b.style.width = '100%';
    } else {
      clearInterval(barT); b.style.width = '0%';
    }
  }

  function setQuestion(q) {
    const el = document.getElementById('__kq__');
    if (el) el.textContent = q;
  }

})();
