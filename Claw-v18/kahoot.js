/* ================================================================
   CLAW — kahoot.js v18
   Detecção em 5 camadas, overlay melhorado, registra acertos.
   Desenvolvido por Emanuel Felipe
================================================================ */
(function(){
'use strict';

const KEY   = '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';
const MODEL = 'llama-3.1-8b-instant';
const ICON  = 'data:image/png;base64,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';

let ON=false, STEALTH=false, XDELAY=0, busy=false, lastQ='', tickId=null, ui=null, barT=null, answerCount=0, correctCount=0;

/* ── atalho stealth Alt+H ── */
document.addEventListener('keydown', e=>{
  if(e.altKey && (e.key==='h'||e.key==='H')){
    const b=document.getElementById('__ck_card__');
    if(b) b.style.display = b.style.display==='none' ? '' : 'none';
  }
});

chrome.runtime.onMessage.addListener(msg=>{
  if(msg.type==='KAHOOT_ON') { ON=true; STEALTH=!!msg.stealth; XDELAY=parseInt(msg.delay)||0; buildUI(); startTick(); }
  if(msg.type==='KAHOOT_OFF'){ ON=false; stopTick(); removeUI(); clearHL(); }
  if(msg.type==='KAHOOT_NOW'){ busy=false; lastQ=''; tick(); }
});

function startTick(){ stopTick(); tickId=setInterval(tick,500); }
function stopTick() { clearInterval(tickId); tickId=null; }

/* ================================================================
   TICK
================================================================ */
function tick(){
  if(!ON||busy) return;
  const s=snap();
  if(!s.question || s.question===lastQ) return;
  if(s.options.length<2 && !s.inputs.length) return;
  lastQ=s.question; busy=true;
  run(s);
}

/* ================================================================
   SNAP — 5 camadas
================================================================ */
function snap(){
  /* PERGUNTA */
  const QSEL=[
    '[data-functional-selector="question-title"]',
    '[data-functional-selector="block-title"]',
    '[data-functional-selector="question-text"]',
    '[class*="QuestionTitle"]','[class*="questionTitle"]',
    '[class*="question-title"]','[class*="TitleText"]',
    '[class*="title--"]','[class*="Title__"]',
    '[class*="QuestionText"]','[class*="questionText"]',
    '[class*="question__title"]','[class*="GameBlock"]',
    '[role="heading"]','h1','h2','h3',
  ];
  let question='';
  for(const s of QSEL){
    try{
      const els=document.querySelectorAll(s);
      for(const el of els){
        const t=(el.innerText||'').trim();
        if(t.length>3&&t.length<800&&vis(el)){ question=t; break; }
      }
      if(question) break;
    }catch{}
  }

  /* ALTERNATIVAS */
  const ASEL=[
    '[data-functional-selector="answer-text"]',
    '[data-functional-selector*="answer"]','[data-functional-selector*="choice"]',
    '[class*="answerText"]','[class*="AnswerText"]',
    '[class*="answer-text"]','[class*="choiceText"]','[class*="ChoiceText"]',
    '[class*="answer__text"]','[class*="AnswerLabel"]','[class*="answerLabel"]',
    '[class*="choice-text"]','[class*="option-text"]','[class*="AnswerMap"]',
  ];
  let ansEls=[], options=[];
  for(const s of ASEL){
    try{
      const found=[...document.querySelectorAll(s)].filter(vis);
      if(found.length>=2){ ansEls=found; options=found.map(e=>(e.innerText||'').trim()).filter(Boolean); break; }
    }catch{}
  }

  /* fallback aria-label */
  if(ansEls.length<2){
    try{
      const btns=[...document.querySelectorAll('button[aria-label],[role="button"][aria-label]')]
        .filter(b=>vis(b)&&b.getAttribute('aria-label').length>1);
      if(btns.length>=2){ ansEls=btns; options=btns.map(b=>b.getAttribute('aria-label').trim()); }
    }catch{}
  }

  /* fallback divs grandes coloridas */
  if(ansEls.length<2){
    try{
      const cands=[...document.querySelectorAll('div[class*="block"],div[class*="Block"],li[class*="answer"],li[class*="Answer"],div[class*="Choice"]')]
        .filter(el=>{ if(!vis(el)) return false; const r=el.getBoundingClientRect(); return r.width>80&&r.height>40; });
      if(cands.length>=2){ ansEls=cands; options=cands.map(e=>(e.innerText||'').trim().split('\n')[0]).filter(Boolean); }
    }catch{}
  }

  /* sobe para o botão clicável */
  const btns=ansEls.map(e=>{ let x=e; for(let i=0;i<6;i++){ if(!x) break; if(x.tagName==='BUTTON'||x.tagName==='A'||x.getAttribute?.('role')==='button') return x; x=x.parentElement; } return e; });

  /* inputs dissertativa */
  const inputs=[...document.querySelectorAll('input[type="text"],input:not([type]),textarea')]
    .filter(e=>!e.disabled&&!e.readOnly&&vis(e)&&e.value.trim()==='');

  return {question, options, els:btns, inputs};
}

function vis(el){
  try{
    const r=el.getBoundingClientRect();
    if(r.width<=0||r.height<=0) return false;
    const cs=getComputedStyle(el);
    return cs.display!=='none'&&cs.visibility!=='hidden'&&parseFloat(cs.opacity||1)>0;
  }catch{ return false; }
}

/* ================================================================
   RUN
================================================================ */
async function run(s){
  setUI('thinking','Analisando...');
  setQ(s.question);

  /* tradução opcional */
  let q=s.question;
  if(window.__clawTranslateOn__?.()&&window.__clawTranslate__){
    try{
      setUI('thinking','Traduzindo...');
      const tr=await window.__clawTranslate__(q);
      if(tr&&tr!==q){ q=tr; setQ(s.question+'\n→ '+q); }
    }catch{}
  }

  if(XDELAY>0){ setUI('thinking','Aguardando...'); await sleep(XDELAY); }
  if(!ON){ busy=false; return; }

  const fresh=snap();
  const opts=fresh.options.length>=2 ? fresh.options : s.options;
  const els =fresh.els.length>=2   ? fresh.els   : s.els;

  if(opts.length>=2){
    setUI('thinking','Consultando IA...');
    startBar();
    try{
      const idx=await askGroq(q,opts);
      stopBar();
      if(idx>=0&&idx<els.length){
        hlAnswer(els,idx);
        setUI('done','✓ '+opts[idx]);
        setQ(s.question);
        answerCount++;
        updateScore();
        try{
          window.ClawStats?.addKahoot();
          window.ClawStats?.addHistory({type:'kahoot',question:s.question,answer:opts[idx]});
        }catch{}
        await sleep(9000);
        clearHL(); busy=false; setUI('idle','Monitorando...'); setQ('');
        return;
      }
    }catch(e){ stopBar(); console.error('[Claw/Kahoot]',e); }
    setUI('error','Não identificou — tente novamente');
    await sleep(3000);

  }else if((fresh.inputs.length>0)||(s.inputs.length>0)){
    setUI('thinking','Respondendo...');
    startBar();
    try{
      const inp=fresh.inputs[0]||s.inputs[0];
      const ans=await askText(q);
      stopBar();
      if(ans){ fillInput(inp,ans); setUI('done','Preenchido: '+ans); try{window.ClawStats?.addKahoot();}catch{} }
    }catch(e){ stopBar(); setUI('error',e.message.slice(0,40)); }
    await sleep(7000);
  }

  busy=false; setUI('idle','Monitorando...'); setQ('');
}

/* ================================================================
   GROQ
================================================================ */
const SYS=`Você é um professor especialista em TODAS as matérias escolares brasileiras.
Nunca erra. Responda SOMENTE com o número (1, 2, 3 ou 4).`;

async function askGroq(question,options){
  const list=options.map((o,i)=>`${i+1}. ${o}`).join('\n');
  const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${KEY}`},
    body:JSON.stringify({model:MODEL,messages:[
      {role:'system',content:SYS},
      {role:'user',content:`QUESTÃO: ${question}\n\nALTERNATIVAS:\n${list}\n\nQual o número?`}
    ],max_tokens:5,temperature:0.0}),
  });
  if(!res.ok){ const t=await res.text(); throw new Error(`Groq ${res.status}: ${t.slice(0,60)}`); }
  const txt=((await res.json()).choices?.[0]?.message?.content||'').trim();
  const m=txt.match(/\b([1-9])\b/);
  if(m){ const idx=parseInt(m[1])-1; if(idx>=0&&idx<options.length) return idx; }
  const low=txt.toLowerCase();
  for(let i=0;i<options.length;i++){ if(low.includes(options[i].toLowerCase().slice(0,12))) return i; }
  return -1;
}

async function askText(question){
  const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${KEY}`},
    body:JSON.stringify({model:MODEL,messages:[
      {role:'system',content:SYS+'\nResponda dissertativas em até 5 palavras.'},
      {role:'user',content:question}
    ],max_tokens:25,temperature:0.0}),
  });
  if(!res.ok) throw new Error(`Groq ${res.status}`);
  return ((await res.json()).choices?.[0]?.message?.content||'').trim();
}

/* ================================================================
   HIGHLIGHT
================================================================ */
function hlAnswer(els,idx){
  clearHL();
  els.forEach((el,i)=>{
    if(i===idx){
      el.style.setProperty('opacity','1','important');
      el.style.setProperty('filter','brightness(1.12)','important');
      el.style.setProperty('transform','scale(1.04)','important');
      el.style.setProperty('transition','all .25s ease','important');
      el.style.setProperty('outline','3px solid rgba(255,255,255,.95)','important');
      el.style.setProperty('outline-offset','3px','important');
      el.style.setProperty('box-shadow','0 0 0 8px rgba(255,255,255,.1)','important');
      el.setAttribute('data-claw-k','c');
    }else{
      el.style.setProperty('opacity','0.1','important');
      el.style.setProperty('filter','grayscale(1) brightness(0.2)','important');
      el.style.setProperty('transform','scale(0.97)','important');
      el.style.setProperty('transition','all .25s ease','important');
      el.setAttribute('data-claw-k','w');
    }
  });
}

function clearHL(){
  document.querySelectorAll('[data-claw-k]').forEach(el=>{
    ['opacity','filter','transform','transition','outline','outline-offset','box-shadow']
      .forEach(p=>el.style.removeProperty(p));
    el.removeAttribute('data-claw-k');
  });
}

/* ================================================================
   FILL INPUT
================================================================ */
function fillInput(el,val){
  const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set
       ||Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;
  el.focus();
  if(s) s.call(el,val); else el.value=val;
  ['input','change','keyup'].forEach(ev=>el.dispatchEvent(new Event(ev,{bubbles:true})));
  el.blur();
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ================================================================
   BARRA DE PROGRESSO
================================================================ */
function startBar(){
  const b=document.getElementById('__ck_pb__'); if(!b) return;
  clearInterval(barT); let w=5; b.style.width='5%';
  barT=setInterval(()=>{ w=Math.min(w+2,90); b.style.width=w+'%'; },100);
}
function stopBar(){
  clearInterval(barT);
  const b=document.getElementById('__ck_pb__');
  if(b){ b.style.width='100%'; setTimeout(()=>{ if(b) b.style.width='0%'; },700); }
}

/* ================================================================
   PLACAR
================================================================ */
function updateScore(){
  const el=document.getElementById('__ck_score__');
  if(el) el.textContent=`${answerCount} respondida${answerCount!==1?'s':''}`;
}

/* ================================================================
   OVERLAY UI
================================================================ */
function buildUI(){
  document.getElementById('__claw_k__')?.remove();
  ui=document.createElement('div');
  ui.id='__claw_k__';
  ui.innerHTML=`
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
#__claw_k__{position:fixed!important;top:14px!important;right:14px!important;z-index:2147483647!important;width:262px;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;pointer-events:auto;}
@keyframes _ckIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}
@keyframes _ckP{0%,100%{opacity:1}50%{opacity:.35}}
#__ck_card__{background:#1c1c1e;border:1px solid #3a3a3e;border-radius:14px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.05);animation:_ckIn .2s ease both;}
#__ck_hd__{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #3a3a3e;background:#222224;}
#__ck_ico__{width:20px;height:20px;object-fit:contain;flex-shrink:0;border-radius:4px;}
#__ck_ttl__{font-size:12px;font-weight:600;color:#f0efed;flex:1;}
#__ck_score__{font-size:9px;color:#6b6b6b;background:#2a2a2d;border:1px solid #3a3a3e;border-radius:4px;padding:2px 6px;}
#__ck_dot__{width:7px;height:7px;border-radius:50%;background:#48484d;flex-shrink:0;transition:background .25s,box-shadow .25s;}
#__ck_dot__.t{background:#d4a85a;box-shadow:0 0 0 3px rgba(212,168,90,.2);animation:_ckP .9s ease-in-out infinite;}
#__ck_dot__.d{background:#5a9e6f;box-shadow:0 0 0 3px rgba(90,158,111,.2);}
#__ck_dot__.e{background:#c46060;}
#__ck_x__{background:none;border:none;color:#48484d;cursor:pointer;width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;transition:color .15s,background .15s;flex-shrink:0;}
#__ck_x__:hover{color:#f0efed;background:#323235;}
#__ck_x__ svg{width:10px;height:10px;}
#__ck_bd__{padding:10px 12px 12px;display:flex;flex-direction:column;gap:6px;}
#__ck_st__{font-size:11.5px;font-weight:500;color:#a8a8a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .2s;}
#__ck_st__.t{color:#d4a85a;}
#__ck_st__.d{color:#5a9e6f;}
#__ck_st__.e{color:#c46060;}
#__ck_q__{font-size:10px;color:#6b6b6b;line-height:1.45;max-height:36px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
#__ck_pw__{height:2px;background:#2a2a2d;border-radius:2px;overflow:hidden;}
#__ck_pb__{height:100%;width:0%;background:linear-gradient(90deg,#d4a85a,#c49444);border-radius:2px;transition:width .1s linear;}
#__ck_btn__{background:#2a2a2d;border:1px solid #3a3a3e;border-radius:8px;color:#a8a8a8;font-family:'Inter',system-ui,sans-serif;font-size:11px;font-weight:500;padding:7px 10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;width:100%;transition:background .15s,border-color .15s,color .15s;}
#__ck_btn__:hover{background:#323235;border-color:#48484d;color:#f0efed;}
#__ck_btn__ svg{width:12px;height:12px;}
</style>
<div id="__ck_card__">
  <div id="__ck_hd__">
    <img id="__ck_ico__" src="${ICON}" alt=""/>
    <span id="__ck_ttl__">Claw</span>
    <span id="__ck_score__">0 respondidas</span>
    <div id="__ck_dot__"></div>
    <button id="__ck_x__">
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
      </svg>
    </button>
  </div>
  <div id="__ck_bd__">
    <div id="__ck_st__">Monitorando perguntas...</div>
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
  document.getElementById('__ck_x__').onclick  =()=>{ ui?.remove(); ui=null; clearHL(); ON=false; };
  document.getElementById('__ck_btn__').onclick=()=>{ busy=false; lastQ=''; tick(); };
  if(STEALTH) document.getElementById('__ck_card__').style.display='none';
}

function removeUI(){ ui?.remove(); ui=null; }

function setUI(state,msg){
  const cls={thinking:'t',done:'d',error:'e',idle:''}[state]||'';
  const st=document.getElementById('__ck_st__');
  const dot=document.getElementById('__ck_dot__');
  if(st){ st.textContent=msg; st.className=cls; }
  if(dot) dot.className=cls;
}

function setQ(q){ const el=document.getElementById('__ck_q__'); if(el) el.textContent=q||''; }

})();
