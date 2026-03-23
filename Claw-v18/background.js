/* CLAW — background.js v18 | Emanuel Felipe */
'use strict';

chrome.runtime.onInstalled.addListener(()=>{
  console.log('[Claw] v18 instalado.');
});

chrome.runtime.onMessage.addListener((msg,_,reply)=>{
  if(msg.type==='PING'){ reply({ok:true}); return false; }
});

/* Re-injeta scripts ativos quando tab carrega */
chrome.tabs.onUpdated.addListener((tabId, info, tab)=>{
  if(info.status!=='complete') return;
  if(!tab.url||tab.url.startsWith('chrome')||tab.url.startsWith('about')) return;

  chrome.storage.sync.get(['tr_on','tr_lang','summarize_on','explain_on','anti_on'], d=>{
    const inject=(files, msg)=>{
      chrome.scripting.executeScript({target:{tabId}, files}, ()=>{
        if(chrome.runtime.lastError) return;
        chrome.tabs.sendMessage(tabId, msg, ()=>void chrome.runtime.lastError);
      });
    };

    if(d.tr_on)                       inject(['translator.js'],  {type:'TR_ON',   lang:d.tr_lang||'auto'});
    if(d.summarize_on||d.explain_on)  inject(['page_tools.js'],  {type:'TOOLS_ON', summarize:d.summarize_on, explain:d.explain_on});
    if(d.anti_on)                     inject(['anti_detect.js'], {type:'ANTI_ON'});
  });
});
