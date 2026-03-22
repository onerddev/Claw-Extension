/* CLAW — stats.js | Desenvolvido por Emanuel Felipe */
(function () {
  function load(k) { try { return JSON.parse(localStorage.getItem(k)||'null'); } catch { return null; } }
  function save(k,v) { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} }
  const today = () => new Date().toDateString();
  function gs() {
    const s = load('claw_stats') || {kt:0,kd:0,st:0,sd:0,day:null};
    if (s.day !== today()) { s.kd=0; s.sd=0; s.day=today(); }
    return s;
  }
  window.ClawStats = {
    addKahoot()  { const s=gs(); s.kt++; s.kd++; save('claw_stats',s); },
    addStop()    { const s=gs(); s.st++; s.sd++; save('claw_stats',s); },
    getStats:    gs,
    getHistory() { return load('claw_history')||[]; },
    addHistory(e){ const h=load('claw_history')||[]; h.unshift({...e,ts:Date.now()}); if(h.length>100)h.pop(); save('claw_history',h); },
    clearHistory(){ save('claw_history',[]); },
    getCached(l,c){ const cc=load('claw_stop_cache')||{}; return cc[(l+'|'+c).toLowerCase()]||null; },
    setCache(l,c,a){ const cc=load('claw_stop_cache')||{}; const k=(l+'|'+c).toLowerCase(); cc[k]=a; const ks=Object.keys(cc); if(ks.length>3000)delete cc[ks[0]]; save('claw_stop_cache',cc); },
    getCacheSize(){ return Object.keys(load('claw_stop_cache')||{}).length; },
    clearCache(){ save('claw_stop_cache',{}); },
  };
})();
