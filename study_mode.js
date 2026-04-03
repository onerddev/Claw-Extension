/* CLAW — study_mode.js v23 | Modo Estudo — sem emojis, com SVG icons */
(function(){
'use strict';
if(window.__clawStudy__) return;
window.__clawStudy__ = true;

const KEY = 'SUA_CHAVE_API_GROQ_AQUI';
const MODEL = 'llama-3.3-70b-versatile';
let active = false;
let panelEl = null;
let highlights = [];

const ICONS = {
  summary: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  question: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  target: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  book: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e8915a" stroke-width="2" stroke-linecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

chrome.runtime.onMessage.addListener((msg, _, reply) => {
  if(msg.type === 'STUDY_ON' || msg.type === 'STUDY_TOGGLE') {
    if(active) deactivate(); else activate();
    reply({ok:true, active});
  }
  if(msg.type === 'STUDY_OFF') { deactivate(); reply({ok:true}); }
  if(msg.type === 'STUDY_STATUS') { reply({active}); }
  return false;
});

function activate(){
  if(active) return;
  active = true;
  showPanel();
  highlightDifficultWords();
}

function deactivate(){
  active = false;
  if(panelEl) { panelEl.remove(); panelEl = null; }
  highlights.forEach(h => {
    if(h.parentNode) {
      const text = document.createTextNode(h.textContent);
      h.parentNode.replaceChild(text, h);
    }
  });
  highlights = [];
}

function showPanel(){
  if(panelEl) panelEl.remove();

  const css = document.createElement('style');
  css.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    #__claw_study__ *{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',-apple-system,sans-serif}
  `;
  document.head.appendChild(css);

  panelEl = document.createElement('div');
  panelEl.id = '__claw_study__';
  panelEl.style.cssText = `
    position:fixed!important;top:20px!important;right:20px!important;z-index:2147483647!important;
    width:330px;max-height:70vh;background:#18181b;border:1px solid rgba(255,255,255,.08);
    border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.6);
    font-family:'Inter',-apple-system,sans-serif;
    display:flex;flex-direction:column;overflow:hidden;
  `;
  panelEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:14px 16px;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.06);">
      <span style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#f4f4f5;letter-spacing:-.3px;">
        ${ICONS.book} Modo Estudo
      </span>
      <span style="margin-left:auto;font-size:10px;color:#52525b;font-weight:500;">v23</span>
      <button id="__cstudy_x__" style="background:none;border:none;color:#52525b;cursor:pointer;padding:4px;border-radius:6px;display:flex;transition:color .15s;">
        ${ICONS.close}
      </button>
    </div>
    <div style="display:flex;gap:6px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.04);">
      <button class="__cstudy_btn__" data-action="summary">${ICONS.summary} Resumo</button>
      <button class="__cstudy_btn__" data-action="questions">${ICONS.question} Perguntas</button>
      <button class="__cstudy_btn__" data-action="keypoints">${ICONS.target} Pontos-chave</button>
    </div>
    <div id="__cstudy_body__" style="padding:14px 16px;color:#a1a1aa;font-size:12px;line-height:1.7;overflow-y:auto;flex:1;min-height:80px;font-weight:400;">
      Selecione uma ação acima ou passe o mouse sobre palavras destacadas para ver significados.
    </div>
  `;
  document.body.appendChild(panelEl);

  const btnStyle = `display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.08);border-radius:8px;color:#a1a1aa;
    font-size:11px;font-weight:500;padding:5px 10px;cursor:pointer;font-family:inherit;transition:all .15s;`;
  panelEl.querySelectorAll('.__cstudy_btn__').forEach(b => {
    b.style.cssText = btnStyle;
    b.onmouseover = () => { b.style.background = 'rgba(204,120,50,.1)'; b.style.borderColor = 'rgba(204,120,50,.25)'; b.style.color = '#e8915a'; };
    b.onmouseout = () => { b.style.background = 'rgba(255,255,255,.04)'; b.style.borderColor = 'rgba(255,255,255,.08)'; b.style.color = '#a1a1aa'; };
    b.onclick = () => runAction(b.dataset.action);
  });

  document.getElementById('__cstudy_x__').onclick = deactivate;
}

async function runAction(action){
  const body = document.getElementById('__cstudy_body__');
  if(!body) return;
  body.style.color = '#52525b';
  body.style.fontStyle = 'italic';
  body.textContent = 'Analisando...';

  const text = getPageContent();
  const prompts = {
    summary: `Resuma o conteúdo abaixo em português brasileiro, de forma clara e concisa. Use bullet points com "•".\n\n${text}`,
    questions: `Crie 5 perguntas de estudo baseadas no conteúdo abaixo. Em português brasileiro. Numere as perguntas.\n\n${text}`,
    keypoints: `Extraia os 5 pontos-chave mais importantes do conteúdo abaixo. Em português brasileiro. Use "→" para cada ponto.\n\n${text}`,
  };

  try {
    const result = await callGroq(prompts[action] || prompts.summary);
    body.style.cssText = 'padding:14px 16px;color:#e4e4e7;font-style:normal;font-size:12px;line-height:1.8;overflow-y:auto;flex:1;white-space:pre-wrap;font-weight:400;';
    body.textContent = result;
  } catch(err) {
    body.style.color = '#ef4444';
    body.style.fontStyle = 'normal';
    body.textContent = 'Erro: ' + (err.message || 'Falha');
  }
}

function highlightDifficultWords(){
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const tag = node.parentElement?.tagName;
      if(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE'].includes(tag)) return NodeFilter.FILTER_REJECT;
      if(node.parentElement?.closest('#__claw_study__,#__claw_panel__,#__claw_fab__')) return NodeFilter.FILTER_REJECT;
      if(node.textContent.trim().length < 3) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const difficultWords = [];
  const seen = new Set();
  let node;
  while(node = walker.nextNode()){
    const words = node.textContent.match(/[a-záàâãéêíóôõúçA-Z]{7,}/g) || [];
    words.forEach(w => {
      if(!seen.has(w.toLowerCase()) && w.length >= 8) {
        seen.add(w.toLowerCase());
        difficultWords.push(w);
      }
    });
  }

  difficultWords.slice(0, 15).forEach(word => {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    const walker2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while(n = walker2.nextNode()){
      if(n.parentElement?.closest('#__claw_study__,#__claw_panel__,#__claw_fab__,script,style')) continue;
      if(regex.test(n.textContent)){
        try {
          const span = document.createElement('span');
          span.style.cssText = 'background:rgba(204,120,50,.12);border-bottom:1px dashed rgba(204,120,50,.5);cursor:help;border-radius:2px;padding:0 1px;';
          span.textContent = word;
          span.title = 'Clique para definição';
          span.onclick = async (e) => {
            e.stopPropagation();
            const def = await callGroq(`Defina "${word}" em uma frase curta em português brasileiro.`);
            span.title = def;
            showWordTooltip(span, word, def);
          };
          const idx = n.textContent.indexOf(word);
          if(idx >= 0){
            const before = n.textContent.slice(0, idx);
            const after = n.textContent.slice(idx + word.length);
            const parent = n.parentNode;
            const frag = document.createDocumentFragment();
            if(before) frag.appendChild(document.createTextNode(before));
            frag.appendChild(span);
            if(after) frag.appendChild(document.createTextNode(after));
            parent.replaceChild(frag, n);
            highlights.push(span);
          }
          return;
        } catch {}
        break;
      }
    }
  });
}

function showWordTooltip(el, word, definition){
  const existing = document.getElementById('__claw_wordtip__');
  if(existing) existing.remove();

  const tip = document.createElement('div');
  tip.id = '__claw_wordtip__';
  const rect = el.getBoundingClientRect();
  tip.style.cssText = `
    position:fixed;left:${rect.left}px;top:${rect.top - 54}px;z-index:2147483647;
    background:#18181b;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 14px;
    font-size:12px;color:#e4e4e7;max-width:260px;
    box-shadow:0 8px 24px rgba(0,0,0,.5);
    font-family:'Inter',-apple-system,sans-serif;line-height:1.5;
  `;
  tip.innerHTML = `<strong style="color:#e8915a;font-weight:600">${word}</strong><br/><span style="color:#a1a1aa">${definition}</span>`;
  document.body.appendChild(tip);
  setTimeout(() => tip.remove(), 6000);
}

function getPageContent(){
  try {
    const clone = document.body.cloneNode(true);
    ['script','style','noscript','iframe','#__claw_study__','#__claw_panel__','#__claw_fab__'].forEach(s => {
      clone.querySelectorAll(s).forEach(el => el.remove());
    });
    return (clone.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 3000);
  } catch { return ''; }
}

function callGroq(prompt){
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'GROQ_FETCH', key: KEY,
      payload: { model: MODEL, messages: [{ role: 'user', content: prompt.slice(0, 4000) }], max_tokens: 600, temperature: 0.2 }
    }, res => {
      if(chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if(!res?.ok) return reject(new Error(res?.error || 'Erro'));
      resolve(res.data?.choices?.[0]?.message?.content?.trim() || '');
    });
  });
}

})();
