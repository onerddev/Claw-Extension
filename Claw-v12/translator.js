/* ================================================================
   CLAW — translator.js
   Tradutor universal que roda em QUALQUER aba.
   
   Funcionalidades:
   1. Selecione qualquer texto na página → aparece tooltip com tradução
   2. No Kahoot: traduz a pergunta automaticamente se estiver em outro idioma
   3. No StopotS: traduz as categorias antes de mandar pra IA
================================================================ */
(function () {
  'use strict';

  const GROQ_KEY   = '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';
  const GROQ_MODEL = 'llama-3.3-70b-versatile';

  let ON   = false;
  let LANG = 'auto';
  let tooltip = null;
  let hideTimer = null;

  /* ── boot ── */
  chrome.storage.sync.get(['tr_on', 'tr_lang'], d => {
    ON   = d.tr_on   || false;
    LANG = d.tr_lang || 'auto';
    if (ON) activate();
  });

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'TR_ON')  { ON = true;  LANG = msg.lang || 'auto'; activate(); }
    if (msg.type === 'TR_OFF') { ON = false; deactivate(); }
  });

  /* ================================================================
     ATIVAÇÃO — escuta seleção de texto
  ================================================================ */
  function activate() {
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('selectionchange', onSelectionChange);
  }

  function deactivate() {
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('selectionchange', onSelectionChange);
    removeTooltip();
  }

  /* ── quando usuário solta o mouse após selecionar ── */
  function onMouseUp(e) {
    if (!ON) return;
    clearTimeout(hideTimer);

    const sel  = window.getSelection();
    const text = sel?.toString().trim();

    if (!text || text.length < 3 || text.length > 2000) {
      hideTimer = setTimeout(removeTooltip, 300);
      return;
    }

    // não traduz se o texto já parece PT-BR
    if (isPtBr(text)) { hideTimer = setTimeout(removeTooltip, 300); return; }

    showTooltip(e.clientX, e.clientY, text);
  }

  function onSelectionChange() {
    const sel = window.getSelection();
    if (!sel || sel.toString().trim().length === 0) {
      hideTimer = setTimeout(removeTooltip, 400);
    }
  }

  /* ================================================================
     DETECTA SE O TEXTO É PT-BR (heurística simples)
  ================================================================ */
  function isPtBr(text) {
    const ptWords = /\b(de|da|do|em|para|com|que|uma|um|não|sim|por|mais|mas|como|seu|sua|este|essa|isso|aqui|lá|quando|onde|quem)\b/i;
    return ptWords.test(text);
  }

  /* ================================================================
     TOOLTIP DE TRADUÇÃO
  ================================================================ */
  function showTooltip(x, y, text) {
    removeTooltip();

    tooltip = document.createElement('div');
    tooltip.id = '__claw_tr__';
    Object.assign(tooltip.style, {
      position      : 'fixed',
      zIndex        : '2147483647',
      background    : '#1c1c1e',
      border        : '1px solid #3a3a3e',
      borderRadius  : '10px',
      padding       : '10px 12px',
      maxWidth      : '280px',
      minWidth      : '120px',
      boxShadow     : '0 8px 24px rgba(0,0,0,.6)',
      fontFamily    : 'Inter, system-ui, sans-serif',
      fontSize      : '12px',
      color         : '#a8a8a8',
      lineHeight    : '1.5',
      pointerEvents : 'auto',
      transition    : 'opacity .15s',
    });

    // posiciona acima do cursor
    const vw = window.innerWidth, vh = window.innerHeight;
    const tipW = 280, tipH = 80;
    let tx = Math.min(x, vw - tipW - 16);
    let ty = y - tipH - 12;
    if (ty < 8) ty = y + 20;
    tooltip.style.left = tx + 'px';
    tooltip.style.top  = ty + 'px';

    tooltip.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;border-bottom:1px solid #3a3a3e;padding-bottom:6px;">
        <span style="font-size:11px;font-weight:600;color:#f0efed;">Claw · Tradutor</span>
        <span style="margin-left:auto;font-size:9px;color:#6b6b6b;">${LANG === 'auto' ? 'auto-detectado' : LANG} → PT-BR</span>
        <button id="__claw_tr_close__" style="background:none;border:none;color:#6b6b6b;cursor:pointer;font-size:13px;padding:0;line-height:1;"><svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg></button>
      </div>
      <div id="__claw_tr_body__" style="color:#6b6b6b;font-style:italic;">Traduzindo...</div>
    `;

    document.body.appendChild(tooltip);
    document.getElementById('__claw_tr_close__').onclick = removeTooltip;

    // fecha ao clicar fora
    setTimeout(() => {
      document.addEventListener('mousedown', outsideClick, { once: true });
    }, 100);

    // traduz
    translate(text).then(result => {
      const body = document.getElementById('__claw_tr_body__');
      if (body) {
        body.style.color       = '#f0efed';
        body.style.fontStyle   = 'normal';
        body.style.fontWeight  = '500';
        body.textContent       = result;
      }
    }).catch(err => {
      const body = document.getElementById('__claw_tr_body__');
      if (body) { body.style.color = '#c46060'; body.textContent = '❌ ' + err.message.slice(0, 40); }
    });
  }

  function outsideClick(e) {
    if (tooltip && !tooltip.contains(e.target)) removeTooltip();
  }

  function removeTooltip() {
    if (tooltip) { tooltip.remove(); tooltip = null; }
    document.removeEventListener('mousedown', outsideClick);
  }

  /* ================================================================
     FUNÇÃO DE TRADUÇÃO — chama Groq
  ================================================================ */
  async function translate(text) {
    const fromDesc = LANG === 'auto' ? 'qualquer idioma' : {
      en:'inglês', es:'espanhol', fr:'francês', de:'alemão', it:'italiano',
      ja:'japonês', zh:'chinês',  ko:'coreano', ar:'árabe',  ru:'russo',
    }[LANG] || LANG;

    const prompt =
      `Traduza do ${fromDesc} para o português brasileiro (PT-BR).\n` +
      `Responda SOMENTE com a tradução. Sem explicações, sem aspas.\n\n` +
      `Texto: ${text}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body   : JSON.stringify({
        model      : GROQ_MODEL,
        messages   : [{ role: 'user', content: prompt }],
        max_tokens : 400,
        temperature: 0.1,
      }),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '—';
  }

  /* ================================================================
     EXPORTA função de tradução para outros scripts do Claw usarem
     (kahoot.js e stopots.js podem chamar window.__clawTranslate__)
  ================================================================ */
  window.__clawTranslate__ = translate;
  window.__clawTranslateOn__ = () => ON;

})();
