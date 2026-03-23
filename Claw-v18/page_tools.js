/* CLAW — page_tools.js | Desenvolvido por Emanuel Felipe
   Ferramentas de página: Resumir + Explicar texto selecionado
*/
(function () {
  'use strict';

  const KEY   = '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';
  const MODEL = 'llama-3.1-8b-instant';

  let SUMMARIZE_ON = false;
  let EXPLAIN_ON   = false;
  let _tipEl       = null;
  let _btnBar      = null;

  /* ── mensagens ── */
  chrome.runtime.onMessage.addListener((msg, _, reply) => {
    if (msg.type === 'TOOLS_ON')  { SUMMARIZE_ON = !!msg.summarize; EXPLAIN_ON = !!msg.explain; _setup(); reply({ok:true}); }
    if (msg.type === 'TOOLS_OFF') { SUMMARIZE_ON = false; EXPLAIN_ON = false; _teardown(); reply({ok:true}); }
    if (msg.type === 'DO_SUMMARIZE') { _doSummarize(); reply({ok:true}); }
    return false;
  });

  /* carrega estado */
  try {
    chrome.storage.sync.get(['summarize_on','explain_on'], d => {
      SUMMARIZE_ON = !!d.summarize_on;
      EXPLAIN_ON   = !!d.explain_on;
      if (SUMMARIZE_ON || EXPLAIN_ON) _setup();
    });
  } catch(e){}

  function _setup() {
    document.removeEventListener('mouseup', _onMouseUp);
    if (EXPLAIN_ON) document.addEventListener('mouseup', _onMouseUp);
  }
  function _teardown() {
    document.removeEventListener('mouseup', _onMouseUp);
    _removeTip();
  }

  /* ── Explicador de seleção ── */
  function _onMouseUp(e) {
    if (!EXPLAIN_ON) return;
    const txt = (window.getSelection()?.toString() || '').trim();
    if (!txt || txt.length < 10 || txt.length > 3000) { _removeTip(); return; }
    _showExplainTip(e.clientX, e.clientY, txt);
  }

  function _showExplainTip(x, y, txt) {
    _removeTip();
    const tip = document.createElement('div');
    tip.id = '__claw_explain__';
    const left = Math.min(Math.max(x-10, 8), window.innerWidth-310);
    const top  = y-120 > 8 ? y-120 : y+18;
    tip.style.cssText = `position:fixed!important;left:${left}px!important;top:${Math.min(top,window.innerHeight-160)}px!important;
      z-index:2147483647!important;width:295px;background:#1c1c1e;border:1px solid #3a3a3e;
      border-radius:11px;box-shadow:0 10px 36px rgba(0,0,0,.72);font-family:Inter,system-ui,sans-serif;
      font-size:12px;overflow:hidden;`;
    tip.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;padding:8px 11px;border-bottom:1px solid #2e2e34;background:#222224;">
        <span style="font-size:11px;font-weight:600;color:#f0efed;">Claw · Explicar</span>
        <span style="margin-left:auto;font-size:9px;color:#5a5a66;">${txt.length} chars</span>
        <button id="__cex_x__" style="background:none;border:none;color:#5a5a66;cursor:pointer;font-size:13px;padding:0 2px;">✕</button>
      </div>
      <div id="__cex_body__" style="padding:9px 11px;color:#6b6b6b;font-style:italic;min-height:32px;line-height:1.5;">
        Explicando...
      </div>`;
    document.body.appendChild(tip);
    _tipEl = tip;
    document.getElementById('__cex_x__').onclick = _removeTip;
    setTimeout(() => {
      const fn = (e) => { if (_tipEl && !_tipEl.contains(e.target)) _removeTip(); };
      document.addEventListener('mousedown', fn, {once:true});
    }, 120);

    _callGroq(
      `Explique o seguinte texto em português brasileiro de forma simples e clara, como se fosse para um estudante do ensino médio. Seja direto e objetivo, no máximo 3 parágrafos curtos:\n\n"${txt}"`,
      400
    ).then(r => {
      const el = document.getElementById('__cex_body__');
      if (el) { el.style.cssText='padding:9px 11px;color:#f0efed;font-style:normal;line-height:1.6;word-break:break-word;'; el.textContent=r; }
    }).catch(e => {
      const el = document.getElementById('__cex_body__');
      if (el) { el.style.cssText='padding:9px 11px;color:#c46060;'; el.textContent='Erro: '+String(e.message).slice(0,60); }
    });
  }

  function _removeTip() { if (_tipEl) { _tipEl.remove(); _tipEl=null; } }

  /* ── Resumidor de página ── */
  async function _doSummarize() {
    if (!SUMMARIZE_ON) return;

    // pega texto da página
    const body = document.body?.innerText?.slice(0,8000) || '';
    if (!body.trim()) return;

    // mostra painel flutuante
    _removePanel();
    const panel = document.createElement('div');
    panel.id = '__claw_summary__';
    panel.style.cssText = `position:fixed!important;top:20px!important;right:20px!important;
      z-index:2147483647!important;width:340px;max-height:70vh;background:#1c1c1e;
      border:1px solid #3a3a3e;border-radius:13px;box-shadow:0 16px 48px rgba(0,0,0,.75);
      font-family:Inter,system-ui,sans-serif;overflow:hidden;display:flex;flex-direction:column;`;
    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;padding:10px 13px;border-bottom:1px solid #2e2e34;background:#222224;flex-shrink:0;">
        <span style="font-size:12px;font-weight:600;color:#f0efed;">Claw · Resumo da página</span>
        <button id="__csm_x__" style="margin-left:auto;background:none;border:none;color:#5a5a66;cursor:pointer;font-size:13px;padding:0 2px;">✕</button>
      </div>
      <div id="__csm_body__" style="padding:12px 14px;color:#6b6b6b;font-style:italic;overflow-y:auto;line-height:1.6;font-size:12px;">
        Resumindo a página...
      </div>`;
    document.body.appendChild(panel);
    document.getElementById('__csm_x__').onclick = _removePanel;

    try {
      const r = await _callGroq(
        `Faça um resumo claro e organizado desta página em português brasileiro.\n` +
        `Use bullet points (•) para os pontos principais. Máximo 10 pontos.\n\n` +
        `CONTEÚDO DA PÁGINA:\n${body}`,
        600
      );
      const el = document.getElementById('__csm_body__');
      if (el) { el.style.cssText='padding:12px 14px;color:#f0efed;font-style:normal;overflow-y:auto;line-height:1.7;font-size:12px;white-space:pre-wrap;'; el.textContent=r; }
    } catch(e) {
      const el = document.getElementById('__csm_body__');
      if (el) { el.style.cssText='padding:12px 14px;color:#c46060;'; el.textContent='Erro: '+String(e.message).slice(0,60); }
    }
  }

  function _removePanel() {
    document.getElementById('__claw_summary__')?.remove();
  }

  /* ── Groq ── */
  async function _callGroq(prompt, maxTok=400) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${KEY}`},
      body:JSON.stringify({model:MODEL,messages:[{role:'user',content:prompt}],max_tokens:maxTok,temperature:0.2}),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '—';
  }

  window.__clawPageTools__ = { summarize: _doSummarize };
})();
