/* StopotS AI v5 — auto-responder Groq embutido */
(function () {
  'use strict';

  const GROQ_KEY   = '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';
  const GROQ_MODEL = 'llama-3.3-70b-versatile';

  let ON = false, busy = false, lastKey = '', tick_id = null, ui = null;

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'ON')  { ON = true;  startTick(); buildUI(); setStatus('🟢 Ativo!', '#4ade80'); }
    if (msg.type === 'OFF') { ON = false; stopTick();  setStatus('⭕ Pausado', '#888'); }
    if (msg.type === 'NOW') { busy = false; lastKey = ''; doTick(); }
  });

  function startTick() { stopTick(); tick_id = setInterval(doTick, 700); }
  function stopTick()  { clearInterval(tick_id); tick_id = null; }

  async function doTick() {
    if (!ON || busy) return;
    const letter = getLetter();
    const pairs  = getPairs();
    if (!letter || pairs.length === 0) return;
    const empties = pairs.filter(p => p.el.value.trim() === '');
    if (empties.length === 0) return;
    const key = letter + '|' + empties.map(p => p.cat).join(',');
    if (key === lastKey) return;
    lastKey = key;
    await fill(letter, empties);
  }

  /* ================================================================
     DICIONÁRIO COMPLETO DE ABREVIAÇÕES E CATEGORIAS DO STOPOTS
  ================================================================ */
  const CATS = {
    // Abreviações com pontos e sem
    'pch'                     : 'Parte do Corpo Humano (órgão, osso, membro, ex: Braço, Coração, Dente)',
    'p.c.h'                   : 'Parte do Corpo Humano',
    'p.c.h.'                  : 'Parte do Corpo Humano',
    'parte do corpo humano'   : 'Parte do Corpo Humano (órgão, osso ou membro)',

    'cep'                     : 'Cidade, Estado ou País (nome geográfico)',
    'c.e.p'                   : 'Cidade, Estado ou País',
    'c.e.p.'                  : 'Cidade, Estado ou País',
    'cidade estado ou pais'   : 'Cidade, Estado ou País',
    'cidade estado ou país'   : 'Cidade, Estado ou País',

    'fds'                     : 'Filme, Desenho ou Série (título real de obra audiovisual)',
    'f.d.s'                   : 'Filme, Desenho ou Série',
    'f.d.s.'                  : 'Filme, Desenho ou Série',
    'filme desenho ou serie'  : 'Filme, Desenho ou Série',
    'filme desenho ou série'  : 'Filme, Desenho ou Série',
    'filme, desenho ou série' : 'Filme, Desenho ou Série',
    'filme desenho serie'     : 'Filme, Desenho ou Série',

    'jlr'                     : 'Jornal, Livro ou Revista (título real de publicação)',
    'j.l.r'                   : 'Jornal, Livro ou Revista',
    'j.l.r.'                  : 'Jornal, Livro ou Revista',
    'jornal livro ou revista' : 'Jornal, Livro ou Revista',

    'pda'                     : 'Personagem de Desenho Animado (ex: Bob Esponja, Pato Donald)',
    'p.d.a'                   : 'Personagem de Desenho Animado',
    'p.d.a.'                  : 'Personagem de Desenho Animado',
    'personagem de desenho'   : 'Personagem de Desenho Animado',
    'personagem desenho animado': 'Personagem de Desenho Animado',

    // MSÉ / MNÉ e variações — adjetivo que descreve pessoa
    'mse'                     : 'Adjetivo que descreve uma pessoa (ex: Bonita, Chata, Divertida)',
    'msé'                     : 'Adjetivo que descreve uma pessoa',
    'ms e'                    : 'Adjetivo que descreve uma pessoa',
    'ms é'                    : 'Adjetivo que descreve uma pessoa',
    'minha sogra e'           : 'Adjetivo que descreve uma pessoa (ex: Brava, Carinhosa)',
    'minha sogra é'           : 'Adjetivo que descreve uma pessoa',
    'minha sogra e (mse)'     : 'Adjetivo que descreve uma pessoa',
    'minha sogra é (mse)'     : 'Adjetivo que descreve uma pessoa',
    'minha sogra'             : 'Adjetivo que descreve uma pessoa',

    'mne'                     : 'Adjetivo que descreve uma pessoa (ex: Bonito, Carinhoso)',
    'mné'                     : 'Adjetivo que descreve uma pessoa',
    'mn e'                    : 'Adjetivo que descreve uma pessoa',
    'mn é'                    : 'Adjetivo que descreve uma pessoa',
    'meu namorado e'          : 'Adjetivo que descreve uma pessoa',
    'meu namorado é'          : 'Adjetivo que descreve uma pessoa',
    'minha namorada e'        : 'Adjetivo que descreve uma pessoa',
    'minha namorada é'        : 'Adjetivo que descreve uma pessoa',

    'mst'                     : 'Objeto ou coisa que existe (ex: Bolsa, Carro, Dinheiro)',
    'minha sogra tem'         : 'Objeto ou coisa material (ex: Bolsa, Cadeira, Dinheiro)',

    'snb'                     : 'Bebida (ex: Cerveja, Cachaça, Vinho)',
    'seu namorado bebe'       : 'Bebida alcoólica ou não alcoólica',

    'mme'                     : 'Marca famosa de produto ou empresa',

    // Categorias por nome
    'nome'                    : 'Nome próprio de pessoa (primeiro nome, ex: Bruno, Carla)',
    'nome de pessoa'          : 'Nome próprio de pessoa',
    'nome proprio'            : 'Nome próprio de pessoa',
    'nome próprio'            : 'Nome próprio de pessoa',
    'nome feminino'           : 'Nome próprio feminino',
    'nome masculino'          : 'Nome próprio masculino',
    'sobrenome'               : 'Sobrenome de família',

    'animal'                  : 'Animal (qualquer espécie, ex: Baleia, Cobra, Pato)',
    'bicho'                   : 'Animal (qualquer espécie)',
    'fruta'                   : 'Fruta comestível (ex: Banana, Caju, Pera)',
    'fruto'                   : 'Fruta comestível',
    'cor'                     : 'Cor ou tonalidade (ex: Azul, Bege, Carmesim)',
    'cores'                   : 'Cor ou tonalidade',

    'objeto'                  : 'Objeto (coisa material, ex: Balde, Caneta, Mesa)',
    'coisa'                   : 'Objeto ou coisa material',
    'utensilio'               : 'Utensílio doméstico',
    'utensilho'               : 'Utensílio doméstico',

    'lugar'                   : 'Lugar ou local (ex: Biblioteca, Campo, Praia)',
    'local'                   : 'Lugar ou local',
    'cidade'                  : 'Nome de cidade (ex: Brasília, Curitiba, Paris)',
    'estado'                  : 'Nome de estado brasileiro',
    'pais'                    : 'Nome de país',
    'país'                    : 'Nome de país',
    'nacao'                   : 'Nome de país ou nação',
    'nação'                   : 'Nome de país ou nação',

    'profissao'               : 'Profissão ou ocupação (ex: Bombeiro, Dentista, Professor)',
    'profissão'               : 'Profissão ou ocupação',
    'ocupacao'                : 'Profissão ou ocupação',
    'ocupação'                : 'Profissão ou ocupação',

    'carro'                   : 'Marca ou modelo de carro (ex: BMW, Civic, Palio)',
    'automovel'               : 'Marca ou modelo de carro',
    'automóvel'               : 'Marca ou modelo de carro',
    'veiculo'                 : 'Veículo (carro, moto, etc.)',
    'veículo'                 : 'Veículo',
    'moto'                    : 'Marca ou modelo de motocicleta',
    'marca de carro'          : 'Marca de carro/automóvel',

    'time'                    : 'Nome de time de futebol (ex: Botafogo, Corinthians)',
    'time de futebol'         : 'Nome de time de futebol',
    'clube'                   : 'Clube ou time esportivo',
    'clube de futebol'        : 'Nome de time de futebol',

    'flor'                    : 'Nome de flor (ex: Begônia, Crisântemo, Dália)',
    'flores'                  : 'Nome de flor',
    'planta'                  : 'Nome de planta',
    'arvore'                  : 'Nome de árvore (ex: Baobá, Carvalho, Pinheiro)',
    'árvore'                  : 'Nome de árvore',

    'alimento'                : 'Alimento, comida ou bebida',
    'comida'                  : 'Comida ou prato culinário',
    'bebida'                  : 'Bebida (alcoólica ou não)',

    'musica'                  : 'Título de música real',
    'música'                  : 'Título de música real',
    'cantor'                  : 'Nome de cantor ou cantora famoso',
    'cantora'                 : 'Nome de cantora famosa',
    'banda'                   : 'Nome de banda ou grupo musical',
    'grupo musical'           : 'Nome de banda ou grupo musical',

    'ator'                    : 'Nome de ator famoso',
    'atriz'                   : 'Nome de atriz famosa',
    'ator/atriz'              : 'Nome de ator ou atriz',
    'artista'                 : 'Nome de artista famoso',

    'personagem'              : 'Nome de personagem famoso (filme, série, livro)',
    'personagem biblico'      : 'Nome de personagem da Bíblia',
    'personagem bíblico'      : 'Nome de personagem da Bíblia',
    'personagem de novela'    : 'Nome de personagem de novela brasileira',

    'filme'                   : 'Título de filme (ex: Batman, Coco, Pantera Negra)',
    'serie'                   : 'Título de série de TV (ex: Breaking Bad, Chaves)',
    'série'                   : 'Título de série de TV',
    'desenho animado'         : 'Título de desenho animado (ex: Bob Esponja, Peppa Pig)',
    'desenho'                 : 'Título de desenho animado',
    'novela'                  : 'Título de novela brasileira',
    'telenovela'              : 'Título de novela ou telenovela',
    'programa de tv'          : 'Nome de programa de televisão',
    'programa'                : 'Nome de programa de TV',
    'anime'                   : 'Título de anime japonês (ex: Bleach, Dragon Ball)',

    'esporte'                 : 'Nome de esporte (ex: Basquete, Ciclismo, Polo)',
    'esportes'                : 'Nome de esporte',
    'instrumento'             : 'Instrumento musical (ex: Bateria, Clarinete, Piano)',
    'instrumento musical'     : 'Instrumento musical',

    'doenca'                  : 'Nome de doença (ex: Bronquite, Caxumba, Pneumonia)',
    'doença'                  : 'Nome de doença',
    'remedio'                 : 'Nome de remédio ou medicamento',
    'remédio'                 : 'Nome de remédio',

    'super heroi'             : 'Nome de super-herói (ex: Batman, Capitão América)',
    'super-heroi'             : 'Nome de super-herói',
    'super herói'             : 'Nome de super-herói',
    'super-herói'             : 'Nome de super-herói',
    'heroi'                   : 'Nome de herói ou super-herói',
    'herói'                   : 'Nome de herói ou super-herói',
    'vilao'                   : 'Nome de vilão de filme, série ou HQ',
    'vilão'                   : 'Nome de vilão',

    'marca'                   : 'Marca famosa de produto ou empresa',
    'marcas'                  : 'Marca famosa',
    'marca de roupa'          : 'Marca de roupa (ex: Adidas, Colcci, Nike)',
    'roupa'                   : 'Peça de roupa (ex: Blusa, Calça, Tênis)',

    'cigarro'                 : 'Marca de cigarro (ex: Camel, Derby, Hollywood)',
    'droga'                   : 'Nome de droga (ex: Cocaína, Heroína)',

    'adjetivo'                : 'Adjetivo em português (ex: Bonito, Corajoso, Distante)',
    'substantivo'             : 'Substantivo em português',
    'verbo'                   : 'Verbo em português (ex: Brincar, Comer, Pular)',

    'bairro'                  : 'Nome de bairro (ex: Copacabana, Bela Vista, Jardins)',
    'capital'                 : 'Cidade capital de país ou estado',
    'celebridade'             : 'Nome de celebridade ou pessoa famosa',
    'famoso'                  : 'Nome de pessoa famosa',
    'santo'                   : 'Nome de santo ou santa (ex: Benedito, Clara)',
    'nome de santo'           : 'Nome de santo ou santa',
    'presidente'              : 'Nome de presidente de algum país',

    'jogo'                    : 'Nome de jogo (videogame ou tabuleiro)',
    'videogame'               : 'Nome de jogo de videogame',
    'personagem de jogo'      : 'Nome de personagem de videogame',

    'pais da europa'          : 'País da Europa',
    'país da europa'          : 'País da Europa',
    'pais da america'         : 'País das Américas',
    'pais da africa'          : 'País da África',
    'pais da asia'            : 'País da Ásia',
    'país da ásia'            : 'País da Ásia',

    'objeto escolar'          : 'Objeto de escola (ex: Borracha, Caderno, Lápis)',
    'objeto de cozinha'       : 'Utensílio de cozinha (ex: Colher, Frigideira, Panela)',
    'time de basquete'        : 'Time de basquete (ex: Boston Celtics, Chicago Bulls)',
    'time americano'          : 'Time de esporte americano (NFL, NBA)',
    'coisa amarela'           : 'Coisa de cor amarela',
    'coisa verde'             : 'Coisa de cor verde',
    'palavra'                 : 'Qualquer palavra em português',
  };

  function expandCat(raw) {
    // normaliza: minúsculo, sem acento, sem pontos/parênteses, espaço simples
    const norm = s => (s||'').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[().]/g,'').replace(/\s+/g,' ').trim();

    const k = norm(raw);

    // busca exata
    for (const [key, val] of Object.entries(CATS)) {
      if (norm(key) === k) return val;
    }
    // busca parcial
    for (const [key, val] of Object.entries(CATS)) {
      const nk = norm(key);
      if (k.includes(nk) || nk.includes(k)) return val;
    }
    return raw.trim();
  }

  /* ── detecta letra ── */
  function getLetter() {
    const SELS = ['.round-letter','[class*="round-letter"]','[class*="roundLetter"]',
      '[class*="RoundLetter"]','[class*="letter-display"]','[class*="game-letter"]',
      '[class*="current-letter"]','[class*="gameLetter"]','[class*="currentLetter"]'];
    for (const s of SELS) {
      try {
        const el = document.querySelector(s);
        if (!el) continue;
        const t = (el.innerText||'').trim();
        if (t.length===1 && /[A-Za-zÀ-ÿ]/.test(t)) return t.toUpperCase();
      } catch {}
    }
    for (const el of document.querySelectorAll('span,div,h1,h2,h3,p,b,strong')) {
      if (el.children.length>0) continue;
      const t = (el.innerText||'').trim();
      if (t.length!==1||!/[A-Za-zÀ-ÿ]/.test(t)) continue;
      if (parseFloat(getComputedStyle(el).fontSize)<20) continue;
      const r=el.getBoundingClientRect();
      if (r.width>0&&r.height>0) return t.toUpperCase();
    }
    return null;
  }

  /* ── detecta inputs + rótulos ── */
  function getPairs() {
    return [...document.querySelectorAll('input[type="text"],input:not([type])')]
      .filter(el=>{
        if(el.disabled||el.readOnly)return false;
        const r=el.getBoundingClientRect();
        return r.width>0&&r.height>0;
      })
      .map(el=>({el,cat:getLabel(el)}));
  }

  function getLabel(inp) {
    if (inp.placeholder?.trim().length>1) return inp.placeholder.trim();
    if (inp.getAttribute('aria-label')?.trim().length>1) return inp.getAttribute('aria-label').trim();
    if (inp.id) {
      const l=document.querySelector(`label[for="${CSS.escape(inp.id)}"]`);
      if (l?.innerText?.trim()) return l.innerText.trim();
    }
    let el=inp.parentElement;
    for(let i=0;i<8;i++){
      if(!el)break;
      for(const c of el.querySelectorAll('span,label,p,div,b,strong,h1,h2,h3,h4')){
        if(c===inp||c.contains(inp))continue;
        const t=(c.innerText||'').trim();
        if(t.length>1&&t.length<60&&!t.includes('\n'))return t;
      }
      el=el.parentElement;
    }
    return 'campo';
  }

  /* ── preenche tudo ── */
  async function fill(letter, pairs) {
    busy=true;
    setLetter(letter);
    setStatus('🧠 Gerando respostas...','#60a5fa');
    showList(pairs.map(p=>({cat:p.cat,ans:'...'})));
    animBar(true);
    try {
      const answers=await callGroq(letter,pairs.map(p=>p.cat));
      animBar(false);
      showList(pairs.map((p,i)=>({cat:p.cat,ans:answers[i]||'—'})));
      for(let i=0;i<pairs.length;i++){
        const{el,cat}=pairs[i];
        const ans=answers[i];
        if(!ans||el.value.trim()!=='')continue;
        await sleep(80+rnd(60));
        angularSet(el,ans);
        markDone(i);
        setStatus(`✍️ ${cat}: ${ans}`,'#4ade80');
        await sleep(60);
      }
      await sleep(200);
      pressStop();
      setStatus('✅ Pronto! Aguardando nova rodada...','#4ade80');
    } catch(e) {
      animBar(false);
      setStatus('❌ '+String(e).slice(0,55),'#f87171');
      console.error('[StopotS AI]',e);
    }
    await sleep(7000);
    busy=false; lastKey='';
  }

  function angularSet(el,value){
    const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    el.focus();
    if(s)s.call(el,value);else el.value=value;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el.blur();
  }

  function pressStop(){
    for(const el of document.querySelectorAll('button,[role="button"]')){
      const t=(el.innerText||'').trim().toUpperCase();
      if(['STOP','STOP!','PARAR','ENVIAR'].includes(t)){
        const r=el.getBoundingClientRect();
        if(r.width>0){el.click();return;}
      }
    }
    for(const s of ['[class*="stop-btn"]','[class*="stopBtn"]','button[class*="stop" i]']){
      const el=document.querySelector(s);
      if(el){el.click();return;}
    }
  }

  async function callGroq(letter, cats) {
    const expanded = cats.map(c => expandCat(c));

    const prompt =
`Você está jogando Stop (Adedonha). Letra: "${letter}".

Para cada categoria, dê UMA resposta que comece com "${letter}".
- Real e conhecida, em português brasileiro
- Máximo 3 palavras
- NÃO repetir
- Se impossível use "-"

${expanded.map((c,i)=>`${i+1}. ${c}`).join('\n')}

Responda SOMENTE JSON:
{"r":["resp1","resp2",...]}`;

    const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ_KEY}`},
      body:JSON.stringify({model:GROQ_MODEL,messages:[{role:'user',content:prompt}],max_tokens:400,temperature:0.2}),
    });
    if(!res.ok)throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0,80)}`);
    const data=await res.json();
    const reply=(data.choices?.[0]?.message?.content||'').trim();
    const match=reply.match(/\{[\s\S]*?\}/);
    if(!match)throw new Error('IA não retornou JSON');
    return(JSON.parse(match[0]).r||[]).map(a=>{
      const s=(a||'').trim();
      return(s==='-'||s==='---')?'':s;
    });
  }

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const rnd=n=>Math.floor(Math.random()*n);

  /* ── overlay ── */
  function buildUI(){
    document.getElementById('__sai__')?.remove();
    ui=document.createElement('div');
    ui.id='__sai__';
    ui.innerHTML=`
<style>
#__sai__{position:fixed!important;bottom:16px!important;right:16px!important;z-index:2147483647!important;width:265px;font-family:system-ui,sans-serif;font-size:12px}
#__sc__{background:rgba(5,3,14,.97);border:1px solid rgba(249,115,22,.4);border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.7)}
#__sh__{display:flex;align-items:center;gap:8px;padding:9px 12px;background:linear-gradient(90deg,rgba(194,65,12,.4),rgba(80,20,0,.2));border-bottom:1px solid rgba(249,115,22,.15)}
#__si__{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#ea580c,#f59e0b);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
#__st__{font-weight:700;color:#fff;letter-spacing:1px;flex:1;font-size:12px}
#__sl__{width:32px;height:32px;border-radius:8px;background:rgba(249,115,22,.2);border:1px solid rgba(249,115,22,.5);color:#fbbf24;font-size:19px;font-weight:700;display:flex;align-items:center;justify-content:center}
#__sx__{background:none;border:none;color:rgba(255,255,255,.25);cursor:pointer;font-size:15px;padding:0;line-height:1}
#__sx__:hover{color:#f87171}
#__sb__{padding:9px 12px 11px;display:flex;flex-direction:column;gap:5px}
#__ss__{font-size:11.5px;font-weight:600;color:#4ade80;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .3s}
#__sr__{display:flex;flex-direction:column;gap:2px;max-height:130px;overflow-y:auto}
.row{display:flex;gap:5px;padding:2px 0;font-size:10.5px}
.cat{flex:1;color:rgba(200,180,230,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ans{color:#fbbf24;font-weight:600;min-width:60px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .3s}
.ans.ok{color:#4ade80}
#__sbw__{height:2px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}
#__sbp__{height:100%;width:0%;background:linear-gradient(90deg,#ea580c,#fbbf24);border-radius:2px;transition:width .15s linear}
#__sbt__{background:rgba(249,115,22,.15);border:1px solid rgba(249,115,22,.4);border-radius:7px;color:#fb923c;font-size:11px;font-weight:600;padding:6px;cursor:pointer;text-align:center;transition:background .2s}
#__sbt__:hover{background:rgba(249,115,22,.3)}
</style>
<div id="__sc__">
  <div id="__sh__">
    <div id="__si__">🛑</div>
    <span id="__st__">STOPOTS AI</span>
    <div id="__sl__">?</div>
    <button id="__sx__">✕</button>
  </div>
  <div id="__sb__">
    <div id="__ss__">🟢 Ativo — aguardando rodada...</div>
    <div id="__sr__"></div>
    <div id="__sbw__"><div id="__sbp__"></div></div>
    <button id="__sbt__">⚡ Preencher Agora</button>
  </div>
</div>`;
    document.body.appendChild(ui);
    document.getElementById('__sx__').onclick=()=>{ui?.remove();ui=null;};
    document.getElementById('__sbt__').onclick=()=>{busy=false;lastKey='';doTick();};
    setInterval(()=>{
      const l=getLetter();
      const el=document.getElementById('__sl__');
      if(el)el.textContent=l||'?';
    },900);
  }

  function setStatus(msg,color='#4ade80'){const el=document.getElementById('__ss__');if(el){el.textContent=msg;el.style.color=color;}}
  function setLetter(l){const el=document.getElementById('__sl__');if(el)el.textContent=l||'?';}
  function showList(items){
    const el=document.getElementById('__sr__');if(!el)return;
    el.innerHTML=items.map(({cat,ans},i)=>
      `<div class="row"><span class="cat">${cat}</span><span class="ans" id="__a${i}__">${ans}</span></div>`
    ).join('');
  }
  function markDone(i){const el=document.getElementById(`__a${i}__`);if(el)el.classList.add('ok');}
  let barT=null;
  function animBar(on){
    const b=document.getElementById('__sbp__');if(!b)return;
    clearInterval(barT);
    if(on){let w=5;b.style.width='5%';barT=setInterval(()=>{w=Math.min(w+1.2,88);b.style.width=w+'%';},80);}
    else b.style.width='0%';
  }

})();
