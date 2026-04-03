/* CLAW Plugin — WhatsApp Web v23 */
(function(){
'use strict';
if(window.__clawWA__) return;
window.__clawWA__ = true;
if(!location.hostname.includes('web.whatsapp.com')) return;

const KEY = 'SUA_CHAVE_API_GROQ_AQUI';
const MODEL = 'llama-3.3-70b-versatile';

function injectButtons(){
  const observer = new MutationObserver(() => {
    const footer = document.querySelector('footer, [data-testid="conversation-compose-box-input"]')?.closest('footer') 
      || document.querySelector('div[data-testid="compose-box"]')?.parentElement;
    if(!footer || footer.dataset.clawInjected) return;
    footer.dataset.clawInjected = 'true';

    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:4px;padding:4px 12px;';
    const btnStyle = `background:rgba(42,42,47,.9);border:1px solid #38383f;border-radius:6px;color:#b4b4be;
      font-size:10px;padding:3px 8px;cursor:pointer;font-family:Inter,system-ui,sans-serif;`;
    
    [
      { icon: '▸', label: 'Melhorar', action: 'improve' },
      { icon: '▸', label: 'Sugerir', action: 'suggest' },
      { icon: '▸', label: 'Traduzir', action: 'translate' },
    ].forEach(a => {
      const btn = document.createElement('button');
      btn.style.cssText = btnStyle;
      btn.textContent = `${a.icon} ${a.label}`;
      btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); waAction(a.action); };
      bar.appendChild(btn);
    });

    footer.insertBefore(bar, footer.firstChild);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function waAction(action){
  const input = document.querySelector('[data-testid="conversation-compose-box-input"], footer [contenteditable="true"]');
  const currentText = input?.textContent?.trim() || '';
  
  // Pega últimas mensagens da conversa
  const msgs = [...document.querySelectorAll('[data-testid="msg-container"] .copyable-text, .message-in .copyable-text, .message-out .copyable-text')]
    .slice(-10)
    .map(m => m.textContent.trim())
    .join('\n');

  const prompts = {
    improve: `Melhore esta mensagem de WhatsApp, mantendo o tom casual e natural em português brasileiro. Retorne APENAS a mensagem melhorada:\n\n${currentText}`,
    suggest: `Baseado nesta conversa de WhatsApp, sugira uma resposta natural e casual em português brasileiro:\n\nConversa recente:\n${msgs}\n\nMensagem atual: ${currentText || '(vazia)'}`,
    translate: `Traduza esta mensagem para inglês. Retorne APENAS a tradução:\n\n${currentText || msgs.split('\n').pop()}`,
  };

  try {
    const result = await callGroq(prompts[action]);
    if(input){
      input.focus();
      // Clear and type
      document.execCommand('selectAll');
      document.execCommand('insertText', false, result);
    }
  } catch(err) {
    console.error('[Claw WA]', err);
  }
}

function callGroq(prompt){
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'GROQ_FETCH', key: KEY,
      payload: { model: MODEL, messages: [{ role: 'user', content: prompt.slice(0, 4000) }], max_tokens: 400, temperature: 0.3 }
    }, res => {
      if(chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if(!res?.ok) return reject(new Error(res?.error || 'Erro'));
      resolve(res.data?.choices?.[0]?.message?.content?.trim() || '');
    });
  });
}

injectButtons();
})();
