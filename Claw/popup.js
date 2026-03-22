/* CLAW — popup.js | Desenvolvido por Emanuel Felipe */
const KEY    = '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';
const MODEL  = 'llama-3.1-8b-instant';
const VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';

/* ── helpers ── */
function setPill(id, on) {
  const p = document.getElementById(id+'-pill');
  const t = document.getElementById(id+'-status');
  if (p) p.className = 'pill'+(on?' on':'');
  if (t) t.textContent = on ? 'Ativo' : 'Desativado';
}

function sendToTab(type, file, extra={}) {
  chrome.tabs.query({active:true,currentWindow:true}, ([tab]) => {
    if (!tab) return;
    chrome.scripting.executeScript({target:{tabId:tab.id}, files:['stats.js', file]}, () => {
      void chrome.runtime.lastError;
      chrome.tabs.sendMessage(tab.id, {type, ...extra}, () => void chrome.runtime.lastError);
    });
  });
}

function sendTr(on, lang) {
  chrome.tabs.query({active:true,currentWindow:true}, ([tab]) => {
    if (!tab) return;
    chrome.scripting.executeScript({target:{tabId:tab.id}, files:['translator.js']}, () => {
      void chrome.runtime.lastError;
      chrome.tabs.sendMessage(tab.id, {type: on?'TR_ON':'TR_OFF', lang}, () => void chrome.runtime.lastError);
    });
  });
}

/* ── TOGGLES ── */
document.getElementById('tog-k').addEventListener('change', e => {
  const on = e.target.checked;
  chrome.storage.sync.set({k_on: on});
  setPill('k', on);
  const delay   = parseInt(document.getElementById('delaySlider').value) || 0;
  const stealth = document.getElementById('tog-stealth').checked;
  sendToTab(on ? 'KAHOOT_ON' : 'KAHOOT_OFF', 'kahoot.js', {delay, stealth});
});

document.getElementById('tog-s').addEventListener('change', e => {
  const on = e.target.checked;
  chrome.storage.sync.set({s_on: on});
  setPill('s', on);
  sendToTab(on ? 'STOP_ON' : 'STOP_OFF', 'stopots.js');
});

document.getElementById('tog-tr').addEventListener('change', e => {
  const on   = e.target.checked;
  const lang = document.getElementById('tr-lang').value;
  chrome.storage.sync.set({tr_on: on, tr_lang: lang});
  setPill('tr', on);
  sendTr(on, lang);
});

document.getElementById('tr-lang').addEventListener('change', e => {
  chrome.storage.sync.set({tr_lang: e.target.value});
});

document.getElementById('tog-stealth').addEventListener('change', e => {
  chrome.storage.sync.set({stealth: e.target.checked});
});

/* ── DELAY SLIDER ── */
const ds = document.getElementById('delaySlider');
const dv = document.getElementById('delayVal');
ds.addEventListener('input', () => {
  const v = parseInt(ds.value);
  dv.textContent = v === 0 ? '0s' : (v/1000).toFixed(1)+'s';
  chrome.storage.sync.set({kahoot_delay: v});
});

/* ── MODO PROFESSOR ── */
const togMiss = document.getElementById('tog-miss');
const missRow = document.getElementById('missRow');
const ms      = document.getElementById('missSlider');
const mv      = document.getElementById('missVal');
togMiss.addEventListener('change', () => {
  missRow.style.display = togMiss.checked ? 'block' : 'none';
  chrome.storage.sync.set({miss_on: togMiss.checked});
});
ms.addEventListener('input', () => {
  mv.textContent = ms.value;
  chrome.storage.sync.set({miss_n: parseInt(ms.value)});
});

/* ── CACHE ── */
document.getElementById('clearCache').addEventListener('click', () => {
  if (!confirm('Limpar todo o cache do Stop?')) return;
  chrome.storage.local.remove('claw_stop_cache', () => {
    document.getElementById('cacheCount').textContent = '0';
  });
});

function loadCacheCount() {
  chrome.storage.local.get('claw_stop_cache', d => {
    document.getElementById('cacheCount').textContent =
      d.claw_stop_cache ? Object.keys(d.claw_stop_cache).length : 0;
  });
}

/* ── STATS ── */
function refreshStats() {
  chrome.storage.local.get(['claw_stats','claw_history'], d => {
    const s      = d.claw_stats || {};
    const today  = new Date().toDateString();
    const isToday= s.day === today;
    document.getElementById('statKTotal').textContent = s.kt || 0;
    document.getElementById('statSTotal').textContent = s.st || 0;
    document.getElementById('statKToday').textContent = (isToday ? s.kd : 0) + ' hoje';
    document.getElementById('statSToday').textContent = (isToday ? s.sd : 0) + ' hoje';
    const h    = d.claw_history || [];
    const list = document.getElementById('historyList');
    if (!h.length) {
      list.innerHTML = '<div class="hist-empty">Nenhuma atividade ainda</div>';
      return;
    }
    list.innerHTML = h.slice(0,25).map((item,i) => {
      const t = new Date(item.ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      if (item.type==='kahoot') return `
        <div class="hist-item" style="animation-delay:${i*20}ms">
          <div class="hist-q">${item.question||''}</div>
          <div class="hist-a">${item.answer||''}</div>
          <div class="hist-meta">Kahoot · ${t}</div>
        </div>`;
      return `
        <div class="hist-item" style="animation-delay:${i*20}ms">
          <div class="hist-q">Letra ${item.letter} — ${(item.cats||[]).length} categorias</div>
          <div class="hist-a">${(item.answers||[]).filter(Boolean).slice(0,4).join(', ')}</div>
          <div class="hist-meta">StopotS · ${t}</div>
        </div>`;
    }).join('');
  });
}

document.getElementById('clearHistory').addEventListener('click', () => {
  chrome.storage.local.remove('claw_history', () => refreshStats());
});

/* ── AUTO-RESIZE TEXTAREA ── */
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 110) + 'px';
}

/* ── TRADUTOR MANUAL ── */
const trInput = document.getElementById('trInput');
const btnTr   = document.getElementById('btnTr');
const trResp  = document.getElementById('trResp');

trInput.addEventListener('input', () => autoResize(trInput));
trInput.addEventListener('keydown', e => {
  if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); runTranslate(); }
});
btnTr.addEventListener('click', runTranslate);

async function runTranslate() {
  const text = trInput.value.trim();
  if (!text) return;
  trResp.className = 'resp loading';
  trResp.textContent = '';
  btnTr.classList.add('loading');
  const lang = document.getElementById('tr-lang').value;
  const from = lang==='auto' ? 'qualquer idioma' : ({
    en:'inglês',es:'espanhol',fr:'francês',de:'alemão',it:'italiano',
    ja:'japonês',zh:'chinês',ko:'coreano',ar:'árabe',ru:'russo'
  }[lang]||lang);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method :'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${KEY}`},
      body   : JSON.stringify({model:MODEL, messages:[{role:'user',
        content:`Traduza do ${from} para o português brasileiro.\nResponda SOMENTE com a tradução.\n\nTexto: ${text}`
      }], max_tokens:600, temperature:0.1}),
    });
    const data = await res.json();
    trResp.className   = 'resp show';
    trResp.textContent = data.choices?.[0]?.message?.content?.trim() || '';
  } catch(e) {
    trResp.className   = 'resp show';
    trResp.textContent = 'Erro: ' + e.message;
  }
  btnTr.classList.remove('loading');
}

/* ── CHAT IA ── */
let attachedImg = null;
const chatInput = document.getElementById('chatInput');
const btnSend   = document.getElementById('btnSend');
const btnAttach = document.getElementById('btnAttach');
const fileInput = document.getElementById('file-input');
const imgPrev   = document.getElementById('imgPreview');
const imgThumb  = document.getElementById('imgThumb');
const imgRemove = document.getElementById('imgRemove');
const chatResp  = document.getElementById('chatResp');

chatInput.addEventListener('input', () => {
  autoResize(chatInput);
  btnSend.classList.toggle('ready', chatInput.value.trim().length>0 || !!attachedImg);
});
chatInput.addEventListener('keydown', e => {
  if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
});
btnSend.addEventListener('click', sendChat);
btnAttach.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    attachedImg   = e.target.result;
    imgThumb.src  = attachedImg;
    imgPrev.classList.add('show');
    btnSend.classList.add('ready');
  };
  r.readAsDataURL(file);
  fileInput.value = '';
});
imgRemove.addEventListener('click', () => {
  attachedImg = null;
  imgThumb.src = '';
  imgPrev.classList.remove('show');
  btnSend.classList.toggle('ready', chatInput.value.trim().length>0);
});

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text && !attachedImg) return;
  const prompt = text || 'Analise esta imagem e diga qual é a resposta correta, explicando brevemente.';
  chatResp.className  = 'resp loading';
  chatResp.textContent= '';
  btnSend.classList.add('loading');
  chatInput.value     = '';
  chatInput.style.height = 'auto';
  btnSend.classList.remove('ready');
  try {
    let messages;
    if (attachedImg) {
      const b64  = attachedImg.split(',')[1];
      const mime = attachedImg.match(/data:(.*?);/)?.[1] || 'image/jpeg';
      messages = [{role:'user', content:[
        {type:'image_url', image_url:{url:`data:${mime};base64,${b64}`}},
        {type:'text', text:prompt}
      ]}];
    } else {
      messages = [
        {role:'system', content:'Você é especialista em todas as matérias escolares. Responda em português, de forma clara e objetiva.'},
        {role:'user',   content:prompt}
      ];
    }
    const res  = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method :'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${KEY}`},
      body   : JSON.stringify({model: attachedImg?VISION:MODEL, messages, max_tokens:700, temperature:0.2}),
    });
    const data = await res.json();
    chatResp.className   = 'resp show';
    chatResp.textContent = data.choices?.[0]?.message?.content?.trim() || 'Sem resposta.';
  } catch(e) {
    chatResp.className   = 'resp show';
    chatResp.textContent = 'Erro: ' + e.message;
  }
  btnSend.classList.remove('loading');
  attachedImg  = null;
  imgThumb.src = '';
  imgPrev.classList.remove('show');
}

/* ── GLOBAL DOT ── */
function updateDot() {
  const on = ['tog-k','tog-s','tog-tr'].some(id => document.getElementById(id).checked);
  document.getElementById('globalDot').classList.toggle('on', on);
  const active = [
    document.getElementById('tog-k').checked  && 'Kahoot',
    document.getElementById('tog-s').checked  && 'StopotS',
    document.getElementById('tog-tr').checked && 'Tradutor',
  ].filter(Boolean);
  document.getElementById('globalStatus').textContent = on ? active.join(' · ') : 'Inativo';
}
['tog-k','tog-s','tog-tr'].forEach(id =>
  document.getElementById(id).addEventListener('change', updateDot)
);

/* ── MASCOTE ── */
document.getElementById('mascot').addEventListener('click', () => {
  const m = document.getElementById('mascot');
  m.style.transform = 'scale(1.2) rotate(15deg)';
  setTimeout(() => m.style.transform = '', 350);
});

/* ── CARREGA ESTADO SALVO ── */
chrome.storage.sync.get(
  ['k_on','s_on','tr_on','tr_lang','stealth','miss_on','miss_n','kahoot_delay'],
  d => {
    if (d.k_on)   { document.getElementById('tog-k').checked  = true; setPill('k',  true); }
    if (d.s_on)   { document.getElementById('tog-s').checked  = true; setPill('s',  true); }
    if (d.tr_on)  { document.getElementById('tog-tr').checked = true; setPill('tr', true); }
    if (d.tr_lang)  document.getElementById('tr-lang').value  = d.tr_lang;
    if (d.stealth)  document.getElementById('tog-stealth').checked = true;
    if (d.miss_on) { togMiss.checked = true; missRow.style.display = 'block'; }
    if (d.miss_n)  { ms.value = d.miss_n; mv.textContent = d.miss_n; }
    if (d.kahoot_delay != null) {
      ds.value = d.kahoot_delay;
      const v  = parseInt(d.kahoot_delay);
      dv.textContent = v===0 ? '0s' : (v/1000).toFixed(1)+'s';
    }
    updateDot();
  }
);

/* ── INIT ── */
loadCacheCount();
refreshStats();

/* ── ANIMAÇÕES ESCALONADAS ── */
document.querySelectorAll('.card,.stat-card').forEach((el,i) => {
  if (!el.style.animationDelay) el.style.animationDelay = (i*40)+'ms';
});
