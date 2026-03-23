/* CLAW — popup.js v18 | Desenvolvido por Emanuel Felipe */
'use strict';

const KEY    = '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';
const MODEL  = 'llama-3.1-8b-instant';
const VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';

/* ── HELPERS ─────────────────────────────────────────────────────── */
const $  = id => document.getElementById(id);
const on = (id, ev, fn) => $(id)?.addEventListener(ev, fn);

function setPill(id, active) {
  const p = $(`${id}-pill`), t = $(`${id}-status`);
  if (p) p.className = 'pill' + (active ? ' on' : '');
  if (t) t.textContent = active ? 'Ativo' : 'Desativado';
}

function updateDot() {
  const ids = ['tog-k','tog-s','tog-tr','tog-sum','tog-exp','tog-anti'];
  const active = ids.some(id => $(id)?.checked);
  $('globalDot')?.classList.toggle('on', active);
  const labels = [
    $('tog-k')?.checked   && 'Kahoot',
    $('tog-s')?.checked   && 'StopotS',
    $('tog-tr')?.checked  && 'Tradutor',
    $('tog-sum')?.checked && 'Resumidor',
    $('tog-exp')?.checked && 'Explicador',
    $('tog-anti')?.checked && 'Anti-detecção',
  ].filter(Boolean);
  const gs = $('globalStatus');
  if (gs) gs.textContent = active ? labels.join(' · ') : 'Inativo';
}

function inject(files, msg, cb) {
  chrome.tabs.query({active:true, currentWindow:true}, ([tab]) => {
    if (!tab?.id) return;
    chrome.scripting.executeScript({target:{tabId:tab.id}, files}, () => {
      if (chrome.runtime.lastError) { cb?.(); return; }
      chrome.tabs.sendMessage(tab.id, msg, () => { void chrome.runtime.lastError; cb?.(); });
    });
  });
}

function autoResize(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 110) + 'px';
}

/* ── TOGGLE KAHOOT ─────────────────────────────────────────────────── */
on('tog-k', 'change', e => {
  const on = e.target.checked;
  chrome.storage.sync.set({k_on: on});
  setPill('k', on);
  const delay   = parseInt($('delaySlider')?.value) || 0;
  const stealth = $('tog-stealth')?.checked || false;
  inject(['stats.js','kahoot.js'], {type: on ? 'KAHOOT_ON' : 'KAHOOT_OFF', delay, stealth});
  updateDot();
  $('acc-section').style.display = on ? 'block' : 'none';
});

/* ── TOGGLE STOPOTS ─────────────────────────────────────────────────── */
on('tog-s', 'change', e => {
  const on = e.target.checked;
  chrome.storage.sync.set({s_on: on});
  setPill('s', on);
  inject(['stats.js','stopots.js'], {type: on ? 'STOP_ON' : 'STOP_OFF'});
  updateDot();
});

/* ── TOGGLE TRADUTOR ─────────────────────────────────────────────────── */
on('tog-tr', 'change', e => {
  const on   = e.target.checked;
  const lang = $('tr-lang')?.value || 'auto';
  chrome.storage.sync.set({tr_on: on, tr_lang: lang});
  setPill('tr', on);
  inject(['translator.js'], {type: on ? 'TR_ON' : 'TR_OFF', lang});
  updateDot();
});

on('tr-lang', 'change', e => {
  const lang = e.target.value;
  chrome.storage.sync.set({tr_lang: lang});
  if ($('tog-tr')?.checked) inject(['translator.js'], {type:'TR_ON', lang});
});

/* ── TOGGLE RESUMIDOR ─────────────────────────────────────────────────── */
on('tog-sum', 'change', e => {
  const on  = e.target.checked;
  const exp = $('tog-exp')?.checked || false;
  chrome.storage.sync.set({summarize_on: on});
  setPill('sum', on);
  inject(['page_tools.js'], {type:(on||exp)?'TOOLS_ON':'TOOLS_OFF', summarize:on, explain:exp});
  updateDot();
});

on('btn-do-summary', 'click', () => {
  inject(['page_tools.js'], {type:'DO_SUMMARIZE'});
  window.close();
});

/* ── TOGGLE EXPLICADOR ─────────────────────────────────────────────────── */
on('tog-exp', 'change', e => {
  const on  = e.target.checked;
  const sum = $('tog-sum')?.checked || false;
  chrome.storage.sync.set({explain_on: on});
  setPill('exp', on);
  inject(['page_tools.js'], {type:(on||sum)?'TOOLS_ON':'TOOLS_OFF', summarize:sum, explain:on});
  updateDot();
});

/* ── TOGGLE ANTI-DETECÇÃO ─────────────────────────────────────────────── */
on('tog-anti', 'change', e => {
  const on = e.target.checked;
  chrome.storage.sync.set({anti_on: on});
  setPill('anti', on);
  inject(['anti_detect.js'], {type: on ? 'ANTI_ON' : 'ANTI_OFF'});
  updateDot();
});

/* ── TOGGLE STEALTH ─────────────────────────────────────────────────── */
on('tog-stealth', 'change', e => chrome.storage.sync.set({stealth: e.target.checked}));

/* ── DELAY ─────────────────────────────────────────────────────────── */
on('delaySlider', 'input', () => {
  const v = parseInt($('delaySlider').value);
  const dv = $('delayVal');
  if (dv) dv.textContent = v === 0 ? '0s' : (v/1000).toFixed(1) + 's';
  chrome.storage.sync.set({kahoot_delay: v});
});

/* ── MODO PROFESSOR ─────────────────────────────────────────────────── */
on('tog-miss', 'change', () => {
  const on = $('tog-miss').checked;
  const mr = $('missRow');
  if (mr) mr.style.display = on ? 'block' : 'none';
  chrome.storage.sync.set({miss_on: on});
});
on('missSlider', 'input', () => {
  const v = $('missSlider')?.value;
  const mv = $('missVal');
  if (mv) mv.textContent = v;
  chrome.storage.sync.set({miss_n: parseInt(v)});
});

/* ── CACHE ─────────────────────────────────────────────────────────── */
function loadCacheCount() {
  chrome.storage.local.get('claw_stop_cache', d => {
    const el = $('cacheCount');
    if (el) el.textContent = d.claw_stop_cache ? Object.keys(d.claw_stop_cache).length : 0;
  });
}

on('clearCache', 'click', () => {
  if (!confirm('Limpar todo o cache do Stop?')) return;
  chrome.storage.local.remove('claw_stop_cache', () => {
    const el = $('cacheCount'); if (el) el.textContent = '0';
  });
});

/* ── STATS ─────────────────────────────────────────────────────────── */
function refreshStats() {
  chrome.storage.local.get(['claw_stats','claw_history'], d => {
    const s     = d.claw_stats || {};
    const today = new Date().toDateString();
    const isTd  = s.day === today;
    const set   = (id,v) => { const el=$(id); if(el) el.textContent=v; };
    set('statKTotal', s.kt||0); set('statSTotal', s.st||0);
    set('statKToday', (isTd?s.kd:0)+' hoje');
    set('statSToday', (isTd?s.sd:0)+' hoje');

    const h   = d.claw_history || [];
    const lst = $('historyList');
    if (!lst) return;
    if (!h.length) { lst.innerHTML='<div class="hist-empty">Nenhuma atividade ainda</div>'; return; }
    lst.innerHTML = h.slice(0,25).map((item,i) => {
      const t = new Date(item.ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      if (item.type==='kahoot') return `
        <div class="hist-item" style="animation-delay:${i*18}ms">
          <div class="hist-q">${item.question||''}</div>
          <div class="hist-a">${item.answer||''}</div>
          <div class="hist-meta">Kahoot · ${t}</div>
        </div>`;
      return `
        <div class="hist-item" style="animation-delay:${i*18}ms">
          <div class="hist-q">Letra ${item.letter||'?'} — ${(item.cats||[]).length} categorias</div>
          <div class="hist-a">${(item.answers||[]).filter(Boolean).slice(0,4).join(', ')}</div>
          <div class="hist-meta">StopotS · ${t}</div>
        </div>`;
    }).join('');
  });
}

on('clearHistory', 'click', () => chrome.storage.local.remove('claw_history', refreshStats));

/* ── TRADUTOR MANUAL ─────────────────────────────────────────────────── */
const trInput = $('trInput'), btnTr = $('btnTr'), trResp = $('trResp');
trInput?.addEventListener('input', () => autoResize(trInput));
trInput?.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();runTranslate();} });
btnTr?.addEventListener('click', runTranslate);

async function runTranslate() {
  const text = trInput?.value?.trim(); if (!text) return;
  if (trResp) { trResp.className='resp loading'; trResp.textContent=''; }
  if (btnTr)  btnTr.classList.add('loading');
  const lang  = $('tr-lang')?.value || 'auto';
  const langs = {en:'inglês',es:'espanhol',fr:'francês',de:'alemão',it:'italiano',ja:'japonês',zh:'chinês',ko:'coreano',ar:'árabe',ru:'russo'};
  const from  = lang==='auto' ? 'qualquer idioma' : (langs[lang]||lang);
  try {
    const res  = await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${KEY}`},
      body:JSON.stringify({model:MODEL,messages:[{role:'user',content:`Traduza do ${from} para o português brasileiro.\nSomente a tradução.\n\nTexto: ${text}`}],max_tokens:600,temperature:0.1}),
    });
    const data = await res.json();
    if (trResp){ trResp.className='resp show'; trResp.textContent=data.choices?.[0]?.message?.content?.trim()||''; }
  } catch(e) {
    if (trResp){ trResp.className='resp show'; trResp.textContent='Erro: '+e.message; }
  }
  btnTr?.classList.remove('loading');
}

/* ── CHAT IA ─────────────────────────────────────────────────────────── */
let attachedImg = null;
const chatInput = $('chatInput'), btnSend = $('btnSend'), btnAttach = $('btnAttach');
const fileInput = $('file-input'), imgPrev = $('imgPreview');
const imgThumb  = $('imgThumb'),   imgRemove = $('imgRemove'), chatResp = $('chatResp');

chatInput?.addEventListener('input', () => {
  autoResize(chatInput);
  btnSend?.classList.toggle('ready', chatInput.value.trim().length>0||!!attachedImg);
});
chatInput?.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();} });
btnSend?.addEventListener('click', sendChat);
btnAttach?.addEventListener('click', () => fileInput?.click());

fileInput?.addEventListener('change', () => {
  const file = fileInput.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    attachedImg=e.target.result;
    if(imgThumb) imgThumb.src=attachedImg;
    imgPrev?.classList.add('show');
    btnSend?.classList.add('ready');
  };
  r.readAsDataURL(file); fileInput.value='';
});

imgRemove?.addEventListener('click', () => {
  attachedImg=null; if(imgThumb) imgThumb.src='';
  imgPrev?.classList.remove('show');
  btnSend?.classList.toggle('ready', (chatInput?.value?.trim()||'').length>0);
});

async function sendChat() {
  const text = chatInput?.value?.trim();
  if (!text && !attachedImg) return;
  const prompt = text || 'Analise esta imagem e responda a questão.';
  if (chatResp)  { chatResp.className='resp loading'; chatResp.textContent=''; }
  if (btnSend)   { btnSend.classList.add('loading'); btnSend.classList.remove('ready'); }
  if (chatInput) { chatInput.value=''; chatInput.style.height='auto'; }
  try {
    let messages;
    if (attachedImg) {
      const b64=attachedImg.split(',')[1], mime=attachedImg.match(/data:(.*?);/)?.[1]||'image/jpeg';
      messages=[{role:'user',content:[{type:'image_url',image_url:{url:`data:${mime};base64,${b64}`}},{type:'text',text:prompt}]}];
    } else {
      messages=[{role:'system',content:'Especialista em matérias escolares. Responda em português, claro e objetivo.'},{role:'user',content:prompt}];
    }
    const res  = await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${KEY}`},
      body:JSON.stringify({model:attachedImg?VISION:MODEL,messages,max_tokens:800,temperature:0.2}),
    });
    const data = await res.json();
    if (chatResp){ chatResp.className='resp show'; chatResp.textContent=data.choices?.[0]?.message?.content?.trim()||'Sem resposta.'; }
  } catch(e) {
    if (chatResp){ chatResp.className='resp show'; chatResp.textContent='Erro: '+e.message; }
  }
  btnSend?.classList.remove('loading');
  attachedImg=null; if(imgThumb) imgThumb.src=''; imgPrev?.classList.remove('show');
}

/* ── MASCOTE ─────────────────────────────────────────────────────────── */
on('mascot','click',()=>{
  const m=$('mascot'); if(!m) return;
  m.style.transform='scale(1.25) rotate(15deg)';
  setTimeout(()=>m.style.transform='',350);
});

/* ── CARREGA ESTADO ─────────────────────────────────────────────────── */
chrome.storage.sync.get(
  ['k_on','s_on','tr_on','tr_lang','stealth','miss_on','miss_n','kahoot_delay',
   'summarize_on','explain_on','anti_on'],
  d => {
    const check=(id,flag,pill)=>{ if(flag&&$(id)){ $(id).checked=true; setPill(pill||id.replace('tog-',''),true); } };
    check('tog-k',    d.k_on,         'k');
    check('tog-s',    d.s_on,         's');
    check('tog-tr',   d.tr_on,        'tr');
    check('tog-sum',  d.summarize_on, 'sum');
    check('tog-exp',  d.explain_on,   'exp');
    check('tog-anti', d.anti_on,      'anti');

    if (d.tr_lang) { const el=$('tr-lang'); if(el) el.value=d.tr_lang; }
    if (d.stealth) { const el=$('tog-stealth'); if(el) el.checked=true; }

    if (d.miss_on) {
      const el=$('tog-miss'); if(el) el.checked=true;
      const mr=$('missRow'); if(mr) mr.style.display='block';
    }
    if (d.miss_n) {
      const ms=$('missSlider'), mv=$('missVal');
      if(ms) ms.value=d.miss_n; if(mv) mv.textContent=d.miss_n;
    }
    if (d.kahoot_delay != null) {
      const ds=$('delaySlider'), dv=$('delayVal');
      if(ds){ ds.value=d.kahoot_delay; const v=parseInt(d.kahoot_delay); if(dv) dv.textContent=v===0?'0s':(v/1000).toFixed(1)+'s'; }
    }
    if (d.k_on) $('acc-section').style.display='block';
    updateDot();
  }
);

/* ── INIT ─────────────────────────────────────────────────────────── */
loadCacheCount();
refreshStats();
document.querySelectorAll('.card,.stat-card').forEach((el,i) => {
  if (!el.style.animationDelay) el.style.animationDelay=(i*35)+'ms';
});
