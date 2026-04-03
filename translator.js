/* CLAW — translator.js | Desenvolvido por Emanuel Felipe */
(function () {
  'use strict';

  const KEY   = 'SUA_CHAVE_API_GROQ_AQUI';
  const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'; // Llama 4 Scout: multilíngue nativo

  let ON = false, LANG = 'auto', tip = null, _outside = null;

  /* ── Carrega estado salvo ── */
  try {
    chrome.storage.sync.get(['tr_on','tr_lang'], d => {
      ON   = !!d.tr_on;
      LANG = d.tr_lang || 'auto';
      if (ON) _activate();
    });
  } catch(e) {}

  /* ── Mensagens do popup ── */
  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg.type === 'TR_ON')  { ON=true;  LANG=msg.lang||'auto'; _activate();   reply({ok:true}); }
    if (msg.type === 'TR_OFF') { ON=false; _deactivate();          reply({ok:true}); }
    return false;
  });

  /* ── Ativa / desativa ── */
  function _activate()   { document.removeEventListener('mouseup', _onUp); document.addEventListener('mouseup', _onUp); }
  function _deactivate() { document.removeEventListener('mouseup', _onUp); _removeTip(); }

  /* ── Mouseup ── */
  function _onUp(e) {
    if (!ON) return;
    let txt = (window.getSelection()?.toString() || '').trim();
    if (!txt || txt.length < 2 || txt.length > 3000) { _removeTip(); return; }
    txt = txt.slice(0, 1500);
    if (_isPtBr(txt)) { _removeTip(); return; }
    _showTip(e.clientX, e.clientY, txt);
  }

  /* Detecta se já é PT-BR para não traduzir o que já está em português */
  function _isPtBr(t) {
    const words = t.toLowerCase().split(/\s+/);
    const ptWords = new Set(['de','da','do','dos','das','em','para','com','que','uma','um',
      'não','sim','por','mais','mas','como','seu','sua','este','essa','isso','aqui',
      'quando','onde','quem','qual','muito','também','já','ainda','depois','antes',
      'sobre','entre','até','desde','durante','porque','então','assim','agora','foi',
      'ser','ter','fazer','poder','dizer','ver','dar','saber','querer','ficar','ir']);
    const matches = words.filter(w => ptWords.has(w.replace(/[^a-záàâãéêíóôõúç]/gi,'')));
    return matches.length >= Math.max(1, Math.floor(words.length * 0.25));
  }

  /* ── Tooltip ── */
  function _showTip(x, y, txt) {
    _removeTip();
    tip = document.createElement('div');
    tip.id = '__claw_tr__';

    const vw = window.innerWidth, vh = window.innerHeight;
    const left = Math.min(Math.max(x - 10, 8), vw - 300);
    const top  = y - 110 > 8 ? y - 110 : y + 20;

    tip.style.cssText = [
      'position:fixed!important',
      `left:${left}px!important`,
      `top:${Math.min(top, vh - 140)}px!important`,
      'z-index:2147483647!important',
      'width:280px',
      'background:#1c1c1e',
      'border:1px solid #3a3a3e',
      'border-radius:11px',
      'box-shadow:0 10px 36px rgba(0,0,0,.72)',
      'font-family:Inter,system-ui,sans-serif',
      'font-size:12px',
      'color:#a8a8a8',
      'line-height:1.5',
      'overflow:hidden',
    ].join(';');

    tip.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;padding:8px 11px;border-bottom:1px solid #2e2e34;background:#222224;">
        <span style="font-size:11px;font-weight:600;color:#f0efed;">Claw · Tradutor</span>
        <span style="margin-left:auto;font-size:9px;color:#5a5a66;">${LANG==='auto'?'auto':LANG} → pt-BR</span>
        <button id="__ctr_close__" style="background:none;border:none;color:#5a5a66;cursor:pointer;
          font-size:13px;padding:0 2px;line-height:1;display:flex;align-items:center;">✕</button>
      </div>
      <div id="__ctr_body__" style="padding:9px 11px;color:#6b6b6b;font-style:italic;min-height:32px;">
        Traduzindo...
      </div>`;

    document.body.appendChild(tip);
    document.getElementById('__ctr_close__').onclick = _removeTip;

    /* fecha ao clicar fora */
    setTimeout(() => {
      _outside = (e) => { if (tip && !tip.contains(e.target)) _removeTip(); };
      document.addEventListener('mousedown', _outside, { once: true });
    }, 120);

    /* chama a IA */
    _translate(txt)
      .then(result => {
        const el = document.getElementById('__ctr_body__');
        if (el) {
          el.style.cssText = 'padding:9px 11px;color:#f0efed;font-style:normal;font-weight:500;word-break:break-word;';
          el.textContent = result;
        }
      })
      .catch(err => {
        const el = document.getElementById('__ctr_body__');
        if (el) {
          el.style.cssText = 'padding:9px 11px;color:#c46060;font-style:normal;';
          el.textContent = 'Erro: ' + String(err.message || err).slice(0, 60);
        }
      });
  }

  function _removeTip() {
    if (tip) { tip.remove(); tip = null; }
    if (_outside) { document.removeEventListener('mousedown', _outside); _outside = null; }
  }

  /* ── Tradução via Groq ── */
  function _translate(txt) {
    const langs = { en:'inglês', es:'espanhol', fr:'francês', de:'alemão',
                    it:'italiano', ja:'japonês', zh:'chinês', ko:'coreano',
                    ar:'árabe', ru:'russo' };
    const from = LANG === 'auto' ? 'qualquer idioma' : (langs[LANG] || LANG);
    /* garante limite seguro de tokens */
    const safeTxt = txt.slice(0, 1200);

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type   : 'GROQ_FETCH',
        key    : KEY,
        payload: {
          model      : MODEL,
          messages   : [{ role:'user', content:
            `Traduza do ${from} para o português brasileiro.\n` +
            `Responda SOMENTE com a tradução, sem explicações, sem aspas.\n\n` +
            `Texto: ${safeTxt}`
          }],
          max_tokens  : 500,
          temperature : 0.1,
        },
      }, res => {
        if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
        if (!res?.ok) { reject(new Error(res?.error || 'Erro da API')); return; }
        const result = res.data?.choices?.[0]?.message?.content?.trim();
        if (!result) { reject(new Error('Resposta vazia')); return; }
        resolve(result);
      });
    });
  }

  /* Expõe para outros scripts */
  window.__clawTranslate__   = _translate;
  window.__clawTranslateOn__ = () => ON;

})();
