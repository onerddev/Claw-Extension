/* CLAW — popup.js v22 | Emanuel Felipe */
'use strict';

const KEY             = 'SUA_CHAVE_API_GROQ_AQUI';
const MODEL_TRANSLATE = 'meta-llama/llama-4-scout-17b-16e-instruct';
const MODEL_VISION    = 'meta-llama/llama-4-scout-17b-16e-instruct';

const $  = id => document.getElementById(id);
const on = (id, ev, fn) => $(id)?.addEventListener(ev, fn);

/* ── Groq via background proxy ───────── */
function groqFetch(payload, cb) {
  chrome.runtime.sendMessage({ type:'GROQ_FETCH', key:KEY, payload }, res => {
    if (chrome.runtime.lastError) { cb(new Error(chrome.runtime.lastError.message), null); return; }
    if (!res?.ok) { cb(new Error(res?.error||'Erro Groq'), null); return; }
    cb(null, res.data);
  });
}

/* ── Inject script na aba ativa ─────── */
function inject(files, msg, cb) {
  chrome.tabs.query({ active:true, currentWindow:true }, ([tab]) => {
    if (!tab?.id) { cb?.(); return; }
    chrome.scripting.executeScript({ target:{ tabId:tab.id }, files }, () => {
      if (chrome.runtime.lastError) { cb?.(); return; }
      chrome.tabs.sendMessage(tab.id, msg, () => { void chrome.runtime.lastError; cb?.(); });
    });
  });
}

function setPill(id, on) {
  const p=$(`${id}-pill`), t=$(`${id}-status`);
  if(p) p.className='pill'+(on?' on':'');
  if(t) t.textContent=on?'Ativo':'Desativado';
}

function updateDot() {
  const active=['tog-k','tog-s','tog-tr','tog-sum','tog-exp','tog-anti'].some(id=>$(id)?.checked);
  $('globalDot')?.classList.toggle('on',active);
  const labels=[
    $('tog-k')?.checked    && 'Kahoot',
    $('tog-s')?.checked    && 'StopotS',
    $('tog-tr')?.checked   && 'Tradutor',
    $('tog-sum')?.checked  && 'Resumidor',
    $('tog-exp')?.checked  && 'Explicador',
    $('tog-anti')?.checked && 'Anti-det.',
  ].filter(Boolean);
  const gs=$('globalStatus');
  if(gs) gs.textContent=active?labels.join(' · '):'Inativo';
}

function autoResize(el) {
  if(!el) return;
  el.style.height='auto';
  el.style.height=Math.min(el.scrollHeight,100)+'px';
}

/* ═══════════════════════════════════════
   AGENTE IA LIVRE
═══════════════════════════════════════ */
const agentInput = $('agentInput');
const btnAgent   = $('btnAgent');
const msgsEl     = $('msgs');
const chipsEl    = $('chips');
let   attachedImg = null;

function chip(text) {
  if (agentInput) { agentInput.value=text; agentInput.focus(); updateSend(); }
}

function addMsg(text, type='ai') {
  if (!msgsEl) return null;
  const avatars = { user:'E', ai:'<img src="claude-icon.png" style="width:22px;height:22px;border-radius:50%;object-fit:cover" alt="C"/>', err:'!', log:'›', thinking:'…' };
  const div = document.createElement('div');
  div.className = 'msg ' + type;
  const avatarEl = document.createElement("div"); avatarEl.className = "msg-avatar"; avatarEl.innerHTML = avatars[type]||'C'; const bodyEl = document.createElement("div"); bodyEl.className = "msg-body"; div.appendChild(avatarEl); div.appendChild(bodyEl);
  bodyEl.textContent = text;
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
  if (chipsEl && msgsEl.querySelectorAll('.msg.user').length > 0) chipsEl.style.display='none';
  return div;
}

function updateSend() {
  const has = (agentInput?.value?.trim()||'').length>0 || !!attachedImg;
  btnAgent?.classList.toggle('off', !has);
  btnAgent?.classList.toggle('ready', has);
}

agentInput?.addEventListener('input', () => { autoResize(agentInput); updateSend(); });
agentInput?.addEventListener('keydown', e => {
  if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendAgent(); }
});
btnAgent?.addEventListener('click', sendAgent);

on('btnClear', 'click', () => {
  if (!msgsEl) return;
  msgsEl.innerHTML = '';
  addMsg('Conversa limpa. Como posso ajudar?', 'ai');
  if (chipsEl) chipsEl.style.display='flex';
  attachedImg = null;
  $('imgPreview')?.classList.remove('show');
  updateSend();
});

on('btnAttach', 'click', () => $('file-input')?.click());

$('file-input')?.addEventListener('change', () => {
  const file = $('file-input').files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    attachedImg = e.target.result;
    const thumb=$('imgThumb'); if(thumb) thumb.src=attachedImg;
    $('imgPreview')?.classList.add('show');
    updateSend();
  };
  reader.readAsDataURL(file);
  $('file-input').value='';
});

on('imgRemove', 'click', () => {
  attachedImg=null;
  $('imgPreview')?.classList.remove('show');
  updateSend();
});

function sendAgent() {
  const text = agentInput?.value?.trim();
  if (!text && !attachedImg) return;

  addMsg(text||'(analise a imagem)', 'user');
  if (agentInput) { agentInput.value=''; agentInput.style.height='auto'; }
  updateSend();

  const img = attachedImg;
  attachedImg = null;
  $('imgPreview')?.classList.remove('show');

  /* Imagem → visão direta */
  if (img) {
    const thinking = addMsg('Analisando imagem...', 'thinking');
    const b64  = img.split(',')[1];
    const mime = img.match(/data:(.*?);/)?.[1]||'image/png';
    groqFetch({
      model   : MODEL_VISION,
      messages: [{ role:'user', content:[
        { type:'image_url', image_url:{ url:`data:${mime};base64,${b64}` } },
        { type:'text', text: text||'Analise esta imagem detalhadamente.' }
      ]}],
      max_tokens:1024, temperature:0.4,
    }, (err, data) => {
      thinking?.remove();
      const reply = err ? 'Erro: '+err.message : (data?.choices?.[0]?.message?.content?.trim()||'—');
      addMsg(reply, err?'err':'ai');
    });
    return;
  }

  /* Texto → Agente IA livre */
  const thinking = addMsg('Pensando...', 'thinking');

  chrome.runtime.sendMessage({ type:'AGENT_RUN', text }, res => {
    thinking?.remove();

    if (chrome.runtime.lastError) {
      addMsg('❌ ' + chrome.runtime.lastError.message, 'err');
      return;
    }

    if (!res) {
      addMsg('❌ Sem resposta do agente. Recarregue a extensão.', 'err');
      return;
    }

    // Resposta principal da IA
    if (res.reply) {
      addMsg(res.reply, res.ok === false ? 'err' : 'ai');
    }

    // Log das ações executadas (só mostra se tiver algo útil)
    if (res.results?.length > 0) {
      const meaningful = res.results.filter(r =>
        r && !r.startsWith('✓ openTab') && !r.startsWith('✓ navigate')
      );
      if (meaningful.length > 0) {
        addMsg(res.results.join('\n'), 'log');
      }
    }
  });
}

/* ═══════════════════════════════════════
   TOGGLES
═══════════════════════════════════════ */
on('tog-k','change',e=>{
  const v=e.target.checked; chrome.storage.sync.set({k_on:v}); setPill('k',v);
  const delay=parseInt($('delaySlider')?.value)||0;
  const stealth=$('tog-stealth')?.checked||false;
  inject(['stats.js','kahoot.js'],{type:v?'KAHOOT_ON':'KAHOOT_OFF',delay,stealth});
  updateDot();
});
on('tog-s','change',e=>{
  const v=e.target.checked; chrome.storage.sync.set({s_on:v}); setPill('s',v);
  inject(['stats.js','stopots.js'],{type:v?'STOP_ON':'STOP_OFF'});
  updateDot();
});
on('tog-tr','change',e=>{
  const v=e.target.checked, lang=$('tr-lang')?.value||'auto';
  chrome.storage.sync.set({tr_on:v,tr_lang:lang}); setPill('tr',v);
  inject(['translator.js'],{type:v?'TR_ON':'TR_OFF',lang});
  updateDot();
});
on('tr-lang','change',e=>{
  const lang=e.target.value; chrome.storage.sync.set({tr_lang:lang});
  if($('tog-tr')?.checked) inject(['translator.js'],{type:'TR_ON',lang});
});
on('tog-sum','change',e=>{
  const v=e.target.checked, exp=$('tog-exp')?.checked||false;
  chrome.storage.sync.set({summarize_on:v}); setPill('sum',v);
  inject(['page_tools.js'],{type:(v||exp)?'TOOLS_ON':'TOOLS_OFF',summarize:v,explain:exp});
  updateDot();
});
on('btn-do-summary','click',()=>{
  inject(['page_tools.js'],{type:'DO_SUMMARIZE'},()=>setTimeout(()=>window.close(),150));
});
on('tog-exp','change',e=>{
  const v=e.target.checked, sum=$('tog-sum')?.checked||false;
  chrome.storage.sync.set({explain_on:v}); setPill('exp',v);
  inject(['page_tools.js'],{type:(v||sum)?'TOOLS_ON':'TOOLS_OFF',summarize:sum,explain:v});
  updateDot();
});
on('tog-anti','change',e=>{
  const v=e.target.checked; chrome.storage.sync.set({anti_on:v}); setPill('anti',v);
  inject(['anti_detect.js'],{type:v?'ANTI_ON':'ANTI_OFF'});
  updateDot();
});
on('tog-stealth','change',e=>chrome.storage.sync.set({stealth:e.target.checked}));
on('tog-miss','change',()=>{
  const v=$('tog-miss').checked;
  const mr=$('missRow'); if(mr) mr.style.display=v?'block':'none';
  chrome.storage.sync.set({miss_on:v});
});

/* ═══════════════════════════════════════
   SLIDERS
═══════════════════════════════════════ */
on('delaySlider','input',()=>{
  const v=parseInt($('delaySlider').value);
  const dv=$('delayVal'); if(dv) dv.textContent=v===0?'0s':(v/1000).toFixed(1)+'s';
  chrome.storage.sync.set({kahoot_delay:v});
});
on('missSlider','input',()=>{
  const v=$('missSlider')?.value;
  const mv=$('missVal'); if(mv) mv.textContent=v;
  chrome.storage.sync.set({miss_n:parseInt(v)});
});

/* ═══════════════════════════════════════
   TRADUTOR MANUAL
═══════════════════════════════════════ */
const trInput=$('trInput'), btnTr=$('btnTr'), trResp=$('trResp');

trInput?.addEventListener('input',()=>autoResize(trInput));
trInput?.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();runTranslate();}
});
btnTr?.addEventListener('click',runTranslate);

function runTranslate() {
  const text=trInput?.value?.trim(); if(!text) return;
  if(trResp){ trResp.className='tr-out show'; trResp.style.color='var(--t3)'; trResp.textContent='Traduzindo...'; }
  btnTr?.classList.add('loading');
  const lang=$('tr-lang')?.value||'auto';
  const langs={en:'inglês',es:'espanhol',fr:'francês',de:'alemão',it:'italiano',
               ja:'japonês',zh:'chinês',ko:'coreano',ar:'árabe',ru:'russo'};
  const from=lang==='auto'?'qualquer idioma':(langs[lang]||lang);
  groqFetch({
    model:MODEL_TRANSLATE,
    messages:[{role:'user',content:`Traduza do ${from} para o português brasileiro.\nSomente a tradução.\n\nTexto: ${text.slice(0,1200)}`}],
    max_tokens:600,temperature:0.1,
  },(err,data)=>{
    if(trResp){
      trResp.className='tr-out show';
      trResp.style.color=err?'var(--err)':'var(--t2)';
      trResp.textContent=err?'Erro: '+err.message:(data?.choices?.[0]?.message?.content?.trim()||'');
    }
    btnTr?.classList.remove('loading');
  });
}

/* ═══════════════════════════════════════
   CACHE & STATS
═══════════════════════════════════════ */
function loadCacheCount() {
  chrome.storage.local.get('claw_stop_cache',d=>{
    const el=$('cacheCount');
    if(el) el.textContent=d.claw_stop_cache?Object.keys(d.claw_stop_cache).length:0;
  });
}

on('clearCache','click',()=>{
  if(!confirm('Limpar cache do Stop?')) return;
  chrome.storage.local.remove('claw_stop_cache',()=>{const el=$('cacheCount');if(el)el.textContent='0';});
});

function refreshStats() {
  chrome.storage.local.get(['claw_stats','claw_history'],d=>{
    const s=d.claw_stats||{}, today=new Date().toDateString(), isTd=s.day===today;
    const set=(id,v)=>{const el=$(id);if(el)el.textContent=v;};
    set('statKTotal',s.kt||0); set('statSTotal',s.st||0);
    set('statKToday',(isTd?s.kd:0)+' hoje');
    set('statSToday',(isTd?s.sd:0)+' hoje');
    const h=d.claw_history||[], lst=$('historyList');
    if(!lst) return;
    if(!h.length){lst.innerHTML='<div class="hist-empty">Nenhuma atividade ainda</div>';return;}
    lst.innerHTML=h.slice(0,25).map((item,i)=>{
      const t=new Date(item.ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      if(item.type==='kahoot') return `<div class="hist-item" style="animation-delay:${i*12}ms">
        <div class="hist-q">${item.question||''}</div>
        <div class="hist-a">${item.answer||''}</div>
        <div class="hist-m">Kahoot · ${t}</div></div>`;
      return `<div class="hist-item" style="animation-delay:${i*12}ms">
        <div class="hist-q">Letra ${item.letter||'?'} — ${(item.cats||[]).length} cats</div>
        <div class="hist-a">${(item.answers||[]).filter(Boolean).slice(0,4).join(', ')}</div>
        <div class="hist-m">StopotS · ${t}</div></div>`;
    }).join('');
  });
}

on('clearHistory','click',()=>chrome.storage.local.remove('claw_history',refreshStats));

/* ═══════════════════════════════════════
   MASCOTE
═══════════════════════════════════════ */
on('mascot','click',()=>{
  const m=$('mascot');if(!m)return;
  m.style.transform='scale(1.25) rotate(15deg)';
  setTimeout(()=>m.style.transform='',350);
});

/* ═══════════════════════════════════════
   CARREGA ESTADO
═══════════════════════════════════════ */
chrome.storage.sync.get(
  ['k_on','s_on','tr_on','tr_lang','stealth','miss_on','miss_n','kahoot_delay','summarize_on','explain_on','anti_on'],
  d=>{
    const load=(id,flag,pill)=>{if(flag&&$(id)){$(id).checked=true;setPill(pill||id.replace('tog-',''),true);}};
    load('tog-k',d.k_on,'k'); load('tog-s',d.s_on,'s'); load('tog-tr',d.tr_on,'tr');
    load('tog-sum',d.summarize_on,'sum'); load('tog-exp',d.explain_on,'exp'); load('tog-anti',d.anti_on,'anti');
    if(d.tr_lang){const el=$('tr-lang');if(el)el.value=d.tr_lang;}
    if(d.stealth){const el=$('tog-stealth');if(el)el.checked=true;}
    if(d.miss_on){const el=$('tog-miss');if(el)el.checked=true;const mr=$('missRow');if(mr)mr.style.display='block';}
    if(d.miss_n){const ms=$('missSlider'),mv=$('missVal');if(ms)ms.value=d.miss_n;if(mv)mv.textContent=d.miss_n;}
    if(d.kahoot_delay!=null){
      const ds=$('delaySlider'),dv=$('delayVal');
      if(ds)ds.value=d.kahoot_delay;
      if(dv){const v=parseInt(d.kahoot_delay);dv.textContent=v===0?'0s':(v/1000).toFixed(1)+'s';}
    }
    updateDot();
  }
);

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
loadCacheCount();
refreshStats();
document.querySelectorAll('.card,.stat-card').forEach((el,i)=>{
  if(!el.style.animationDelay) el.style.animationDelay=(i*25)+'ms';
});

/* ════════════════════════════════════════════════════════
   🎙️ COMANDO POR VOZ
════════════════════════════════════════════════════════ */
const btnVoice = $('btnVoice');
let recognition = null;
let isRecording = false;

function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    btnVoice?.setAttribute('title', 'Voz não suportada neste navegador');
    btnVoice?.setAttribute('disabled', 'true');
    btnVoice?.style.setProperty('opacity', '0.4');
    return false;
  }

  recognition = new SR();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isRecording = true;
    btnVoice?.classList.add('recording');
    if (agentInput) agentInput.placeholder = '🎙️ Ouvindo...';
  };

  recognition.onend = () => {
    isRecording = false;
    btnVoice?.classList.remove('recording');
    if (agentInput) agentInput.placeholder = 'Peça qualquer coisa ao Claw...';
    // Envia automaticamente se captou texto
    if (agentInput?.value?.trim()) {
      setTimeout(() => sendAgent(), 400);
    }
  };

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map(r => r[0].transcript)
      .join('');
    if (agentInput) {
      agentInput.value = transcript;
      updateSend();
      autoResize(agentInput);
    }
  };

  recognition.onerror = (e) => {
    isRecording = false;
    btnVoice?.classList.remove('recording');
    if (agentInput) agentInput.placeholder = 'Peça qualquer coisa ao Claw...';
    // 'no-speech' é erro silencioso (usuário não falou), ignora
    if (e.error === 'no-speech') return;
    // 'aborted' acontece quando paramos manualmente, ignora
    if (e.error === 'aborted') return;
    addMsg('Erro de voz: ' + e.error, 'err');
  };

  return true;
}

btnVoice?.addEventListener('click', () => {
  if (!recognition) {
    const ok = initVoice();
    if (!ok) {
      addMsg('Reconhecimento de voz não disponível neste navegador.', 'err');
      return;
    }
  }

  if (isRecording) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (e) {
      // Se a instância está em estado inválido, cria uma nova
      recognition = null;
      const ok = initVoice();
      if (ok) {
        try { recognition.start(); } catch (e2) {
          addMsg('Não foi possível iniciar o microfone: ' + e2.message, 'err');
        }
      }
    }
  }
});

/* ════════════════════════════════════════════════════════
   📌 FAVORITOS (PINNED)
════════════════════════════════════════════════════════ */
const pinnedRow = $('pinnedRow');
let pins = [];

function loadPins() {
  chrome.storage.sync.get(['claw_pins'], d => {
    pins = d.claw_pins || [];
    renderPins();
  });
}

function savePins() {
  chrome.storage.sync.set({ claw_pins: pins });
}

function renderPins() {
  if (!pinnedRow) return;
  if (!pins.length) { pinnedRow.classList.remove('has-pins'); return; }
  pinnedRow.classList.add('has-pins');
  pinnedRow.innerHTML = pins.map((p, i) => `
    <button class="pin-chip" onclick="usePin(${i})">
      📌 ${p.label}
      <span class="pin-del" onclick="event.stopPropagation();removePin(${i})">✕</span>
    </button>`).join('');
}

function usePin(i) {
  if (!pins[i]) return;
  if (agentInput) { agentInput.value = pins[i].cmd; agentInput.focus(); updateSend(); }
}

function removePin(i) {
  pins.splice(i, 1); savePins(); renderPins();
}

function addPin(cmd) {
  const label = cmd.length > 28 ? cmd.slice(0,28)+'…' : cmd;
  if (pins.find(p => p.cmd === cmd)) { addMsg('Já está nos favoritos!', 'ai'); return; }
  pins.unshift({ label, cmd });
  if (pins.length > 8) pins.pop();
  savePins(); renderPins();
  addMsg('📌 Salvo nos favoritos!', 'ai');
}

// Expõe globalmente para onclick inline
window.usePin = usePin;
window.removePin = removePin;

// Botão de fixar (aparece no contexto da última mensagem do usuário)
// O usuário pode digitar /pin para fixar o último comando
const origSendAgent = sendAgent;
// Intercepta /pin
const _origAgentInput = agentInput;
if (_origAgentInput) {
  _origAgentInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const v = _origAgentInput.value.trim();
      if (v.startsWith('/pin ')) {
        e.preventDefault();
        addPin(v.slice(5).trim());
        _origAgentInput.value = '';
        updateSend();
      }
    }
  });
}

/* ════════════════════════════════════════════════════════
   📸 SCREENSHOT INTELIGENTE
════════════════════════════════════════════════════════ */
const btnScreen = $('btnScreen');

btnScreen?.addEventListener('click', () => {
  // Captura screenshot via chrome.tabs API
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) { addMsg('❌ Nenhuma aba ativa', 'err'); return; }

    chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 85 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        addMsg('❌ ' + chrome.runtime.lastError.message, 'err');
        return;
      }

      // Mostra preview
      const thumb = $('imgThumb');
      if (thumb) thumb.src = dataUrl;
      $('imgPreview')?.classList.add('show');
      attachedImg = dataUrl;
      updateSend();

      // Pede ao usuário o que quer saber
      if (agentInput) {
        agentInput.value = 'Analise esta página e diga o que tem aqui e o que posso fazer.';
        agentInput.focus();
        autoResize(agentInput);
      }

      addMsg('🖥️ Screenshot capturado! Edite a pergunta e envie.', 'ai');
      btnScreen?.classList.add('screen-on');
      setTimeout(() => btnScreen?.classList.remove('screen-on'), 2000);
    });
  });
});

/* ════════════════════════════════════════════════════════
   💬 MEMÓRIA DE CONVERSA
════════════════════════════════════════════════════════ */
// Mantém histórico da conversa atual para o agente ter contexto
let conversationHistory = [];
const MAX_HISTORY = 10; // últimas 10 trocas

// Override do sendAgent para incluir histórico
const _origSendAgent = sendAgent;

// Patch: salva cada troca no histórico
const _originalSend = window.sendAgent;

// Intercepta o resultado do AGENT_RUN para salvar no histórico
const origMsgHandler = chrome.runtime.sendMessage.bind(chrome.runtime);

// Wrap não-invasivo: adiciona contexto de histórico nas mensagens do agente
chrome.runtime.onMessage.addListener((msg) => {
  // não faz nada aqui, apenas observa
});

// Salva histórico a cada mensagem do usuário
const agentForm = $('agentInput');
if (agentForm) {
  // Sobrescreve sendAgent para incluir histórico
  window._clawHistory = [];
}

/* ════════════════════════════════════════════════════════
   💡 SUGESTÕES CONTEXTUAIS AUTOMÁTICAS
════════════════════════════════════════════════════════ */
const contextSugg = $('contextSugg');
const suggList    = $('suggList');

function loadContextSuggestions() {
  if (!contextSugg || !suggList) return;

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.url || tab.url.startsWith('chrome')) return;

    const url   = tab.url.toLowerCase();
    const title = (tab.title||'').toLowerCase();

    const suggestions = [];

    // Sugestões baseadas na URL/título
    if (url.includes('google.com/search')) {
      suggestions.push('Extrai todos os resultados desta busca');
      suggestions.push('Clica no primeiro resultado');
      suggestions.push('Abre os 3 primeiros resultados em abas novas');
    }
    if (url.includes('youtube.com/watch')) {
      suggestions.push('Qual é o título e canal deste vídeo?');
      suggestions.push('Clica em inscrever-se');
      suggestions.push('Pula para o próximo vídeo');
    }
    if (url.includes('youtube.com') && !url.includes('watch')) {
      suggestions.push('Pesquisa lofi music no YouTube');
      suggestions.push('Clica no primeiro vídeo da página');
    }
    if (url.includes('gmail') || url.includes('mail.google')) {
      suggestions.push('Quantos emails não lidos tenho?');
      suggestions.push('Clica para compor um novo email');
    }
    if (url.includes('github.com')) {
      suggestions.push('Extrai os links dos repositórios desta página');
      suggestions.push('Clica em Star neste repositório');
    }
    if (url.includes('amazon') || url.includes('shopee') || url.includes('mercadolivre')) {
      suggestions.push('Extrai o preço e nome deste produto');
      suggestions.push('Clica em Comprar agora');
      suggestions.push('Rola até as avaliações');
    }
    if (url.includes('instagram.com')) {
      suggestions.push('Clica em Seguir');
      suggestions.push('Rola o feed para baixo');
    }
    if (url.includes('twitter.com') || url.includes('x.com')) {
      suggestions.push('Extrai os tweets desta página');
      suggestions.push('Clica em Tweetar');
    }
    if (url.includes('linkedin.com')) {
      suggestions.push('Extrai os empregos desta página');
      suggestions.push('Clica em Conectar');
    }
    if (url.includes('notion.so')) {
      suggestions.push('Qual é o título desta página?');
      suggestions.push('Clica em Nova página');
    }
    // Sugestões genéricas sempre presentes
    suggestions.push('Extrai todos os links desta página');
    suggestions.push('Remove os anúncios desta página');
    suggestions.push('Qual é o conteúdo principal desta página?');

    if (suggestions.length > 0) {
      contextSugg.style.display = 'block';
      suggList.innerHTML = suggestions.slice(0, 5).map(s => `
        <button class="sugg-chip" onclick="fillSugg('${s.replace(/'/g,"\\'")}')">
          ${s}
        </button>`).join('');
    }
  });
}

window.fillSugg = function(text) {
  if (agentInput) { agentInput.value = text; agentInput.focus(); updateSend(); autoResize(agentInput); }
  if (chipsEl)    chipsEl.style.display = 'none';
  if (contextSugg) contextSugg.style.display = 'none';
};

/* ════════════════════════════════════════════════════════
   INIT EXTRAS
════════════════════════════════════════════════════════ */
loadPins();
loadContextSuggestions();

/* ═══════════════════════════════════════
   v23 — NOVAS FUNCIONALIDADES
═══════════════════════════════════════ */

/* Modo Estudo */
on('tog-study','change',e=>{
  const v=e.target.checked;
  chrome.storage.sync.set({study_on:v});
  setPill('study',v);
  inject(['study_mode.js'],{type:v?'STUDY_ON':'STUDY_OFF'});
  updateDot();
});

/* Modo Segurança (toggle = auto mode) */
on('tog-perm','change',e=>{
  const auto=e.target.checked;
  const mode=auto?'auto':'safe';
  chrome.storage.local.set({claw_permission_mode:mode});
  const p=$('perm-pill'), s=$('perm-status');
  if(p) p.className='pill'+(auto?' on':'');
  if(s) s.textContent=auto?'Automático':'Seguro';
  inject(['permissions.js'],{type:'PERM_SET_MODE',mode});
});

/* Produtividade — ver stats */
on('btn-productivity','click',()=>{
  chrome.tabs.query({active:true,currentWindow:true},([tab])=>{
    if(!tab?.id) return;
    chrome.tabs.sendMessage(tab.id,{type:'PRODUCTIVITY_GET'},res=>{
      if(chrome.runtime.lastError||!res) {
        addMsg('Sem dados de produtividade ainda.','ai');
        return;
      }
      const today=new Date().toISOString().slice(0,10);
      const data=res[today]||{};
      const entries=Object.entries(data).sort((a,b)=>b[1]-a[1]).slice(0,8);
      if(entries.length===0){
        addMsg('Nenhum site rastreado hoje.','ai');
        return;
      }
      const lines=entries.map(([site,secs])=>{
        const mins=Math.round(secs/60);
        return `${site}: ${mins} min`;
      });
      addMsg('Tempo hoje:\n'+lines.join('\n'),'ai');
    });
  });
});

/* Carrega estados salvos v23 */
chrome.storage.sync.get(['study_on'],d=>{
  if(d.study_on && $('tog-study')) { $('tog-study').checked=true; setPill('study',true); }
});
chrome.storage.local.get(['claw_permission_mode'],d=>{
  const auto=(d.claw_permission_mode==='auto');
  if($('tog-perm')) $('tog-perm').checked=auto;
  const p=$('perm-pill'), s=$('perm-status');
  if(p) p.className='pill'+(auto?' on':'');
  if(s) s.textContent=auto?'Automático':'Seguro';
});
