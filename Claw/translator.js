/* CLAW — translator.js | Desenvolvido por Emanuel Felipe */
(function () {
  'use strict';
  const KEY   = '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';
  const MODEL = 'llama-3.3-70b-versatile';
  let ON = false, LANG = 'auto', tip = null, hideT = null;

  chrome.storage.sync.get(['tr_on','tr_lang'], d => {
    ON = !!d.tr_on; LANG = d.tr_lang || 'auto';
    if (ON) activate();
  });

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'TR_ON')  { ON=true;  LANG=msg.lang||'auto'; activate(); }
    if (msg.type === 'TR_OFF') { ON=false; deactivate(); }
  });

  function activate()   { document.addEventListener('mouseup', onUp); }
  function deactivate() { document.removeEventListener('mouseup', onUp); removeTip(); }

  function onUp(e) {
    if (!ON) return;
    clearTimeout(hideT);
    const txt = window.getSelection()?.toString().trim();
    if (!txt || txt.length < 3 || txt.length > 1500) { hideT = setTimeout(removeTip, 300); return; }
    if (isPtBr(txt)) { hideT = setTimeout(removeTip, 300); return; }
    showTip(e.clientX, e.clientY, txt);
  }

  function isPtBr(t) {
    return /\b(de|da|do|em|para|com|que|uma|um|não|sim|por|mais|mas|como|seu|sua|este|essa|isso|aqui|quando|onde|quem)\b/i.test(t);
  }

  function showTip(x, y, txt) {
    removeTip();
    tip = document.createElement('div');
    tip.id = '__claw_tr__';
    Object.assign(tip.style, {
      position:'fixed', zIndex:'2147483647',
      background:'#1c1c1e', border:'1px solid #3a3a3e', borderRadius:'10px',
      padding:'10px 13px', maxWidth:'280px', minWidth:'120px',
      boxShadow:'0 8px 28px rgba(0,0,0,.65)',
      fontFamily:'Inter,system-ui,sans-serif', fontSize:'12px',
      color:'#a8a8a8', lineHeight:'1.5',
      left: Math.min(x, window.innerWidth-292)+'px',
      top:  (y-90 > 8 ? y-90 : y+16)+'px',
    });
    tip.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;border-bottom:1px solid #3a3a3e;padding-bottom:6px;">
        <span style="font-size:11px;font-weight:600;color:#f0efed;">Claw · Tradutor</span>
        <span style="margin-left:auto;font-size:9px;color:#6b6b6b;">${LANG==='auto'?'auto':LANG} → PT-BR</span>
        <button id="__ctr_x__" style="background:none;border:none;color:#6b6b6b;cursor:pointer;font-size:12px;padding:0;line-height:1;">✕</button>
      </div>
      <div id="__ctr_body__" style="color:#6b6b6b;font-style:italic;">Traduzindo...</div>`;
    document.body.appendChild(tip);
    document.getElementById('__ctr_x__').onclick = removeTip;
    setTimeout(() => document.addEventListener('mousedown', outside, {once:true}), 100);
    translate(txt).then(r => {
      const el = document.getElementById('__ctr_body__');
      if (el) { el.style.color='#f0efed'; el.style.fontStyle='normal'; el.style.fontWeight='500'; el.textContent=r; }
    }).catch(e => {
      const el = document.getElementById('__ctr_body__');
      if (el) { el.style.color='#c46060'; el.textContent='Erro: '+e.message.slice(0,40); }
    });
  }

  function outside(e) { if (tip && !tip.contains(e.target)) removeTip(); }
  function removeTip() { tip?.remove(); tip=null; document.removeEventListener('mousedown', outside); }

  async function translate(txt) {
    const from = LANG==='auto' ? 'qualquer idioma' : ({en:'inglês',es:'espanhol',fr:'francês',de:'alemão',it:'italiano',ja:'japonês',zh:'chinês',ko:'coreano',ar:'árabe',ru:'russo'}[LANG]||LANG);
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${KEY}`},
      body:JSON.stringify({model:MODEL,messages:[{role:'user',content:`Traduza do ${from} para o português brasileiro.\nResponda SOMENTE com a tradução, sem explicações.\n\nTexto: ${txt}`}],max_tokens:400,temperature:0.1}),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    return (await res.json()).choices?.[0]?.message?.content?.trim() || '—';
  }

  window.__clawTranslate__   = translate;
  window.__clawTranslateOn__ = () => ON;
})();
