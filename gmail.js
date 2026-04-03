/* CLAW Plugin — Gmail v23 */
(function(){
'use strict';
if(window.__clawGmail__) return;
window.__clawGmail__ = true;
if(!location.hostname.includes('mail.google.com')) return;

const KEY = 'SUA_CHAVE_API_GROQ_AQUI';
const MODEL = 'llama-3.3-70b-versatile';

function injectToolbar(){
  const observer = new MutationObserver(() => {
    // Detecta compose/reply
    const composeBoxes = document.querySelectorAll('[role="textbox"][aria-label*="orpo"], div.Am.Al.editable, [g_editable="true"]');
    composeBoxes.forEach(box => {
      if(box.dataset.clawInjected) return;
      box.dataset.clawInjected = 'true';
      
      const toolbar = document.createElement('div');
      toolbar.style.cssText = 'display:flex;gap:4px;padding:4px 8px;';
      const btnStyle = `background:#2a2a2f;border:1px solid #38383f;border-radius:6px;color:#b4b4be;
        font-size:10px;padding:3px 8px;cursor:pointer;font-family:Inter,system-ui,sans-serif;`;
      
      [
        { icon: '▸', label: 'Melhorar', action: 'improve' },
        { icon: '▸', label: 'Sugerir resposta', action: 'suggest' },
        { icon: '▸', label: 'Resumir', action: 'summarize' },
      ].forEach(a => {
        const btn = document.createElement('button');
        btn.style.cssText = btnStyle;
        btn.textContent = `${a.icon} ${a.label}`;
        btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); gmailAction(a.action, box); };
        toolbar.appendChild(btn);
      });

      const parent = box.closest('.ip.iq') || box.closest('[role="dialog"]') || box.parentElement;
      if(parent) parent.insertBefore(toolbar, box);
    });

    // Detecta email aberto para botão de resumo
    const emailBody = document.querySelector('.a3s.aiL, .ii.gt');
    if(emailBody && !emailBody.dataset.clawSummary){
      emailBody.dataset.clawSummary = 'true';
      const btn = document.createElement('button');
      btn.style.cssText = `background:#2a2a2f;border:1px solid #38383f;border-radius:6px;color:#b4b4be;
        font-size:10px;padding:4px 10px;cursor:pointer;font-family:Inter,system-ui,sans-serif;margin:4px 0;`;
      btn.textContent = '▸ Resumir conversa';
      btn.onclick = () => summarizeEmail(emailBody);
      emailBody.parentElement?.insertBefore(btn, emailBody);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function gmailAction(action, box){
  const currentText = box.innerText || box.textContent || '';
  const emailThread = document.querySelector('.a3s.aiL, .ii.gt')?.innerText?.slice(0, 2000) || '';

  const prompts = {
    improve: `Melhore este email em português brasileiro. Mantenha o tom profissional mas natural. Retorne APENAS o texto melhorado:\n\n${currentText}`,
    suggest: `Baseado nesta conversa de email, sugira uma resposta profissional e natural em português brasileiro:\n\nConversa: ${emailThread}\n\nRascunho atual: ${currentText}`,
    summarize: `Resuma esta conversa de email em 3-5 bullet points em português brasileiro:\n\n${emailThread}`,
  };

  const original = box.innerHTML;
  box.style.opacity = '0.5';

  try {
    const result = await callGroq(prompts[action]);
    if(action === 'summarize'){
      showGmailPanel(result);
    } else {
      // Insere o texto no compose
      box.focus();
      box.innerText = result;
      box.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } catch(err){
    showGmailPanel('✗ ' + (err.message || 'Erro'));
  }
  box.style.opacity = '1';
}

async function summarizeEmail(el){
  const text = el.innerText?.slice(0, 3000) || '';
  showGmailPanel('Resumindo...');
  try {
    const result = await callGroq(`Resuma este email/conversa em português brasileiro com bullet points:\n\n${text}`);
    showGmailPanel(result);
  } catch(err) {
    showGmailPanel('✗ ' + err.message);
  }
}

function showGmailPanel(content){
  let panel = document.getElementById('__claw_gmail_panel__');
  if(!panel){
    panel = document.createElement('div');
    panel.id = '__claw_gmail_panel__';
    panel.style.cssText = `position:fixed;top:80px;right:20px;z-index:2147483647;
      width:320px;max-height:50vh;background:#1a1a1e;border:1px solid #38383f;
      border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.6);
      font-family:Inter,system-ui,sans-serif;overflow:hidden;display:flex;flex-direction:column;`;
    document.body.appendChild(panel);
  }
  panel.innerHTML = `
    <div style="display:flex;align-items:center;padding:10px 14px;background:#212124;border-bottom:1px solid #38383f;">
      <span style="font-size:12px;font-weight:600;color:#ececec;">▸ Claw · Gmail</span>
      <button onclick="this.closest('#__claw_gmail_panel__').remove()" style="margin-left:auto;background:none;border:none;color:#72727e;cursor:pointer;font-size:14px;">✕</button>
    </div>
    <div style="padding:12px 14px;color:#ececec;font-size:12px;line-height:1.7;overflow-y:auto;white-space:pre-wrap;">${content}</div>
  `;
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

injectToolbar();
})();
