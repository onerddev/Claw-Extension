/* CLAW Plugin — YouTube v23 */
(function(){
'use strict';
if(window.__clawYT__) return;
window.__clawYT__ = true;
if(!location.hostname.includes('youtube.com')) return;

const KEY = 'SUA_CHAVE_API_GROQ_AQUI';
const MODEL = 'llama-3.3-70b-versatile';

function waitForVideo(cb){
  const check = () => {
    const title = document.querySelector('h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata yt-formatted-string, #title h1');
    if(title) cb();
    else setTimeout(check, 1500);
  };
  check();
}

function injectBar(){
  if(document.getElementById('__claw_yt_bar__')) return;
  const target = document.querySelector('#above-the-fold, #info-contents, #meta');
  if(!target) return;

  const bar = document.createElement('div');
  bar.id = '__claw_yt_bar__';
  bar.style.cssText = `
    display:flex;gap:6px;padding:8px 0;margin:4px 0;flex-wrap:wrap;
  `;
  const btnStyle = `background:#2a2a2f;border:1px solid #38383f;border-radius:8px;color:#b4b4be;
    font-size:11px;padding:5px 12px;cursor:pointer;font-family:Inter,system-ui,sans-serif;
    transition:background .15s;`;
  
  const actions = [
    { icon: '▸', label: 'Resumir vídeo', action: 'summarize' },
    { icon: '▸', label: 'Momentos importantes', action: 'moments' },
    { icon: '▸', label: 'Explicar conteúdo', action: 'explain' },
  ];

  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.style.cssText = btnStyle;
    btn.textContent = `${a.icon} ${a.label}`;
    btn.onmouseover = () => { btn.style.background = '#38383f'; btn.style.color = '#ececec'; };
    btn.onmouseout = () => { btn.style.background = '#2a2a2f'; btn.style.color = '#b4b4be'; };
    btn.onclick = () => ytAction(a.action);
    bar.appendChild(btn);
  });

  target.insertBefore(bar, target.firstChild);
}

async function ytAction(action){
  const title = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string, h1.ytd-watch-metadata yt-formatted-string, #title h1')?.textContent?.trim() || 'vídeo';
  const desc = document.querySelector('#description-inline-expander, #description, ytd-text-inline-expander')?.textContent?.trim()?.slice(0, 2000) || '';
  // Try to get transcript/captions
  const transcript = getVisibleComments().slice(0, 1000);

  const context = `Título: ${title}\nDescrição: ${desc}\nComentários/contexto: ${transcript}`;

  const prompts = {
    summarize: `Resuma este vídeo do YouTube em português brasileiro com bullet points:\n\n${context}`,
    moments: `Baseado neste vídeo do YouTube, liste os momentos mais importantes que provavelmente são abordados. Em português brasileiro.\n\n${context}`,
    explain: `Explique o conteúdo deste vídeo do YouTube de forma simples, como para um estudante. Em português brasileiro.\n\n${context}`,
  };

  showYTPanel(`Analisando "${title}"...`);

  try {
    const result = await callGroq(prompts[action]);
    showYTPanel(result, title);
  } catch(err){
    showYTPanel('✗ ' + (err.message || 'Erro'), title);
  }
}

function getVisibleComments(){
  return [...document.querySelectorAll('#content-text')]
    .slice(0, 5)
    .map(c => c.textContent.trim())
    .join('\n');
}

function showYTPanel(content, title){
  let panel = document.getElementById('__claw_yt_panel__');
  if(!panel){
    panel = document.createElement('div');
    panel.id = '__claw_yt_panel__';
    panel.style.cssText = `
      position:fixed;top:80px;right:20px;z-index:2147483647;
      width:340px;max-height:60vh;background:#1a1a1e;border:1px solid #38383f;
      border-radius:13px;box-shadow:0 16px 48px rgba(0,0,0,.7);
      font-family:Inter,system-ui,sans-serif;overflow:hidden;display:flex;flex-direction:column;
    `;
    document.body.appendChild(panel);
  }
  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#212124;border-bottom:1px solid #38383f;">
      <span style="font-size:12px;font-weight:600;color:#ececec;">▸ Claw · YouTube</span>
      <button onclick="this.closest('#__claw_yt_panel__').remove()" style="margin-left:auto;background:none;border:none;color:#72727e;cursor:pointer;font-size:14px;">✕</button>
    </div>
    <div style="padding:12px 14px;color:#ececec;font-size:12px;line-height:1.7;overflow-y:auto;flex:1;white-space:pre-wrap;">
      ${content}
    </div>
  `;
}

function callGroq(prompt){
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'GROQ_FETCH', key: KEY,
      payload: { model: MODEL, messages: [{ role: 'user', content: prompt.slice(0, 4000) }], max_tokens: 800, temperature: 0.2 }
    }, res => {
      if(chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if(!res?.ok) return reject(new Error(res?.error || 'Erro'));
      resolve(res.data?.choices?.[0]?.message?.content?.trim() || '');
    });
  });
}

// Observa navegação SPA do YouTube
let lastUrl = location.href;
new MutationObserver(() => {
  if(location.href !== lastUrl){
    lastUrl = location.href;
    if(location.pathname === '/watch') setTimeout(() => waitForVideo(injectBar), 2000);
  }
}).observe(document.body, { childList: true, subtree: true });

if(location.pathname === '/watch') waitForVideo(injectBar);

})();
