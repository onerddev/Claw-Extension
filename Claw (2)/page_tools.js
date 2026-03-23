/* CLAW — page_tools.js v18 | Desenvolvido por Emanuel Felipe
   Corrigido: HTTP 400 (texto muito grande), resumidor sem toggle,
   explicador fechando rápido, erros de API expostos claramente.
*/
(function () {
  'use strict';

  const KEY   = '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';
  const MODEL = 'llama-3.1-8b-instant';

  let SUMMARIZE_ON = false;
  let EXPLAIN_ON   = false;
  let _tipEl       = null;
  let _outside     = null;

  /* ── Mensagens ── */
  chrome.runtime.onMessage.addListener((msg, _, reply) => {
    if (msg.type === 'TOOLS_ON') {
      SUMMARIZE_ON = !!msg.summarize;
      EXPLAIN_ON   = !!msg.explain;
      _setup();
      reply({ ok: true });
    }
    if (msg.type === 'TOOLS_OFF') {
      SUMMARIZE_ON = false;
      EXPLAIN_ON   = false;
      _teardown();
      reply({ ok: true });
    }
    if (msg.type === 'DO_SUMMARIZE') {
      /* FIX: resumir funciona mesmo sem toggle ativo */
      _doSummarize();
      reply({ ok: true });
    }
    return false;
  });

  /* Carrega estado salvo */
  try {
    chrome.storage.sync.get(['summarize_on', 'explain_on'], d => {
      SUMMARIZE_ON = !!d.summarize_on;
      EXPLAIN_ON   = !!d.explain_on;
      if (SUMMARIZE_ON || EXPLAIN_ON) _setup();
    });
  } catch(e) {}

  function _setup() {
    document.removeEventListener('mouseup', _onMouseUp);
    if (EXPLAIN_ON) document.addEventListener('mouseup', _onMouseUp);
  }

  function _teardown() {
    document.removeEventListener('mouseup', _onMouseUp);
    _removeTip();
  }

  /* ── EXPLICADOR ── */
  function _onMouseUp(e) {
    if (!EXPLAIN_ON) return;
    /* FIX: ignora clique dentro do próprio tooltip */
    if (_tipEl && _tipEl.contains(e.target)) return;

    const txt = (window.getSelection()?.toString() || '').trim();
    if (!txt || txt.length < 5) { _removeTip(); return; }

    /* FIX: limita a 1500 chars para não estourar a API */
    const safe = txt.slice(0, 1500);
    _showExplainTip(e.clientX, e.clientY, safe);
  }

  function _showExplainTip(x, y, txt) {
    _removeTip();

    const tip = document.createElement('div');
    tip.id = '__claw_explain__';

    const vw   = window.innerWidth;
    const vh   = window.innerHeight;
    const left = Math.min(Math.max(x - 10, 8), vw - 310);
    const top  = (y - 130 > 8) ? y - 130 : y + 18;

    tip.style.cssText = [
      'position:fixed!important',
      `left:${left}px!important`,
      `top:${Math.min(top, vh - 180)}px!important`,
      'z-index:2147483647!important',
      'width:300px',
      'max-height:300px',
      'background:#1c1c1e',
      'border:1px solid #3a3a3e',
      'border-radius:11px',
      'box-shadow:0 10px 36px rgba(0,0,0,.75)',
      'font-family:Inter,system-ui,sans-serif',
      'font-size:12px',
      'overflow:hidden',
      'display:flex',
      'flex-direction:column',
    ].join(';');

    tip.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;padding:8px 11px;
        border-bottom:1px solid #2e2e34;background:#222224;flex-shrink:0;">
        <span style="font-size:11px;font-weight:600;color:#f0efed;">Claw · Explicar</span>
        <span style="margin-left:auto;font-size:9px;color:#5a5a66;">${txt.length} chars</span>
        <button id="__cex_x__" style="background:none;border:none;color:#5a5a66;
          cursor:pointer;font-size:14px;padding:0 3px;line-height:1;">✕</button>
      </div>
      <div id="__cex_body__" style="padding:10px 12px;color:#6b6b6b;font-style:italic;
        overflow-y:auto;line-height:1.6;flex:1;">
        Explicando...
      </div>`;

    document.body.appendChild(tip);
    _tipEl = tip;

    document.getElementById('__cex_x__').onclick = _removeTip;

    /* FIX: listener de fora com delay para não fechar imediatamente */
    setTimeout(() => {
      _outside = (ev) => {
        if (_tipEl && !_tipEl.contains(ev.target)) _removeTip();
      };
      document.addEventListener('mousedown', _outside, { once: true });
    }, 200);

    /* Chama IA */
    _callGroq(
      `Explique em português brasileiro de forma simples e direta, como para um estudante:\n\n"${txt}"\n\nMáximo 3 parágrafos curtos.`,
      400
    )
    .then(r => {
      const el = document.getElementById('__cex_body__');
      if (el) {
        el.style.cssText = 'padding:10px 12px;color:#f0efed;font-style:normal;line-height:1.6;overflow-y:auto;word-break:break-word;';
        el.textContent = r;
      }
    })
    .catch(err => {
      const el = document.getElementById('__cex_body__');
      if (el) {
        el.style.cssText = 'padding:10px 12px;color:#c46060;';
        el.textContent = 'Erro: ' + String(err.message || err).slice(0, 80);
      }
    });
  }

  function _removeTip() {
    if (_tipEl)   { _tipEl.remove(); _tipEl = null; }
    if (_outside) { document.removeEventListener('mousedown', _outside); _outside = null; }
  }

  /* ── RESUMIDOR ── */
  async function _doSummarize() {
    /* FIX: mostra painel imediatamente, não espera toggle */
    _removePanel();

    const panel = document.createElement('div');
    panel.id = '__claw_summary__';
    panel.style.cssText = [
      'position:fixed!important',
      'top:20px!important',
      'right:20px!important',
      'z-index:2147483647!important',
      'width:340px',
      'max-height:75vh',
      'background:#1c1c1e',
      'border:1px solid #3a3a3e',
      'border-radius:13px',
      'box-shadow:0 16px 48px rgba(0,0,0,.8)',
      'font-family:Inter,system-ui,sans-serif',
      'overflow:hidden',
      'display:flex',
      'flex-direction:column',
    ].join(';');

    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;padding:10px 13px;
        border-bottom:1px solid #2e2e34;background:#222224;flex-shrink:0;">
        <span style="font-size:12px;font-weight:600;color:#f0efed;">Claw · Resumo</span>
        <span id="__csm_url__" style="flex:1;font-size:9px;color:#5a5a66;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
        <button id="__csm_x__" style="background:none;border:none;color:#5a5a66;
          cursor:pointer;font-size:14px;padding:0 3px;line-height:1;flex-shrink:0;">✕</button>
      </div>
      <div id="__csm_body__" style="padding:12px 14px;color:#6b6b6b;font-style:italic;
        overflow-y:auto;line-height:1.7;font-size:12px;flex:1;">
        Lendo a página...
      </div>`;

    document.body.appendChild(panel);
    document.getElementById('__csm_x__').onclick = _removePanel;

    /* mostra URL */
    const urlEl = document.getElementById('__csm_url__');
    if (urlEl) urlEl.textContent = location.hostname;

    /* FIX: extrai texto limpo, sem scripts/estilos, limitado a 3000 chars */
    const pageText = _extractPageText();

    if (!pageText) {
      const el = document.getElementById('__csm_body__');
      if (el) { el.style.color='#c46060'; el.style.fontStyle='normal'; el.textContent='Página sem conteúdo de texto.'; }
      return;
    }

    try {
      const r = await _callGroq(
        `Resuma esta página em português brasileiro.\n` +
        `Use bullet points começando com "•". Máximo 8 pontos.\n` +
        `Seja claro e objetivo.\n\n` +
        `CONTEÚDO:\n${pageText}`,
        600
      );
      const el = document.getElementById('__csm_body__');
      if (el) {
        el.style.cssText = 'padding:12px 14px;color:#f0efed;font-style:normal;overflow-y:auto;line-height:1.8;font-size:12px;white-space:pre-wrap;';
        el.textContent = r;
      }
    } catch(err) {
      const el = document.getElementById('__csm_body__');
      if (el) {
        el.style.cssText = 'padding:12px 14px;color:#c46060;font-style:normal;';
        el.textContent = 'Erro: ' + String(err.message || err).slice(0, 100);
      }
    }
  }

  /* FIX: extrai texto da página sem tags, scripts, iframes */
  function _extractPageText() {
    try {
      /* clona o body para não mexer na página */
      const clone = document.body.cloneNode(true);

      /* remove elementos que não são conteúdo */
      ['script','style','noscript','iframe','nav','footer','header',
       '[role="banner"]','[role="navigation"]','[role="complementary"]'
      ].forEach(sel => {
        clone.querySelectorAll(sel).forEach(el => el.remove());
      });

      const raw = (clone.innerText || clone.textContent || '').trim();

      /* limpa espaços excessivos */
      const clean = raw
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();

      /* FIX: limita a 3000 chars — evita HTTP 400 por excesso de tokens */
      return clean.slice(0, 3000);
    } catch(e) {
      return (document.body?.innerText || '').slice(0, 3000);
    }
  }

  function _removePanel() {
    document.getElementById('__claw_summary__')?.remove();
  }

  /* ── GROQ via background proxy (evita CSP) ── */
  function _callGroq(prompt, maxTok = 400) {
    return new Promise((resolve, reject) => {
      const safePrompt = prompt.slice(0, 4000);
      chrome.runtime.sendMessage({
        type   : 'GROQ_FETCH',
        key    : KEY,
        payload: {
          model      : MODEL,
          messages   : [{ role: 'user', content: safePrompt }],
          max_tokens : maxTok,
          temperature: 0.2,
        },
      }, res => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message)); return;
        }
        if (!res?.ok) {
          reject(new Error(res?.error || 'Erro da API')); return;
        }
        const result = res.data?.choices?.[0]?.message?.content?.trim();
        if (!result) { reject(new Error('Resposta vazia da IA')); return; }
        resolve(result);
      });
    });
  }

  window.__clawPageTools__ = { summarize: _doSummarize };
})();
