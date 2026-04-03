/* CLAW — memory.js v23 | Sistema de memória por site */
(function(){
'use strict';
if(window.__clawMemory__) return;
window.__clawMemory__ = true;

const host = location.hostname;

// Registra visita
chrome.storage.local.get(['claw_memory'], d => {
  const mem = d.claw_memory || {};
  if(!mem[host]) mem[host] = { queries: [], count: 0, actions: {}, lastVisit: 0 };
  mem[host].count = (mem[host].count || 0) + 1;
  mem[host].lastVisit = Date.now();
  chrome.storage.local.set({ claw_memory: mem });
});

// API para outros scripts
window.ClawMemory = {
  async getMemory(){
    return new Promise(r => {
      chrome.storage.local.get(['claw_memory'], d => r((d.claw_memory || {})[host] || null));
    });
  },
  async recordAction(action){
    chrome.storage.local.get(['claw_memory'], d => {
      const mem = d.claw_memory || {};
      if(!mem[host]) mem[host] = { queries: [], count: 0, actions: {}, lastVisit: 0 };
      mem[host].actions[action] = (mem[host].actions[action] || 0) + 1;
      chrome.storage.local.set({ claw_memory: mem });
    });
  },
  async getSuggestions(){
    return new Promise(r => {
      chrome.storage.local.get(['claw_memory'], d => {
        const site = (d.claw_memory || {})[host];
        if(!site || !site.actions) return r([]);
        const sorted = Object.entries(site.actions).sort((a,b) => b[1] - a[1]).slice(0, 5);
        r(sorted.map(([action, count]) => ({ action, count })));
      });
    });
  },
  async clearMemory(){
    chrome.storage.local.get(['claw_memory'], d => {
      const mem = d.claw_memory || {};
      delete mem[host];
      chrome.storage.local.set({ claw_memory: mem });
    });
  },
  async getAllMemory(){
    return new Promise(r => {
      chrome.storage.local.get(['claw_memory'], d => r(d.claw_memory || {}));
    });
  }
};

// Listener para popup/background
chrome.runtime.onMessage.addListener((msg, _, reply) => {
  if(msg.type === 'MEMORY_GET') {
    window.ClawMemory.getAllMemory().then(m => reply(m));
    return true;
  }
  if(msg.type === 'MEMORY_CLEAR') {
    window.ClawMemory.clearMemory().then(() => reply({ok:true}));
    return true;
  }
});

})();
