/* CLAW — background.js v20 | Emanuel Felipe
   · Proxy Groq
   · Agente IA livre — planeja e executa no Chrome
   · Re-injeta scripts
*/
'use strict';

const KEY = 'SUA_CHAVE_API_GROQ_AQUI';

const MODELS = {
  AGENT:     'llama-3.3-70b-versatile',
  TRANSLATE: 'meta-llama/llama-4-scout-17b-16e-instruct',
  VISION:    'meta-llama/llama-4-scout-17b-16e-instruct',
  REASON:    'openai/gpt-oss-120b',
  CREATIVE:  'llama-3.3-70b-versatile',
};

/* ════ SYSTEM PROMPT ══════════════════════════════════════ */
const SYS = `Você é o Claw, agente de IA que controla o Google Chrome.

REGRA: Responda APENAS com JSON válido. Nada fora do JSON.

FORMATO:
{
  "thought": "raciocínio interno (breve)",
  "reply": "mensagem ao usuário em português",
  "steps": [
    { "action": "nome_da_acao", "args": [...], "wait": 0 }
  ]
}

REGRAS CRÍTICAS:
1. Para abrir sites use "openTab" (NÃO "navigate" — navigate recarrega a aba atual)
2. Para pesquisar use openTab com URL do Google/YouTube
3. Para interagir com elementos DA PÁGINA ATUAL use as outras ações
4. "wait" em ms — use 1500 após navigate/openTab para aguardar carregamento
5. Se for só conversa/pergunta: steps = []

AÇÕES DISPONÍVEIS:

NAVEGAÇÃO:
openTab(url)         → abre URL em nova aba (use para sites, não recarrega a aba atual)
navigate(url)        → navega na aba atual (use só quando quiser sair da página atual)
back()               → voltar
forward()            → avançar
reload()             → recarregar
scrollTo(y)          → rolar para y pixels
scrollBy(dy)         → rolar dy pixels (positivo=baixo, negativo=cima)
scrollTop()          → ir ao topo
scrollBottom()       → ir ao fim

INTERAÇÃO:
click(desc)          → clicar em elemento (busca por texto, aria-label, placeholder, id, css)
clickAt(x,y)         → clicar em coordenadas
dblclick(desc)       → duplo clique
rightclick(desc)     → clique direito
hover(desc)          → hover
focus(desc)          → focar
type(desc,value)     → digitar valor em input/textarea
typeKeys(text)       → digitar no elemento focado
append(desc,text)    → adicionar texto a um input existente
clear(desc)          → limpar input
pressKey(key)        → pressionar tecla (Enter, Tab, Escape, ArrowDown, F5...)
hotkey(keys)         → atalho ex: "ctrl+a", "ctrl+c", "ctrl+v"
submit(desc?)        → submeter formulário
select(desc,value)   → escolher opção em <select>
check(desc,bool)     → marcar/desmarcar checkbox
fillForm(obj)        → preencher múltiplos campos: {"campo1":"valor1","campo2":"valor2"}

LEITURA:
getText(desc)        → texto de um elemento
getPageText()        → texto completo da página
getTitle()           → título
getUrl()             → URL atual
getAttr(desc,attr)   → atributo HTML
countElements(sel)   → contar por seletor CSS
extractLinks()       → todos os links
extractImages()      → todas as imagens
extractTable(desc?)  → tabela como texto
extractInputs()      → todos os inputs
getPageInfo()        → info completa da página (url,title,inputs,links...)

DOM:
injectCSS(css)       → injetar CSS
removeCSS()          → remover CSS injetado
injectScript(code)   → executar JavaScript
removeElement(desc)  → remover elemento
hideElement(desc)    → ocultar
showElement(desc)    → mostrar
setAttribute(d,a,v)  → setar atributo
setStyle(d,prop,val) → setar estilo
highlight(desc)      → destacar com borda laranja (3s)

UTILIDADES:
copyText(text)       → copiar para clipboard
pasteText()          → ler clipboard
setStorage(k,v)      → localStorage
getStorage(k)        → ler localStorage
showNotification(msg,type) → notificação (info/success/warning/error)
wait(ms)             → aguardar ms milissegundos

EXEMPLOS:
"abre youtube" → [{"action":"openTab","args":["https://youtube.com"]}]
"pesquisa bolo" → [{"action":"openTab","args":["https://google.com/search?q=bolo"]}]
"clica em Login" → [{"action":"click","args":["Login"]}]
"digita meu email" → [{"action":"type","args":["email","meu@email.com"]}]
"extrai links" → [{"action":"extractLinks","args":[]}]
"remove anúncios" → [{"action":"injectCSS","args":["[class*='ad'],[id*='ad'],[class*='banner'],[class*='popup']{display:none!important}"]}]
"rola para baixo" → [{"action":"scrollBy","args":[400]}]
"preenche form" → [{"action":"fillForm","args":[{"nome":"Emanuel","email":"e@g.com"}]},{"action":"submit","args":[]}]`;

/* ════ SITES ══════════════════════════════════════════════ */
const SITES = {
  'youtube':'https://youtube.com','instagram':'https://instagram.com',
  'twitter':'https://twitter.com','x':'https://x.com',
  'tiktok':'https://tiktok.com','facebook':'https://facebook.com',
  'whatsapp':'https://web.whatsapp.com','telegram':'https://web.telegram.org',
  'discord':'https://discord.com/app','reddit':'https://reddit.com',
  'linkedin':'https://linkedin.com','twitch':'https://twitch.tv',
  'gmail':'https://mail.google.com','drive':'https://drive.google.com',
  'google drive':'https://drive.google.com','docs':'https://docs.google.com',
  'sheets':'https://sheets.google.com','slides':'https://slides.google.com',
  'forms':'https://forms.google.com','meet':'https://meet.google.com',
  'maps':'https://maps.google.com','calendar':'https://calendar.google.com',
  'translate':'https://translate.google.com','notion':'https://notion.so',
  'github':'https://github.com','figma':'https://figma.com',
  'netflix':'https://netflix.com','prime':'https://primevideo.com',
  'disney':'https://disneyplus.com','disney+':'https://disneyplus.com',
  'spotify':'https://open.spotify.com','globoplay':'https://globoplay.globo.com',
  'max':'https://max.com','crunchyroll':'https://crunchyroll.com',
  'chatgpt':'https://chatgpt.com','claude':'https://claude.ai',
  'gemini':'https://gemini.google.com','perplexity':'https://perplexity.ai',
  'amazon':'https://amazon.com.br','shopee':'https://shopee.com.br',
  'mercado livre':'https://mercadolivre.com.br','ml':'https://mercadolivre.com.br',
  'ifood':'https://ifood.com.br','nubank':'https://nubank.com.br',
  'google':'https://google.com','bing':'https://bing.com',
  'wikipedia':'https://pt.wikipedia.org','duolingo':'https://duolingo.com',
  'brainly':'https://brainly.com.br','kahoot':'https://kahoot.it',
  'stopots':'https://stopots.com','canva':'https://canva.com',
  'trello':'https://trello.com','slack':'https://slack.com',
  'zoom':'https://zoom.us','steam':'https://store.steampowered.com',
  'magalu':'https://magazineluiza.com.br','aliexpress':'https://aliexpress.com',
  'pinterest':'https://pinterest.com','bluesky':'https://bsky.app',
  'deezer':'https://deezer.com','outlook':'https://outlook.live.com',
  'onedrive':'https://onedrive.live.com','keep':'https://keep.google.com',
  'classroom':'https://classroom.google.com','rappi':'https://rappi.com.br',
  'airbnb':'https://airbnb.com.br','booking':'https://booking.com',
  'g1':'https://g1.globo.com','uol':'https://uol.com.br',
  'americanas':'https://americanas.com.br','casas bahia':'https://casasbahia.com.br',
  'shein':'https://shein.com.br','kick':'https://kick.com',
};

const E = encodeURIComponent;

/* ════ GROQ ════════════════════════════════════════════════ */
async function callGroq(model, messages, maxTokens=2048, temp=0.15) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method : 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${KEY}` },
    body   : JSON.stringify({ model, messages, max_tokens:maxTokens, temperature:temp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  return data.choices?.[0]?.message?.content?.trim() || '';
}

/* ════ PARSE RÁPIDO (sem IA) ═══════════════════════════════ */
function quickParse(text) {
  const low = text.toLowerCase().trim();

  // Abre múltiplos sites
  const openRx = /^(?:abr[ae]r?|vai|acessa|entra|ir para|vai para)\s+(.+)/i;
  const openM  = low.match(openRx);
  if (openM) {
    const parts = openM[1].split(/\s+e\s+|\s*,\s*/i).map(s=>s.trim());
    const urls  = parts.map(p=>{
      const url = SITES[p];
      if (url) return url;
      if (/^https?:\/\//i.test(p)) return p;
      if (/^www\./i.test(p)) return 'https://'+p;
      return null;
    }).filter(Boolean);
    if (urls.length > 0) {
      return {
        reply: urls.length===1 ? `Abrindo ${parts[0]}...` : `Abrindo ${urls.length} sites!`,
        steps: urls.map(url=>({action:'openTab',args:[url]}))
      };
    }
  }

  // Site direto
  const directUrl = SITES[low];
  if (directUrl) return { reply:`Abrindo ${low}...`, steps:[{action:'openTab',args:[directUrl]}] };

  // URL direta
  if (/^https?:\/\//i.test(low)) return { reply:`Abrindo ${low}...`, steps:[{action:'openTab',args:[low]}] };

  // YouTube
  const ytM = low.match(/^(?:youtube|coloca|toca|play)\s+(.+?)(?:\s+no youtube)?$/i);
  if (ytM) {
    const q = ytM[1].trim();
    return { reply:`YouTube: "${q}"`, steps:[{action:'openTab',args:[`https://youtube.com/results?search_query=${E(q)}`]}] };
  }

  // Pesquisa em site específico
  const inM = low.match(/^(?:pesquisa|busca|procura)\s+(.+?)\s+n[ao]\s+(.+)/i);
  if (inM) {
    const q=inM[1].trim(), site=inM[2].trim();
    const eng = {
      youtube:  q=>`https://youtube.com/results?search_query=${E(q)}`,
      google:   q=>`https://google.com/search?q=${E(q)}`,
      amazon:   q=>`https://amazon.com.br/s?k=${E(q)}`,
      shopee:   q=>`https://shopee.com.br/search?keyword=${E(q)}`,
      'mercado livre':q=>`https://lista.mercadolivre.com.br/${E(q)}`,
      github:   q=>`https://github.com/search?q=${E(q)}`,
      wikipedia:q=>`https://pt.wikipedia.org/wiki/Special:Search?search=${E(q)}`,
    };
    const fn = eng[site]||eng[site.split(' ')[0]];
    if (fn) return { reply:`Pesquisando "${q}" no ${site}...`, steps:[{action:'openTab',args:[fn(q)]}] };
  }

  // Pesquisa geral
  const srM = low.match(/^(?:pesquisa|busca|procura|googla|google)\s+(.+)/i);
  if (srM) {
    const q = srM[1].trim();
    return { reply:`Pesquisando "${q}"...`, steps:[{action:'openTab',args:[`https://google.com/search?q=${E(q)}`]}] };
  }

  return null; // precisa da IA
}

/* ════ INJETA AGENTE E ESPERA ═════════════════════════════ */
async function injectAgent(tabId) {
  await chrome.scripting.executeScript({ target:{tabId}, files:['ai_agent.js'] });
  await new Promise(r=>setTimeout(r,150));
}

/* ════ LÊ CONTEXTO DA PÁGINA ═════════════════════════════ */
async function readPage(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url?.startsWith('chrome')||tab.url?.startsWith('about')) {
      return { url:tab.url, title:tab.title||'', text:'', inputs:'', links:'', forms:0 };
    }
    await injectAgent(tabId);
    return await Promise.race([
      new Promise(resolve=>{
        chrome.tabs.sendMessage(tabId,{type:'AGENT_READ'},r=>{
          resolve(r||{url:tab.url,title:tab.title||'',text:'',inputs:'',links:'',forms:0});
        });
      }),
      new Promise(r=>setTimeout(()=>r({url:tab.url,title:tab.title||'',text:'',inputs:'',links:'',forms:0}),2000))
    ]);
  } catch(e) {
    return {url:'',title:'',text:'',inputs:'',links:'',forms:0};
  }
}

/* ════ EXECUTA STEPS ═════════════════════════════════════ */
async function execSteps(steps, tabId) {
  const results = [];

  for (const step of (steps||[])) {
    const { action, args=[], wait=0 } = step;

    try {
      /* openTab — abre nova aba */
      if (action === 'openTab') {
        let url = args[0]||'https://google.com';
        if (!url.startsWith('http')) url = 'https://'+url;
        const newTab = await chrome.tabs.create({url, active:true});
        results.push(`✓ Aberto: ${url}`);
        if (wait>0) await new Promise(r=>setTimeout(r,wait));
        // Atualiza tabId para a nova aba nas próximas ações
        tabId = newTab.id;
        continue;
      }

      /* navigate — muda URL da aba atual */
      if (action === 'navigate') {
        let url = args[0]||'';
        if (url.startsWith('chrome://')||url.startsWith('about:')) {
          results.push(`⚠️ URL bloqueada: ${url}`);
          continue;
        }
        if (!url.startsWith('http')) url = 'https://'+url;
        await chrome.tabs.update(tabId, {url});
        // Aguarda a página carregar
        await new Promise(resolve=>{
          const timeout = setTimeout(()=>resolve(), Math.max(wait||0, 1500));
          const listener = (updTabId, info) => {
            if (updTabId===tabId && info.status==='complete') {
              clearTimeout(timeout);
              chrome.tabs.onUpdated.removeListener(listener);
              setTimeout(resolve, 300);
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        });
        results.push(`✓ Navegando: ${url}`);
        continue;
      }

      /* Outras ações — executa via ai_agent.js na aba */
      const tab = await chrome.tabs.get(tabId);
      if (tab.url?.startsWith('chrome')||tab.url?.startsWith('about')) {
        results.push(`⚠️ "${action}" não disponível nesta página`);
        continue;
      }

      await injectAgent(tabId);

      const result = await Promise.race([
        new Promise(resolve=>{
          chrome.tabs.sendMessage(tabId,{type:'AGENT_ACTION',action,args},r=>{
            if (chrome.runtime.lastError) resolve(`❌ ${chrome.runtime.lastError.message}`);
            else resolve(r?.result||`✓ ${action}`);
          });
        }),
        new Promise(r=>setTimeout(()=>r(`⏱ ${action} (timeout)`),6000))
      ]);

      results.push(result);
      if (wait>0) await new Promise(r=>setTimeout(r,wait));

    } catch(e) {
      results.push(`❌ ${action}: ${e.message}`);
    }
  }

  return results;
}

/* ════ AGENTE PRINCIPAL ══════════════════════════════════ */
async function runAgent(userText, tabId, sendResponse) {
  try {
    // 1. Tenta parse rápido sem IA
    const quick = quickParse(userText);
    if (quick) {
      const results = await execSteps(quick.steps, tabId);
      sendResponse({ok:true, reply:quick.reply, results});
      return;
    }

    // 2. Lê contexto da página
    const ctx = await readPage(tabId);

    // 3. Monta prompt com contexto
    const contextStr = [
      `URL: ${ctx.url||'(nova aba)'}`,
      `Título: ${ctx.title||''}`,
      ctx.inputs ? `Inputs:\n${ctx.inputs}` : '',
      ctx.text   ? `Texto da página:\n${ctx.text.slice(0,1000)}` : '',
      `\nPedido: ${userText}`,
    ].filter(Boolean).join('\n');

    // 4. Chama IA
    const raw = await callGroq(MODELS.AGENT, [
      { role:'system', content:SYS },
      { role:'user',   content:contextStr }
    ]);

    // 5. Parse JSON
    let plan = { reply:'Feito!', steps:[] };
    try {
      const clean = raw
        .replace(/<think>[\s\S]*?<\/think>/gi, '') // remove think do DeepSeek
        .replace(/```json\n?|\n?```/g, '')
        .trim();
      const match = clean.match(/\{[\s\S]*\}/);
      plan = JSON.parse(match?.[0] || clean);
    } catch(e) {
      // IA retornou texto puro, não JSON — trata como resposta
      plan = { reply: raw.replace(/<think>[\s\S]*?<\/think>/gi,'').trim(), steps:[] };
    }

    // 6. Executa
    const results = await execSteps(plan.steps||[], tabId);

    sendResponse({ ok:true, reply:plan.reply||'Feito!', results });

  } catch(e) {
    sendResponse({ ok:false, reply:`❌ ${e.message}`, results:[] });
  }
}

/* ════ LISTENERS ══════════════════════════════════════════ */
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === 'PING') { reply({ok:true}); return false; }

  /* Proxy Groq — todos os scripts usam isso */
  if (msg.type === 'GROQ_FETCH') {
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method : 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${msg.key||KEY}` },
      body   : JSON.stringify(msg.payload),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) reply({ok:false, error:data?.error?.message||`HTTP ${res.status}`});
      else         reply({ok:true,  data});
    }).catch(err => reply({ok:false, error:err.message}));
    return true;
  }

  /* Agente IA livre */
  if (msg.type === 'AGENT_RUN') {
    chrome.tabs.query({active:true, currentWindow:true}, ([tab]) => {
      if (!tab) { reply({ok:false, reply:'❌ Nenhuma aba ativa', results:[]}); return; }
      runAgent(msg.text||'', tab.id, reply);
    });
    return true;
  }
});

/* ════ RE-INJETA SCRIPTS ══════════════════════════════════ */
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== 'complete') return;
  if (!tab.url || tab.url.startsWith('chrome') || tab.url.startsWith('about')) return;

  chrome.storage.sync.get(['tr_on','tr_lang','summarize_on','explain_on','anti_on'], d => {
    const inj = (files, m) => {
      chrome.scripting.executeScript({target:{tabId}, files}, () => {
        if (chrome.runtime.lastError) return;
        chrome.tabs.sendMessage(tabId, m, () => void chrome.runtime.lastError);
      });
    };
    if (d.tr_on)                       inj(['translator.js'],  {type:'TR_ON',    lang:d.tr_lang||'auto'});
    if (d.summarize_on||d.explain_on)  inj(['page_tools.js'],  {type:'TOOLS_ON', summarize:d.summarize_on, explain:d.explain_on});
    if (d.anti_on)                     inj(['anti_detect.js'], {type:'ANTI_ON'});
  });
});

chrome.runtime.onInstalled.addListener(() => console.log('[Claw] v20 instalado'));

/* ═══ v23 — STUDY MODE RELAY ═══ */
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if(msg.type === 'STUDY_TOGGLE'){
    chrome.tabs.query({active:true, currentWindow:true}, ([tab]) => {
      if(!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, {type:'STUDY_TOGGLE'}, res => {
        void chrome.runtime.lastError;
      });
    });
    return false;
  }
});
