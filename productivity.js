/* CLAW — productivity.js v23 | Dashboard de produtividade */
(function(){
'use strict';
if(window.__clawProd__) return;
window.__clawProd__ = true;

const DISTRACTION_SITES = ['youtube.com','tiktok.com','instagram.com','twitter.com','x.com',
  'reddit.com','facebook.com','twitch.tv','9gag.com','netflix.com'];

const host = location.hostname;
let startTime = Date.now();
let alertShown = false;

// Rastreia tempo
function trackTime(){
  chrome.storage.local.get(['claw_productivity'], d => {
    const prod = d.claw_productivity || {};
    const today = new Date().toISOString().slice(0, 10);
    if(!prod[today]) prod[today] = {};
    if(!prod[today][host]) prod[today][host] = 0;
    prod[today][host] += 30; // +30s a cada tick
    chrome.storage.local.set({ claw_productivity: prod });

    // Alerta de distração
    const timeSpent = prod[today][host];
    const isDistraction = DISTRACTION_SITES.some(s => host.includes(s));
    if(isDistraction && timeSpent >= 3600 && !alertShown){
      alertShown = true;
      showAlert(`! Você já passou ${Math.round(timeSpent/60)} minutos no ${host} hoje.`);
    }
  });
}

setInterval(trackTime, 30000);
trackTime();

function showAlert(msg){
  const div = document.createElement('div');
  div.style.cssText = `
    position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;
    background:#1a1a1e;border:1px solid #cc7832;border-radius:10px;padding:10px 18px;
    font-family:Inter,system-ui,sans-serif;font-size:12px;color:#e8915a;
    box-shadow:0 8px 24px rgba(0,0,0,.5);display:flex;align-items:center;gap:8px;
  `;
  div.innerHTML = `<span>${msg}</span><button style="background:none;border:none;color:#72727e;cursor:pointer;font-size:14px;" onclick="this.parentElement.remove()">✕</button>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 8000);
}

// Listener para popup
chrome.runtime.onMessage.addListener((msg, _, reply) => {
  if(msg.type === 'PRODUCTIVITY_GET'){
    chrome.storage.local.get(['claw_productivity'], d => reply(d.claw_productivity || {}));
    return true;
  }
  if(msg.type === 'PRODUCTIVITY_CLEAR'){
    chrome.storage.local.set({ claw_productivity: {} }, () => reply({ok:true}));
    return true;
  }
});

})();
