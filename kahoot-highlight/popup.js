const tog = document.getElementById('tog');
const sb  = document.getElementById('sb');

function st(msg, cls = '') { sb.textContent = msg; sb.className = 'sb ' + cls; }

chrome.storage.sync.get('on', d => {
  if (d.on) { tog.checked = true; st('🟢 Ativo! Abra o Kahoot.', 'ok'); }
});

tog.addEventListener('change', () => {
  const on = tog.checked;
  chrome.storage.sync.set({ on }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) { st(on ? '✅ Abra kahoot.it' : '⭕ Desativado', on ? 'ok' : ''); return; }
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, () => {
        void chrome.runtime.lastError;
        chrome.tabs.sendMessage(tab.id, { type: on ? 'ON' : 'OFF' }, () => {
          void chrome.runtime.lastError;
          st(on ? '🟢 Ativo! Monitorando...' : '⭕ Desativado', on ? 'ok' : '');
        });
      });
    });
  });
});
