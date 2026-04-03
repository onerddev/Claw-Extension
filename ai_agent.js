/* CLAW — ai_agent.js v20 | Emanuel Felipe
   Content script injetado em qualquer página.
   Executa ações que a IA planeja.
*/
(function(){
'use strict';
if(window.__clawAgent__) return;
window.__clawAgent__ = true;

/* ════ UTILITÁRIOS ════════════════════════════════════════ */
function vis(el){
  if(!el) return false;
  try{
    const r=el.getBoundingClientRect();
    if(!r||r.width+r.height===0) return false;
    const s=getComputedStyle(el);
    return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';
  }catch{return false;}
}

/* Encontra elemento por qualquer descrição */
function find(desc){
  if(!desc) return null;
  /* 1. Seletor CSS */
  try{
    const el=document.querySelector(desc);
    if(el&&vis(el)) return el;
  }catch(e){}
  /* 2. Candidatos interativos + texto */
  const tags='a,button,[role="button"],[role="link"],input,textarea,select,label,[tabindex]';
  const all=[...document.querySelectorAll(tags)];
  const low=desc.toLowerCase();
  /* texto exato */
  let f=all.find(e=>vis(e)&&(e.innerText||e.value||'').trim().toLowerCase()===low);
  if(f) return f;
  /* texto parcial */
  f=all.find(e=>vis(e)&&(e.innerText||e.value||'').trim().toLowerCase().includes(low));
  if(f) return f;
  /* atributos */
  f=all.find(e=>vis(e)&&[
    e.placeholder,e.getAttribute('aria-label'),
    e.getAttribute('name'),e.id,e.getAttribute('title'),
    e.getAttribute('data-testid')
  ].some(v=>v&&v.toLowerCase().includes(low)));
  if(f) return f;
  /* qualquer elemento visível com texto */
  const any=[...document.querySelectorAll('*')];
  return any.find(e=>vis(e)&&e.childElementCount===0&&
    (e.innerText||'').trim().toLowerCase().includes(low))||null;
}

/* Preenche input compatível com React/Vue/Angular */
function fill(el,value){
  el.focus();
  const d=Object.getOwnPropertyDescriptor;
  const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=d(proto,'value')?.set;
  if(setter) setter.call(el,value); else el.value=value;
  ['input','change','keyup','keydown'].forEach(ev=>
    el.dispatchEvent(new Event(ev,{bubbles:true,cancelable:true}))
  );
  el.blur();
}

/* ════ AÇÕES ════════════════════════════════════════════ */
const A={

  /* Navegação */
  navigate(url){ location.href=url; return `→ ${url}`; },
  back()       { history.back();    return '← Voltando'; },
  forward()    { history.forward(); return '→ Avançando'; },
  reload()     { location.reload(); return '↺ Recarregando'; },
  scrollTo(y)  { window.scrollTo({top:+y,behavior:'smooth'}); return `↕ y=${y}`; },
  scrollBy(dy) { window.scrollBy({top:+dy,behavior:'smooth'}); return `↕ +${dy}px`; },
  scrollTop()  { window.scrollTo({top:0,behavior:'smooth'}); return '↑ Topo'; },
  scrollBottom(){ window.scrollTo({top:1e9,behavior:'smooth'}); return '↓ Fim'; },

  /* Clique */
  click(desc){
    const el=find(desc);
    if(!el) return `❌ Não encontrado: "${desc}"`;
    el.scrollIntoView({behavior:'smooth',block:'center'});
    el.click();
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    return `✓ Clicado: "${(el.innerText||el.value||el.id||desc).slice(0,40)}"`;
  },
  clickAt(x,y){
    const el=document.elementFromPoint(+x,+y);
    if(!el) return `❌ Nada em (${x},${y})`;
    el.click();
    return `✓ Clique em (${x},${y})`;
  },
  dblclick(desc){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    el.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));
    return `✓ Duplo clique: "${desc}"`;
  },
  rightclick(desc){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true}));
    return `✓ Clique direito: "${desc}"`;
  },

  /* Digitação */
  type(desc,value){
    const el=find(desc);
    if(!el) return `❌ Input "${desc}" não encontrado`;
    fill(el,value);
    return `✓ Digitado "${value}" em "${desc}"`;
  },
  typeKeys(text){
    const el=document.activeElement||document.body;
    if(['INPUT','TEXTAREA'].includes(el.tagName)){
      fill(el,el.value+text);
    } else {
      document.execCommand('insertText',false,text);
    }
    return `✓ Teclas: "${text}"`;
  },
  append(desc,text){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    fill(el,(el.value||'')+text);
    return `✓ Texto adicionado em "${desc}"`;
  },
  clear(desc){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    fill(el,''); return `✓ Limpo: "${desc}"`;
  },
  focus(desc){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    el.focus(); el.scrollIntoView({block:'center'});
    return `✓ Foco em "${desc}"`;
  },
  hover(desc){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    el.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));
    el.dispatchEvent(new MouseEvent('mouseenter',{bubbles:true}));
    return `✓ Hover: "${desc}"`;
  },

  /* Teclas */
  pressKey(key){
    const el=document.activeElement||document.body;
    const opts={key,code:key,bubbles:true,cancelable:true};
    el.dispatchEvent(new KeyboardEvent('keydown',opts));
    el.dispatchEvent(new KeyboardEvent('keypress',opts));
    el.dispatchEvent(new KeyboardEvent('keyup',opts));
    if(key==='Enter'){
      const form=el.closest?.('form');
      if(form) form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    }
    return `✓ Tecla: ${key}`;
  },
  hotkey(keys){ // ex: "ctrl+a"
    const parts=keys.toLowerCase().split('+');
    const last=parts.pop();
    const opts={key:last,ctrlKey:parts.includes('ctrl'),
      altKey:parts.includes('alt'),shiftKey:parts.includes('shift'),
      metaKey:parts.includes('meta'),bubbles:true};
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown',opts));
    return `✓ Atalho: ${keys}`;
  },

  /* Formulários */
  submit(desc){
    if(desc){
      const el=find(desc);
      if(el){ el.click(); return `✓ Submetido via "${desc}"`; }
    }
    const s=document.querySelector('[type="submit"],button[type="submit"]');
    if(s){ s.click(); return '✓ Botão submit clicado'; }
    const form=document.querySelector('form');
    if(form){ form.submit(); return '✓ Form submetido'; }
    return '❌ Nenhum form/submit encontrado';
  },
  select(desc,value){
    const el=find(desc);
    if(!el||el.tagName!=='SELECT') return `❌ Select "${desc}" não encontrado`;
    const opt=[...el.options].find(o=>
      o.text.toLowerCase().includes(value.toLowerCase())||
      o.value.toLowerCase()===value.toLowerCase()
    );
    if(!opt) return `❌ Opção "${value}" não encontrada`;
    el.value=opt.value;
    el.dispatchEvent(new Event('change',{bubbles:true}));
    return `✓ Selecionado "${opt.text}"`;
  },
  check(desc,checked=true){
    const el=find(desc);
    if(!el) return `❌ "${desc}" não encontrado`;
    if(el.checked!==!!checked){
      el.checked=!!checked;
      el.dispatchEvent(new Event('change',{bubbles:true}));
    }
    return `✓ Checkbox "${desc}": ${checked?'marcado':'desmarcado'}`;
  },
  fillForm(fields){
    // fields = objeto {label:value, ...}
    const results=[];
    for(const[desc,value] of Object.entries(fields||{})){
      results.push(A.type(desc,String(value)));
    }
    return results.join('\n');
  },

  /* Leitura */
  getText(desc){
    const el=find(desc);
    if(!el) return `❌ "${desc}" não encontrado`;
    return el.innerText?.trim()||el.value||el.getAttribute('content')||'(vazio)';
  },
  getPageText(){
    const clone=document.body.cloneNode(true);
    clone.querySelectorAll('script,style,noscript,nav,footer,header,[role="navigation"]')
      .forEach(e=>e.remove());
    return (clone.innerText||'').replace(/\s+/g,' ').trim().slice(0,4000);
  },
  getTitle(){ return document.title; },
  getUrl(){   return location.href; },
  getAttr(desc,attr){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    return el.getAttribute(attr)||'(null)';
  },
  countElements(sel){
    try{ return String(document.querySelectorAll(sel).length)+' elementos'; }
    catch(e){ return `❌ Seletor inválido: ${e.message}`; }
  },
  extractLinks(){
    const links=[...document.querySelectorAll('a[href]')]
      .map(a=>({text:(a.innerText||'').trim().slice(0,60),href:a.href}))
      .filter(l=>l.href.startsWith('http'))
      .slice(0,25);
    return links.map(l=>`${l.text} → ${l.href}`).join('\n')||'Nenhum link encontrado';
  },
  extractImages(){
    const imgs=[...document.querySelectorAll('img[src]')]
      .map(i=>({alt:i.alt,src:i.src})).slice(0,10);
    return imgs.map(i=>`${i.alt||'(sem alt)'}: ${i.src}`).join('\n')||'Nenhuma imagem';
  },
  extractTable(desc){
    const el=desc?find(desc):document.querySelector('table');
    if(!el) return '❌ Tabela não encontrada';
    return [...el.querySelectorAll('tr')]
      .map(tr=>[...tr.querySelectorAll('th,td')].map(c=>c.innerText.trim()).join(' | '))
      .join('\n');
  },
  extractInputs(){
    return [...document.querySelectorAll('input:not([type="hidden"]),textarea,select')]
      .filter(e=>!e.disabled).map(e=>({
        tag:e.tagName.toLowerCase(),
        type:e.type||'',
        name:e.name||e.id||e.placeholder||e.getAttribute('aria-label')||'?',
        value:e.value||''
      })).slice(0,20).map(e=>`[${e.tag}${e.type?'/'+e.type:''}] "${e.name}" = "${e.value}"`)
      .join('\n')||'Nenhum input';
  },
  getPageInfo(){
    return JSON.stringify({
      url:location.href, title:document.title,
      inputs:A.extractInputs().split('\n').slice(0,8),
      linkCount:document.querySelectorAll('a[href]').length,
      formCount:document.querySelectorAll('form').length,
    },null,2);
  },

  /* DOM */
  injectCSS(css){
    const s=document.createElement('style');
    s.id='__claw_css__'; s.textContent=css;
    document.head.appendChild(s);
    return `✓ CSS injetado (${css.length} chars)`;
  },
  removeCSS(){
    document.getElementById('__claw_css__')?.remove();
    return '✓ CSS removido';
  },
  injectScript(code){
    try{ const r=eval(code); return `✓ JS: ${String(r).slice(0,100)}`; }
    catch(e){ return `❌ ${e.message}`; }
  },
  removeElement(desc){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    el.remove(); return `✓ Removido: "${desc}"`;
  },
  hideElement(desc){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    el.style.setProperty('display','none','important'); return `✓ Oculto: "${desc}"`;
  },
  showElement(desc){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    el.style.removeProperty('display'); return `✓ Exibido: "${desc}"`;
  },
  setAttribute(desc,attr,val){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    el.setAttribute(attr,val); return `✓ ${attr}="${val}" em "${desc}"`;
  },
  setStyle(desc,prop,val){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    el.style[prop]=val; return `✓ style.${prop}="${val}" em "${desc}"`;
  },
  highlight(desc){
    const el=find(desc); if(!el) return `❌ "${desc}" não encontrado`;
    const prev=el.style.outline;
    el.style.outline='3px solid #d4a85a';
    el.style.outlineOffset='3px';
    el.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>{el.style.outline=prev;el.style.outlineOffset='';},3000);
    return `✓ Destacado: "${desc}"`;
  },

  /* Clipboard */
  async copyText(text){
    try{
      await navigator.clipboard.writeText(text);
      return `✓ Copiado: "${text.slice(0,50)}"`;
    }catch{
      const ta=Object.assign(document.createElement('textarea'),{value:text});
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      return `✓ Copiado (fallback): "${text.slice(0,50)}"`;
    }
  },
  async pasteText(){
    try{ return await navigator.clipboard.readText(); }
    catch{ return '❌ Clipboard requer permissão'; }
  },

  /* Storage */
  setStorage(key,value,type='local'){
    (type==='session'?sessionStorage:localStorage).setItem(key,JSON.stringify(value));
    return `✓ Storage["${key}"] = ${JSON.stringify(value).slice(0,40)}`;
  },
  getStorage(key,type='local'){
    const v=(type==='session'?sessionStorage:localStorage).getItem(key);
    return v!==null?`Storage["${key}"] = ${v}`:`(${key} não existe)`;
  },

  /* Notificação */
  showNotification(msg,type='info'){
    const colors={info:'#4e8ed0',success:'#5a9e6f',warning:'#d4a85a',error:'#c46060'};
    const c=colors[type]||colors.info;
    const div=document.createElement('div');
    div.style.cssText=`
      position:fixed!important;top:20px!important;left:50%!important;
      transform:translateX(-50%)!important;z-index:2147483647!important;
      background:#1c1c1e;border:2px solid ${c};border-radius:12px;
      padding:12px 22px;font-family:Inter,system-ui,sans-serif;
      font-size:13px;font-weight:500;color:#f0efed;
      box-shadow:0 8px 32px rgba(0,0,0,.8);max-width:380px;
      text-align:center;transition:opacity .3s;
    `;
    div.textContent=msg;
    document.body.appendChild(div);
    setTimeout(()=>{div.style.opacity='0';setTimeout(()=>div.remove(),300);},4000);
    return `✓ Notificação: "${msg}"`;
  },

  /* Utilitários */
  wait(ms){ return new Promise(r=>setTimeout(r,+ms||500)); },
};

/* ════ LISTENER ════════════════════════════════════════ */
chrome.runtime.onMessage.addListener((msg,_,reply)=>{

  /* Executa plano completo */
  if(msg.type==='AGENT_EXEC'){
    (async()=>{
      const results=[];
      for(const step of (msg.plan?.steps||[])){
        try{
          const fn=A[step.action];
          if(!fn){ results.push(`❌ Ação desconhecida: "${step.action}"`); continue; }
          const r=await fn.apply(A,step.args||[]);
          results.push(r||`✓ ${step.action}`);
          if(step.wait) await new Promise(res=>setTimeout(res,+step.wait));
        }catch(e){
          results.push(`❌ ${step.action}: ${e.message}`);
        }
      }
      reply({ok:true,results,url:location.href,title:document.title});
    })();
    return true;
  }

  /* Executa ação única */
  if(msg.type==='AGENT_ACTION'){
    (async()=>{
      try{
        const fn=A[msg.action];
        if(!fn){ reply({ok:false,result:`❌ Ação "${msg.action}" não existe`}); return; }
        const r=await fn.apply(A,msg.args||[]);
        reply({ok:true,result:r||`✓ ${msg.action}`});
      }catch(e){
        reply({ok:false,result:`❌ ${e.message}`});
      }
    })();
    return true;
  }

  /* Lê contexto da página */
  if(msg.type==='AGENT_READ'){
    try{
      reply({
        ok:true,
        url:location.href,
        title:document.title,
        text:A.getPageText().slice(0,1500),
        inputs:A.extractInputs(),
        links:A.extractLinks().split('\n').slice(0,10).join('\n'),
        forms:document.querySelectorAll('form').length,
      });
    }catch(e){
      reply({ok:false,url:location.href,title:document.title});
    }
    return false;
  }
});

window.__clawActions__ = A;
console.log('[Claw Agent] ativo em', location.hostname);
})();
