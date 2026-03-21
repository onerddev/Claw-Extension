/* ================================================================
   CLAW — stats.js
   Gerencia estatísticas locais: perguntas respondidas,
   histórico, e cache de respostas do StopotS.
================================================================ */

const ClawStats = (() => {
  const STATS_KEY   = 'claw_stats';
  const HISTORY_KEY = 'claw_history';
  const CACHE_KEY   = 'claw_stop_cache';

  /* ── carrega dados ── */
  function load(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch { return null; }
  }

  function save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
  }

  /* ── estatísticas ── */
  function getStats() {
    return load(STATS_KEY) || {
      kahoot_total: 0,
      kahoot_today: 0,
      stop_total: 0,
      stop_today: 0,
      last_date: null,
    };
  }

  function checkDay(stats) {
    const today = new Date().toDateString();
    if (stats.last_date !== today) {
      stats.kahoot_today = 0;
      stats.stop_today   = 0;
      stats.last_date    = today;
    }
    return stats;
  }

  function addKahoot() {
    const s = checkDay(getStats());
    s.kahoot_total++;
    s.kahoot_today++;
    save(STATS_KEY, s);
  }

  function addStop() {
    const s = checkDay(getStats());
    s.stop_total++;
    s.stop_today++;
    save(STATS_KEY, s);
  }

  /* ── histórico de perguntas ── */
  function getHistory() {
    return load(HISTORY_KEY) || [];
  }

  function addHistory(entry) {
    const h = getHistory();
    h.unshift({ ...entry, ts: Date.now() });
    if (h.length > 100) h.pop();
    save(HISTORY_KEY, h);
  }

  function clearHistory() {
    save(HISTORY_KEY, []);
  }

  /* ── cache do Stop ── */
  function getCache() {
    return load(CACHE_KEY) || {};
  }

  function getCached(letter, cat) {
    const cache = getCache();
    const key   = (letter + '|' + cat).toLowerCase();
    return cache[key] || null;
  }

  function setCache(letter, cat, answer) {
    const cache = getCache();
    const key   = (letter + '|' + cat).toLowerCase();
    cache[key]  = answer;
    // limita a 2000 entradas
    const keys = Object.keys(cache);
    if (keys.length > 2000) delete cache[keys[0]];
    save(CACHE_KEY, cache);
  }

  function clearCache() {
    save(CACHE_KEY, {});
  }

  function getCacheSize() {
    return Object.keys(getCache()).length;
  }

  return { getStats, addKahoot, addStop, getHistory, addHistory, clearHistory, getCached, setCache, clearCache, getCacheSize };
})();

window.ClawStats = ClawStats;
