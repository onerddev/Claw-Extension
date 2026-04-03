/* CLAW Plugin — Google Docs v23 */
(function(){
'use strict';
if(window.__clawDocs__) return;
window.__clawDocs__ = true;
if(!location.hostname.includes('docs.google.com')) return;

const KEY = 'SUA_CHAVE_API_GROQ_AQUI';
const MODEL = 'llama-3.3-70b-versatile';

function injectToolbar(){
  setTimeout(() => {
    if(document.getElementById('__claw_docs_bar__')) return;
    
    const bar = document.createElement('div');
    bar.id = '__claw_docs_bar__';
    bar.style.cssText = `
      position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:2147483647;
      display:flex;gap:6px;padding:8px 14px;background:#1a1a1e;border:1px solid #38383f;
      border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.5);
    `;
    const btnStyle = `background:#2a2a2f;border:1px solid #38383f;border-radius:8px;color:#b4b4be;
      font-size:11px;padding:5px 12px;cursor:pointer;font-family:Inter,system-ui,sans-serif;
      transition:background .15s;white-space:nowrap;`;

    [
      { icon: '▸', label: 'Melhorar escrita', action: 'improve' },
      { icon: '▸', label: 'Resumir', action: 'summarize' },
      { icon: '▸', label: 'Gerar conteúdo', action: 'generate' },
    ].forEach(a => {
      const btn = document.createElement('button');
      btn.style.cssText = btnStyle;
      btn.textContent = `${a.icon} ${a.label}`;
      btn.onmouseover = () => { btn.style.background = '#38383f'; };
      btn.onmouseout = () => { btn.style.background = '#2a2a2f'; };
      btn.onclick = () => docsAction(a.action);
      bar.appendChild(btn);
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background:none;border:none;color:#72727e;cursor:pointer;font-size:14px;';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => bar.remove();
    bar.appendChild(closeBtn);

    document.body.appendChild(bar);
  }, 3000);
}

async function docsAction(action){
  // Tenta pegar texto selecionado ou todo o documento
  const selected = window.getSelection()?.toString()?.trim();
  const docText = getDocText();
  const text = selected || docText;

  if(!text) {
    showDocsPanel('Nenhum texto encontrado no documento.');
    return;
  }

  const prompts = {
    improve: `Melhore a escrita deste texto em português brasileiro. Mantenha o significado mas torne mais claro e profissional. Retorne APENAS o texto melhorado:\n\n${text.slice(0, 3000)}`,
    summarize: `Resuma este documento em português brasileiro com bullet points concisos:\n\n${text.slice(0, 3000)}`,
    generate: `Baseado no contexto deste documento, continue escrevendo mais conteúdo relevante em português brasileiro (2-3 parágrafos):\n\n${text.slice(0, 2000)}`,
  };

  showDocsPanel('Processando...');

  try {
    const result = await callGroq(prompts[action]);
    showDocsPanel(result);

    // Se for improve/generate e tinha seleção, tenta colar
    if((action === 'improve' || action === 'generate') && selected){
      // Copy to clipboard para o user colar
      try {
        await navigator.clipboard.writeText(result);
        showDocsPanel(result + '\n\n→ Texto copiado! Cole com Ctrl+V.');
      } catch {}
    }
  } catch(err){
    showDocsPanel('✗ ' + (err.message || 'Erro'));
  }
}

function getDocText(){
  // Google Docs usa canvas, então tentamos pegar do DOM acessível
  const pages = document.querySelectorAll('.kix-page-content-wrapper');
  if(pages.length > 0){
    return [...pages].map(p => p.textContent).join('\n').trim().slice(0, 3000);
  }
  // Fallback: aria
  const editor = document.querySelector('[contenteditable="true"], .kix-appview-editor');
  return editor?.textContent?.trim()?.slice(0, 3000) || '';
}

function showDocsPanel(content){
  let panel = document.getElementById('__claw_docs_panel__');
  if(!panel){
    panel = document.createElement('div');
    panel.id = '__claw_docs_panel__';
    panel.style.cssText = `position:fixed;top:80px;right:20px;z-index:2147483647;
      width:340px;max-height:60vh;background:#1a1a1e;border:1px solid #38383f;
      border-radius:13px;box-shadow:0 16px 48px rgba(0,0,0,.7);
      font-family:Inter,system-ui,sans-serif;overflow:hidden;display:flex;flex-direction:column;`;
    document.body.appendChild(panel);
  }
  panel.innerHTML = `
    <div style="display:flex;align-items:center;padding:10px 14px;background:#212124;border-bottom:1px solid #38383f;">
      <span style="font-size:12px;font-weight:600;color:#ececec;">▸ Claw · Docs</span>
      <button onclick="this.closest('#__claw_docs_panel__').remove()" style="margin-left:auto;background:none;border:none;color:#72727e;cursor:pointer;font-size:14px;">✕</button>
    </div>
    <div style="padding:12px 14px;color:#ececec;font-size:12px;line-height:1.7;overflow-y:auto;white-space:pre-wrap;">${content}</div>
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

injectToolbar();
})();
