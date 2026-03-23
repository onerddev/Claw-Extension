/* CLAW — background.js v18 | Emanuel Felipe
   Proxy de API: popup envia mensagem → background faz o fetch → retorna resultado
   Necessário porque o Chrome bloqueia fetch de API keys em popups.
*/
'use strict';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Claw] v18 instalado.');
});

/* ── PROXY DE API GROQ ── */
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === 'PING') {
    reply({ ok: true });
    return false;
  }

  if (msg.type === 'GROQ_FETCH') {
    /* popup pede fetch → background executa → retorna resultado */
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${msg.key}`,
      },
      body: JSON.stringify(msg.payload),
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        reply({ ok: false, error: data?.error?.message || `HTTP ${res.status}` });
      } else {
        reply({ ok: true, data });
      }
    })
    .catch(err => {
      reply({ ok: false, error: err.message || 'Erro de rede' });
    });
    return true; /* mantém canal aberto para resposta async */
  }
});

/* ── RE-INJETA SCRIPTS QUANDO TAB CARREGA ── */
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== 'complete') return;
  if (!tab.url || tab.url.startsWith('chrome') || tab.url.startsWith('about')) return;

  chrome.storage.sync.get(['tr_on','tr_lang','summarize_on','explain_on','anti_on'], d => {
    const inject = (files, msg) => {
      chrome.scripting.executeScript({ target: { tabId }, files }, () => {
        if (chrome.runtime.lastError) return;
        chrome.tabs.sendMessage(tabId, msg, () => void chrome.runtime.lastError);
      });
    };
    if (d.tr_on)                       inject(['translator.js'],  { type:'TR_ON',    lang: d.tr_lang || 'auto' });
    if (d.summarize_on || d.explain_on) inject(['page_tools.js'], { type:'TOOLS_ON',  summarize: d.summarize_on, explain: d.explain_on });
    if (d.anti_on)                      inject(['anti_detect.js'],{ type:'ANTI_ON' });
  });
});
