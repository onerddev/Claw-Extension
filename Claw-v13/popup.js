const GROQ_KEY    = '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';
const GROQ_TEXT   = 'llama-3.3-70b-versatile';
const GROQ_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';

function setPill(id, on) {
  const pill = document.getElementById(id+'-pill');
  const txt  = document.getElementById(id+'-status');
  if (pill) pill.className = 'pill'+(on?' on':'');
  if (txt)  txt.textContent = on ? 'Ativo' : 'Desativado';
}

function sendToTab(type, file, extra={}) {
  chrome.tabs.query({active:true,currentWindow:true}, ([tab]) => {
    if (!tab) return;
    chrome.scripting.executeScript({target:{tabId:tab.id},files:['stats.js',file]}, () => {
      void chrome.runtime.lastError;
      chrome.tabs.sendMessage(tab.id, {type,...extra}, () => void chrome.runtime.lastError);
    });
  });
}

/* toggles */
document.getElementById('tog-k').addEventListener('change', e => {
  const on = e.target.checked;
  chrome.storage.sync.set({k_on:on}); setPill('k',on);
  const delay   = +document.getElementById('delaySlider').value||0;
  const stealth = document.getElementById('tog-stealth').checked;
  sendToTab(on?'KAHOOT_ON':'KAHOOT_OFF','kahoot.js',{delay,stealth});
});
document.getElementById('tog-s').addEventListener('change', e => {
  const on = e.target.checked;
  chrome.storage.sync.set({s_on:on}); setPill('s',on);
  sendToTab(on?'STOP_ON':'STOP_OFF','stopots.js');
});
document.getElementById('tog-tr').addEventListener('change', e => {
  const on = e.target.checked, lang = document.getElementById('tr-lang').value;
  chrome.storage.sync.set({tr_on:on,tr_lang:lang}); setPill('tr',on);
  chrome.tabs.query({active:true,currentWindow:true}, ([tab]) => {
    if (!tab) return;
    chrome.scripting.executeScript({target:{tabId:tab.id},files:['translator.js']}, () => {
      void chrome.runtime.lastError;
      chrome.tabs.sendMessage(tab.id, {type:on?'TR_ON':'TR_OFF',lang}, () => void chrome.runtime.lastError);
    });
  });
});
document.getElementById('tr-lang').addEventListener('change', e => chrome.storage.sync.set({tr_lang:e.target.value}));

/* resize textarea */
function autoResize(el) { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,110)+'px'; }

/* tradutor */
const trInput=document.getElementById('trInput'), btnTr=document.getElementById('btnTr'), trResp=document.getElementById('trResp');
trInput.addEventListener('input',()=>autoResize(trInput));
trInput.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();runTranslate();} });
btnTr.addEventListener('click', runTranslate);
async function runTranslate() {
  const text=trInput.value.trim(); if(!text) return;
  trResp.className='resp loading'; trResp.textContent=''; btnTr.classList.add('loading');
  const lang=document.getElementById('tr-lang').value;
  const from=lang==='auto'?'qualquer idioma':({en:'inglês',es:'espanhol',fr:'francês',de:'alemão',it:'italiano',ja:'japonês',zh:'chinês',ko:'coreano',ar:'árabe'}[lang]||lang);
  try {
    const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ_KEY}`},body:JSON.stringify({model:GROQ_TEXT,messages:[{role:'user',content:`Traduza do ${from} para o português brasileiro.\nResponda SOMENTE com a tradução.\n\nTexto: ${text}`}],max_tokens:600,temperature:0.1})});
    const data=await res.json();
    trResp.className='resp show'; trResp.textContent=data.choices?.[0]?.message?.content?.trim()||'';
  } catch(e) { trResp.className='resp show'; trResp.textContent='Erro: '+e.message; }
  btnTr.classList.remove('loading');
}

/* chat IA */
let attachedImg=null;
const chatInput=document.getElementById('chatInput'), btnSend=document.getElementById('btnSend');
const btnAttach=document.getElementById('btnAttach'), fileInput=document.getElementById('file-input');
const imgPrev=document.getElementById('imgPreview'), imgThumb=document.getElementById('imgThumb');
const imgRemove=document.getElementById('imgRemove'), chatResp=document.getElementById('chatResp');

chatInput.addEventListener('input',()=>{ autoResize(chatInput); btnSend.classList.toggle('ready',chatInput.value.trim().length>0||!!attachedImg); });
chatInput.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();} });
btnSend.addEventListener('click',sendChat);
btnAttach.addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',()=>{
  const file=fileInput.files[0]; if(!file) return;
  new FileReader().onload=e=>{attachedImg=e.target.result;imgThumb.src=attachedImg;imgPrev.classList.add('show');btnSend.classList.add('ready');};
  new FileReader().readAsDataURL(file);
  const r=new FileReader(); r.onload=e=>{attachedImg=e.target.result;imgThumb.src=attachedImg;imgPrev.classList.add('show');btnSend.classList.add('ready');}; r.readAsDataURL(file);
  fileInput.value='';
});
imgRemove.addEventListener('click',()=>{ attachedImg=null; imgThumb.src=''; imgPrev.classList.remove('show'); btnSend.classList.toggle('ready',chatInput.value.trim().length>0); });

async function sendChat() {
  const text=chatInput.value.trim(); if(!text&&!attachedImg) return;
  const prompt=text||'Analise esta imagem e diga qual é a resposta correta, explicando brevemente.';
  chatResp.className='resp loading'; chatResp.textContent='';
  btnSend.classList.add('loading'); chatInput.value=''; chatInput.style.height='auto'; btnSend.classList.remove('ready');
  try {
    let messages;
    if(attachedImg){const b64=attachedImg.split(',')[1],mime=attachedImg.match(/data:(.*?);/)?.[1]||'image/jpeg';messages=[{role:'user',content:[{type:'image_url',image_url:{url:`data:${mime};base64,${b64}`}},{type:'text',text:prompt}]}];}
    else{messages=[{role:'user',content:`Você é especialista em quizzes. Responda em português, de forma clara.\n\n${prompt}`}];}
    const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ_KEY}`},body:JSON.stringify({model:attachedImg?GROQ_VISION:GROQ_TEXT,messages,max_tokens:600,temperature:0.3})});
    const data=await res.json();
    chatResp.className='resp show'; chatResp.textContent=data.choices?.[0]?.message?.content?.trim()||'Sem resposta.';
  } catch(e){ chatResp.className='resp show'; chatResp.textContent='Erro: '+e.message; }
  btnSend.classList.remove('loading');
  attachedImg=null; imgThumb.src=''; imgPrev.classList.remove('show');
}
