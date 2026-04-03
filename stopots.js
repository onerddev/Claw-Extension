/* ================================================================
   CLAW — stopots.js v18
   Cache turbo · dicionário expandido · Angular/React trick
   Desenvolvido por Emanuel Felipe
================================================================ */
(function(){
'use strict';

const KEY   = 'SUA_CHAVE_API_GROQ_AQUI';
const MODEL = 'llama-3.3-70b-versatile'; // 70B: mais vocabulário e criatividade para Stop
const ICON  = 'data:image/png;base64,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';

let ON=false, busy=false, lastKey='', tickId=null, ui=null, barT=null;

chrome.runtime.onMessage.addListener(msg=>{
  if(msg.type==='STOP_ON') { ON=true;  buildUI(); startTick(); setState('idle','Aguardando rodada...'); }
  if(msg.type==='STOP_OFF'){ ON=false; stopTick(); removeUI(); }
  if(msg.type==='STOP_NOW'){ busy=false; lastKey=''; tick(); }
});

function startTick(){ stopTick(); tickId=setInterval(tick,600); }
function stopTick() { clearInterval(tickId); tickId=null; }

/* ================================================================
   TICK
================================================================ */
async function tick(){
  if(!ON||busy) return;
  const letter=getLetter();
  const pairs=getPairs();
  if(!letter||!pairs.length) return;
  const empties=pairs.filter(p=>p.el.value.trim()==='');
  if(!empties.length) return;
  const key=letter+'|'+empties.map(p=>p.cat).join(',');
  if(key===lastKey) return;
  lastKey=key; busy=true;
  await run(letter,empties);
}

/* ================================================================
   DETECTA LETRA — 3 estratégias
================================================================ */
function getLetter(){
  /* estratégia 1: seletores CSS conhecidos */
  const SELS=[
    '.round-letter','[class*="round-letter"]','[class*="roundLetter"]',
    '[class*="RoundLetter"]','[class*="letter-display"]','[class*="current-letter"]',
    '[class*="game-letter"]','[class*="gameLetter"]','[class*="currentLetter"]',
    '[class*="sortedLetter"]','[class*="the-letter"]','[class*="letra"]',
    '[id*="letter"]','[id*="letra"]',
  ];
  for(const s of SELS){
    try{
      const t=(document.querySelector(s)?.innerText||'').trim();
      if(t.length===1&&/[A-Za-zÀ-ÿ]/.test(t)) return t.toUpperCase();
    }catch{}
  }
  /* estratégia 2: elemento com fonte grande */
  for(const el of document.querySelectorAll('span,div,h1,h2,h3,p,b,strong,em')){
    try{
      if(el.children.length>0) continue;
      const t=(el.innerText||'').trim();
      if(t.length!==1||!/[A-Za-zÀ-ÿ]/.test(t)) continue;
      if(parseFloat(getComputedStyle(el).fontSize)<18) continue;
      const r=el.getBoundingClientRect();
      if(r.width>0&&r.height>0) return t.toUpperCase();
    }catch{}
  }
  /* estratégia 3: título da página ou texto grande */
  const title=document.title;
  const m=title.match(/letra[:\s]+([A-Za-zÀ-ÿ])/i);
  if(m) return m[1].toUpperCase();
  return null;
}

/* ================================================================
   DETECTA INPUTS
================================================================ */
function getPairs(){
  return [...document.querySelectorAll('input[type="text"],input:not([type])')]
    .filter(el=>{
      if(el.disabled||el.readOnly) return false;
      try{ const r=el.getBoundingClientRect(); return r.width>0&&r.height>0; }catch{ return false; }
    })
    .map(el=>({el, cat:getLabel(el)}));
}

function getLabel(inp){
  const ph=(inp.placeholder||'').trim(); if(ph.length>1) return ph;
  const al=(inp.getAttribute('aria-label')||'').trim(); if(al.length>1) return al;
  if(inp.id){
    try{ const l=document.querySelector(`label[for="${CSS.escape(inp.id)}"]`); if(l?.innerText?.trim()) return l.innerText.trim(); }catch{}
  }
  let el=inp.parentElement;
  for(let i=0;i<10;i++){
    if(!el) break;
    for(const c of el.querySelectorAll('span,label,p,div,b,strong,h1,h2,h3,h4,legend')){
      if(c===inp||c.contains(inp)) continue;
      const t=(c.innerText||'').trim();
      if(t.length>1&&t.length<80&&!t.includes('\n')) return t;
    }
    el=el.parentElement;
  }
  return 'campo';
}

/* ================================================================
   DICIONÁRIO DE ABREVIAÇÕES — 150+ entradas
================================================================ */
const CATS={
  'pch':'Parte do Corpo Humano','p.c.h':'Parte do Corpo Humano',
  'cep':'Cidade, Estado ou País','c.e.p':'Cidade, Estado ou País',
  'fds':'Filme, Desenho ou Série','f.d.s':'Filme, Desenho ou Série',
  'jlr':'Jornal, Livro ou Revista','j.l.r':'Jornal, Livro ou Revista',
  'pda':'Personagem de Desenho Animado','p.d.a':'Personagem de Desenho Animado',
  'mse':'Adjetivo que descreve pessoa','msé':'Adjetivo que descreve pessoa',
  'minha sogra é':'Adjetivo para pessoa',
  'mst':'Objeto material','minha sogra tem':'Objeto material',
  'snb':'Bebida','seu namorado bebe':'Bebida',
  'mme':'Marca famosa',
  'nome':'Nome próprio','nome proprio':'Nome próprio',
  'nome feminino':'Nome feminino','nome masculino':'Nome masculino',
  'sobrenome':'Sobrenome','animal':'Animal','bicho':'Animal',
  'fruta':'Fruta','vegetal':'Vegetal','verdura':'Verdura',
  'cor':'Cor','cores':'Cor',
  'objeto':'Objeto','lugar':'Lugar','local':'Lugar',
  'cidade':'Cidade','estado':'Estado','pais':'País','país':'País',
  'profissao':'Profissão','profissão':'Profissão',
  'carro':'Carro/marca','veiculo':'Veículo','veículo':'Veículo',
  'time':'Time de futebol','time de futebol':'Time de futebol',
  'flor':'Flor','planta':'Planta','arvore':'Árvore','árvore':'Árvore',
  'alimento':'Alimento','comida':'Comida','bebida':'Bebida',
  'musica':'Música (título)','música':'Música (título)',
  'cantor':'Cantor','cantora':'Cantora','banda':'Banda',
  'ator':'Ator','atriz':'Atriz','artista':'Artista',
  'personagem':'Personagem','personagem biblico':'Personagem bíblico',
  'filme':'Filme','serie':'Série TV','série':'Série TV',
  'desenho animado':'Desenho animado','desenho':'Desenho animado',
  'novela':'Novela brasileira','anime':'Anime',
  'esporte':'Esporte','instrumento':'Instrumento musical',
  'doenca':'Doença','doença':'Doença',
  'remedio':'Remédio','remédio':'Remédio',
  'super heroi':'Super-herói','super herói':'Super-herói',
  'heroi':'Herói','herói':'Herói','vilao':'Vilão','vilão':'Vilão',
  'marca':'Marca','marca de roupa':'Marca de roupa','roupa':'Roupa',
  'adjetivo':'Adjetivo','substantivo':'Substantivo','verbo':'Verbo',
  'bairro':'Bairro','capital':'Capital','celebridade':'Celebridade',
  'famoso':'Pessoa famosa','santo':'Santo','presidente':'Presidente',
  'jogo':'Jogo','videogame':'Videogame',
  'pais da europa':'País europeu','país da europa':'País europeu',
  'pais da america':'País americano','pais da africa':'País africano',
  'objeto escolar':'Objeto escolar','objeto de cozinha':'Utensílio de cozinha',
  'palavra':'Palavra em português',
  'time de basquete':'Time de basquete','time de basquete nba':'Time NBA',
  'personagem de serie':'Personagem de série','personagem de anime':'Personagem de anime',
  'musica nacional':'Música nacional','musica internacional':'Música internacional',
  'musica funk':'Música funk','musica sertaneja':'Música sertaneja',
  'musica gospel':'Música gospel','musica pop':'Música pop',
  'jogador de futebol':'Jogador de futebol','jogador':'Jogador',
  'atleta':'Atleta','esportista':'Esportista',
  'personagem de videogame':'Personagem de videogame',
  'app':'Aplicativo','aplicativo':'Aplicativo','site':'Site',
};

function expandCat(raw){
  const n=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[().]/g,'').replace(/\s+/g,' ').trim();
  const k=n(raw);
  for(const[key,val] of Object.entries(CATS)){ if(n(key)===k) return val; }
  for(const[key,val] of Object.entries(CATS)){ const nk=n(key); if(k.includes(nk)||nk.includes(k)) return val; }
  return raw.trim();
}

/* ================================================================
   RUN
================================================================ */
async function run(letter,pairs){
  setLetter(letter);
  setState('thinking',`Letra "${letter}" detectada...`);
  showList(pairs.map(p=>({cat:p.cat,ans:'...'})));
  animBar(true);

  /* verifica cache */
  const cached=pairs.map(p=>window.ClawStats?.getCached(letter,p.cat)||null);
  const allCached=cached.every(a=>a!==null);

  if(allCached){
    animBar(false);
    showList(pairs.map((p,i)=>({cat:p.cat,ans:cached[i]})));
    for(let i=0;i<pairs.length;i++){
      if(!cached[i]||pairs[i].el.value.trim()!=='') continue;
      await sleep(50+rnd(40));
      fillAngular(pairs[i].el, cached[i]);
      markDone(i);
      setState('done',`${pairs[i].cat}: ${cached[i]} ⚡`);
    }
    await sleep(180); clickStop();
    setState('done','Pronto! (cache turbo ⚡)');
    try{ window.ClawStats?.addStop(); }catch{}
    await sleep(6000); busy=false; lastKey='';
    setState('idle','Aguardando rodada...');
    return;
  }

  /* chama IA */
  try{
    const expanded=pairs.map(p=>expandCat(p.cat));
    const prompt=
      `Jogo Stop/Adedonha. Letra obrigatória: "${letter}".\n`+
      `Para cada categoria, dê UMA resposta REAL em português brasileiro que COMECE com a letra "${letter}".\n`+
      `Regras: nome/palavra conhecida · máximo 3 palavras · não repetir · se impossível use "-"\n\n`+
      expanded.map((c,i)=>`${i+1}. ${c}`).join('\n')+
      `\n\nResponda SOMENTE JSON: {"r":["resp1","resp2",...]}`;

    /* usa background como proxy para garantir que fetch funciona */
    const groqReply = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type:'GROQ_FETCH', key:KEY,
        payload:{model:MODEL,messages:[{role:'user',content:prompt}],max_tokens:500,temperature:0.3}  // temperatura maior = mais vocabulário variado
      }, res => {
        if(chrome.runtime.lastError){ reject(new Error(chrome.runtime.lastError.message)); return; }
        if(!res?.ok){ reject(new Error(res?.error||'Erro da API')); return; }
        resolve(res.data);
      });
    });
    const reply=((groqReply.choices?.[0]?.message?.content)||'').trim();
    const match=reply.match(/\{[\s\S]*?\}/);
    if(!match) throw new Error('JSON inválido');
    const answers=(JSON.parse(match[0]).r||[]).map(a=>{ const s=(a||'').trim(); return(s==='-'||s==='---')?'':s; });

    animBar(false);
    showList(pairs.map((p,i)=>({cat:p.cat,ans:answers[i]||'—'})));

    for(let i=0;i<pairs.length;i++){
      const {el,cat}=pairs[i], ans=answers[i];
      if(!ans||el.value.trim()!=='') continue;
      await sleep(70+rnd(50));
      fillAngular(el,ans);
      markDone(i);
      setState('done',`${cat}: ${ans}`);
      await sleep(50);
    }

    /* salva cache */
    try{
      for(let i=0;i<pairs.length;i++){
        if(answers[i]) window.ClawStats?.setCache(letter,pairs[i].cat,answers[i]);
      }
      window.ClawStats?.addStop();
      window.ClawStats?.addHistory({type:'stop',letter,cats:pairs.map(p=>p.cat),answers});
    }catch{}

    await sleep(180); clickStop();
    setState('done','Pronto! Aguardando próxima rodada...');

  }catch(e){
    animBar(false);
    setState('error','Erro: '+String(e).slice(0,50));
    console.error('[Claw/StopotS]',e);
  }

  await sleep(7000); busy=false; lastKey='';
  setState('idle','Aguardando rodada...');
}

/* ================================================================
   ANGULAR/REACT FILL
================================================================ */
function fillAngular(el,value){
  const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
  el.focus();
  if(s) s.call(el,value); else el.value=value;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
  el.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true}));
  el.blur();
}

/* ================================================================
   CLICA STOP
================================================================ */
function clickStop(){
  for(const el of document.querySelectorAll('button,[role="button"]')){
    const t=(el.innerText||'').trim().toUpperCase();
    if(['STOP','STOP!','PARAR','ENVIAR','SEND'].includes(t)){
      try{ const r=el.getBoundingClientRect(); if(r.width>0){ el.click(); return; } }catch{}
    }
  }
  for(const s of ['[class*="stop-btn"]','[class*="stopBtn"]','button[class*="stop" i]','[class*="StopButton"]']){
    const el=document.querySelector(s); if(el){ try{el.click();}catch{} return; }
  }
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=n=>Math.floor(Math.random()*n);

/* ================================================================
   OVERLAY UI
================================================================ */
function buildUI(){
  document.getElementById('__claw_s__')?.remove();
  ui=document.createElement('div');
  ui.id='__claw_s__';
  ui.innerHTML=`
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
#__claw_s__{position:fixed!important;top:14px!important;right:14px!important;z-index:2147483647!important;width:265px;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
@keyframes csFI{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes csP{0%,100%{opacity:1}50%{opacity:.4}}
#__cs_card__{background:#1c1c1e;border:1px solid #3a3a3e;border-radius:14px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.04);animation:csFI .22s ease;}
#__cs_hd__{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #3a3a3e;background:#222224;}
#__cs_ico__{width:20px;height:20px;object-fit:contain;flex-shrink:0;border-radius:4px;}
#__cs_ttl__{font-size:12px;font-weight:600;color:#f0efed;flex:1;}
#__cs_ltr__{min-width:26px;height:26px;border-radius:7px;background:#2a2a2d;border:1px solid #48484d;color:#d4a85a;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;transition:all .2s;}
#__cs_dot__{width:7px;height:7px;border-radius:50%;background:#48484d;flex-shrink:0;transition:background .3s,box-shadow .3s;}
#__cs_dot__.t{background:#d4a85a;box-shadow:0 0 0 3px rgba(212,168,90,.2);animation:csP 1s ease-in-out infinite;}
#__cs_dot__.d{background:#5a9e6f;box-shadow:0 0 0 3px rgba(90,158,111,.2);}
#__cs_dot__.e{background:#c46060;}
#__cs_x__{background:none;border:none;color:#48484d;cursor:pointer;width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;transition:color .15s,background .15s;flex-shrink:0;}
#__cs_x__:hover{color:#f0efed;background:#323235;}
#__cs_x__ svg{width:10px;height:10px;}
#__cs_bd__{padding:10px 12px 12px;display:flex;flex-direction:column;gap:6px;}
#__cs_st__{font-size:11.5px;font-weight:500;color:#a8a8a8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .2s;}
#__cs_st__.t{color:#d4a85a;}
#__cs_st__.d{color:#5a9e6f;}
#__cs_st__.e{color:#c46060;}
#__cs_list__{display:flex;flex-direction:column;gap:2px;max-height:130px;overflow-y:auto;}
#__cs_list__::-webkit-scrollbar{width:3px;}
#__cs_list__::-webkit-scrollbar-thumb{background:#3a3a3e;border-radius:2px;}
.cs-row{display:flex;align-items:center;gap:6px;padding:2px 0;font-size:10.5px;}
.cs-cat{flex:1;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cs-ans{color:#d4a85a;font-weight:600;min-width:70px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .25s;}
.cs-ans.ok{color:#5a9e6f;}
#__cs_pw__{height:2px;background:#2a2a2d;border-radius:2px;overflow:hidden;}
#__cs_pb__{height:100%;width:0%;background:linear-gradient(90deg,#d4a85a,#c49444);border-radius:2px;transition:width .1s linear;}
#__cs_btn__{background:#2a2a2d;border:1px solid #3a3a3e;border-radius:8px;color:#a8a8a8;font-family:'Inter',system-ui,sans-serif;font-size:11px;font-weight:500;padding:7px 10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;width:100%;transition:background .15s,border-color .15s,color .15s;}
#__cs_btn__:hover{background:#323235;border-color:#48484d;color:#f0efed;}
</style>
<div id="__cs_card__">
  <div id="__cs_hd__">
    <img id="__cs_ico__" src="${ICON}" alt=""/>
    <span id="__cs_ttl__">Claw</span>
    <div id="__cs_ltr__">?</div>
    <div id="__cs_dot__"></div>
    <button id="__cs_x__">
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
      </svg>
    </button>
  </div>
  <div id="__cs_bd__">
    <div id="__cs_st__">Aguardando rodada...</div>
    <div id="__cs_list__"></div>
    <div id="__cs_pw__"><div id="__cs_pb__"></div></div>
    <button id="__cs_btn__">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
      Preencher agora
    </button>
  </div>
</div>`;
  document.body.appendChild(ui);
  document.getElementById('__cs_x__').onclick=()=>{ ui?.remove(); ui=null; };
  document.getElementById('__cs_btn__').onclick=()=>{ busy=false; lastKey=''; tick(); };
  setInterval(()=>{ const l=getLetter(); const el=document.getElementById('__cs_ltr__'); if(el) el.textContent=l||'?'; },800);
}

function removeUI(){ ui?.remove(); ui=null; }
function setState(cls,msg){
  const st=document.getElementById('__cs_st__'), dot=document.getElementById('__cs_dot__');
  if(st){ st.textContent=msg; st.className=cls; }
  if(dot) dot.className=cls;
}
function setLetter(l){ const el=document.getElementById('__cs_ltr__'); if(el) el.textContent=l||'?'; }
function showList(items){
  const el=document.getElementById('__cs_list__'); if(!el) return;
  el.innerHTML=items.map(({cat,ans},i)=>
    `<div class="cs-row"><span class="cs-cat">${cat}</span><span class="cs-ans" id="__csa${i}__">${ans}</span></div>`
  ).join('');
}
function markDone(i){ const el=document.getElementById(`__csa${i}__`); if(el) el.classList.add('ok'); }
function animBar(on){
  const b=document.getElementById('__cs_pb__'); if(!b) return;
  clearInterval(barT);
  if(on){ let w=5; b.style.width='5%'; barT=setInterval(()=>{ w=Math.min(w+1.5,88); b.style.width=w+'%'; },80); }
  else b.style.width='0%';
}

})();
