/* CLAW — commander.js v19
   Assistente de comandos por voz/texto.
   Abre abas, pesquisa, navega — tudo por linguagem natural.
   Desenvolvido por Emanuel Felipe
*/
(function(){
'use strict';

const SITES = {
  // Redes sociais
  'youtube':      'https://youtube.com',
  'instagram':    'https://instagram.com',
  'twitter':      'https://twitter.com',
  'x':            'https://x.com',
  'tiktok':       'https://tiktok.com',
  'facebook':     'https://facebook.com',
  'whatsapp':     'https://web.whatsapp.com',
  'telegram':     'https://web.telegram.org',
  'discord':      'https://discord.com/app',
  'reddit':       'https://reddit.com',
  'linkedin':     'https://linkedin.com',
  'pinterest':    'https://pinterest.com',
  'snapchat':     'https://snapchat.com',
  'twitch':       'https://twitch.tv',
  // Produtividade
  'gmail':        'https://mail.google.com',
  'google drive': 'https://drive.google.com',
  'drive':        'https://drive.google.com',
  'docs':         'https://docs.google.com',
  'google docs':  'https://docs.google.com',
  'sheets':       'https://sheets.google.com',
  'slides':       'https://slides.google.com',
  'google fotos': 'https://photos.google.com',
  'google maps':  'https://maps.google.com',
  'maps':         'https://maps.google.com',
  'calendar':     'https://calendar.google.com',
  'google calendar':'https://calendar.google.com',
  'notion':       'https://notion.so',
  'trello':       'https://trello.com',
  'github':       'https://github.com',
  'figma':        'https://figma.com',
  // Entretenimento
  'netflix':      'https://netflix.com',
  'prime':        'https://primevideo.com',
  'amazon prime': 'https://primevideo.com',
  'disney':       'https://disneyplus.com',
  'disney+':      'https://disneyplus.com',
  'spotify':      'https://open.spotify.com',
  'deezer':       'https://deezer.com',
  'globoplay':    'https://globoplay.globo.com',
  'star+':        'https://starplus.com',
  'hbo':          'https://max.com',
  'max':          'https://max.com',
  'crunchyroll':  'https://crunchyroll.com',
  // Estudo
  'kahoot':       'https://kahoot.it',
  'stopots':      'https://stopots.com',
  'duolingo':     'https://duolingo.com',
  'brainly':      'https://brainly.com.br',
  'wikipedia':    'https://pt.wikipedia.org',
  'chatgpt':      'https://chatgpt.com',
  'claude':       'https://claude.ai',
  // Compras
  'amazon':       'https://amazon.com.br',
  'mercado livre':'https://mercadolivre.com.br',
  'shopee':       'https://shopee.com.br',
  'magalu':       'https://magazineluiza.com.br',
  'americanas':   'https://americanas.com.br',
  'ifood':        'https://ifood.com.br',
  // Outros
  'google':       'https://google.com',
  'bing':         'https://bing.com',
  'outlook':      'https://outlook.live.com',
  'onedrive':     'https://onedrive.live.com',
  'icloud':       'https://icloud.com',
};

const SEARCH_ENGINES = {
  'youtube':   q => `https://youtube.com/results?search_query=${encodeURIComponent(q)}`,
  'google':    q => `https://google.com/search?q=${encodeURIComponent(q)}`,
  'bing':      q => `https://bing.com/search?q=${encodeURIComponent(q)}`,
  'maps':      q => `https://maps.google.com/search?q=${encodeURIComponent(q)}`,
  'wikipedia': q => `https://pt.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
  'twitter':   q => `https://twitter.com/search?q=${encodeURIComponent(q)}`,
  'reddit':    q => `https://reddit.com/search?q=${encodeURIComponent(q)}`,
  'amazon':    q => `https://amazon.com.br/s?k=${encodeURIComponent(q)}`,
  'shopee':    q => `https://shopee.com.br/search?keyword=${encodeURIComponent(q)}`,
  'mercado livre': q => `https://lista.mercadolivre.com.br/${encodeURIComponent(q)}`,
};

/* ── Interpreta o comando ── */
function parseCommand(input) {
  const raw = input.trim().toLowerCase();

  // ABRIR MÚLTIPLOS SITES: "abre youtube e gmail"
  const openMulti = raw.match(/^(abr[ae]|vai|acessa|vai (para|pro|pra)|entra|ir para)\s+(.+)/i);
  if (openMulti) {
    const rest = openMulti[3].replace(/ e /gi, ',');
    const sites = rest.split(/[,]+/).map(s => s.trim()).filter(Boolean);
    const urls = sites.map(s => SITES[s.toLowerCase()]).filter(Boolean);
    if (urls.length > 0) return { action: 'open', urls };
  }

  // PESQUISAR NO: "pesquisa minecraft no youtube"
  const searchIn = raw.match(/(?:pesquisa|busca|procura|search)\s+(.+?)\s+no\s+(.+)/i);
  if (searchIn) {
    const query = searchIn[1].trim();
    const engine = searchIn[2].trim().toLowerCase();
    const fn = SEARCH_ENGINES[engine];
    if (fn) return { action: 'open', urls: [fn(query)] };
  }

  // PESQUISAR: "pesquisa como fazer bolo"
  const search = raw.match(/^(?:pesquisa|busca|procura|search|googla|pesquisar)\s+(.+)/i);
  if (search) {
    const query = search[1].trim();
    return { action: 'open', urls: [`https://google.com/search?q=${encodeURIComponent(query)}`] };
  }

  // YOUTUBE: "coloca lofi no youtube" / "youtube minecraft"
  const yt = raw.match(/^(?:coloca|toca|play|youtube)\s+(.+?)(?:\s+no youtube)?$/i);
  if (yt || raw.startsWith('youtube ')) {
    const query = (yt ? yt[1] : raw.replace('youtube ', '')).trim();
    return { action: 'open', urls: [SEARCH_ENGINES.youtube(query)] };
  }

  // FECHAR ABA: "fecha essa aba" / "fecha a aba"
  if (/fecha(r)?\s+(essa|a|esta)?\s*aba/i.test(raw)) {
    return { action: 'close_tab' };
  }

  // NOVA ABA: "nova aba" / "abre uma aba nova"
  if (/nova aba|aba nova/i.test(raw)) {
    return { action: 'new_tab' };
  }

  // VOLTAR: "volta" / "voltar"
  if (/^volta(r)?$/i.test(raw)) {
    return { action: 'back' };
  }

  // RECARREGAR: "recarrega" / "atualiza"
  if (/^(recarrega(r)?|atualiza(r)?|refresh|f5)$/i.test(raw)) {
    return { action: 'reload' };
  }

  // ROLAR: "rola para baixo" / "vai para o topo"
  if (/rola(r)?\s+para\s+baixo|scroll down/i.test(raw)) {
    return { action: 'scroll', direction: 'down' };
  }
  if (/rola(r)?\s+para\s+cima|scroll up|topo/i.test(raw)) {
    return { action: 'scroll', direction: 'up' };
  }

  // SITE DIRETO: só o nome do site
  for (const [name, url] of Object.entries(SITES)) {
    if (raw === name || raw === 'abre ' + name || raw === 'abrir ' + name) {
      return { action: 'open', urls: [url] };
    }
  }

  // FALLBACK: pesquisa no Google
  if (raw.length > 2) {
    return { action: 'open', urls: [`https://google.com/search?q=${encodeURIComponent(raw)}`], fallback: true };
  }

  return null;
}

/* ── Executa ── */
function executeCommand(cmd, callback) {
  if (!cmd) { callback({ success: false, msg: 'Não entendi o comando.' }); return; }

  switch(cmd.action) {

    case 'open': {
      if (cmd.urls.length === 1) {
        chrome.tabs.create({ url: cmd.urls[0] });
        const label = cmd.fallback ? `Pesquisando: "${cmd.urls[0].split('q=')[1]?.slice(0,40)}"` : cmd.urls[0];
        callback({ success: true, msg: `Abrindo: ${label}` });
      } else {
        cmd.urls.forEach(url => chrome.tabs.create({ url }));
        callback({ success: true, msg: `Abrindo ${cmd.urls.length} abas!` });
      }
      break;
    }

    case 'close_tab': {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab) chrome.tabs.remove(tab.id);
        callback({ success: true, msg: 'Aba fechada!' });
      });
      break;
    }

    case 'new_tab': {
      chrome.tabs.create({ url: 'chrome://newtab/' });
      callback({ success: true, msg: 'Nova aba aberta!' });
      break;
    }

    case 'back': {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => history.back() });
        callback({ success: true, msg: 'Voltando...' });
      });
      break;
    }

    case 'reload': {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.reload(tab.id);
        callback({ success: true, msg: 'Página recarregada!' });
      });
      break;
    }

    case 'scroll': {
      const dir = cmd.direction;
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (d) => { window.scrollBy({ top: d === 'down' ? 400 : -400, behavior: 'smooth' }); },
          args: [dir]
        });
        callback({ success: true, msg: dir === 'down' ? 'Rolando para baixo...' : 'Rolando para cima...' });
      });
      break;
    }

    default:
      callback({ success: false, msg: 'Comando não reconhecido.' });
  }
}

/* Expõe globalmente para o popup */
chrome.runtime.onMessage.addListener((msg, _, reply) => {
  if (msg.type === 'CMD_RUN') {
    const cmd = parseCommand(msg.text);
    executeCommand(cmd, result => reply(result));
    return true;
  }
});

})();
