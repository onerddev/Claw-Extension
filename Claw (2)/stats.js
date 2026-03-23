/* CLAW — stats.js v18 | Emanuel Felipe */
(function(){
  const L = k => { try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch{ return null; } };
  const S = (k,v) => { try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} };
  const today = () => new Date().toDateString();

  function gs(){
    const s = L('claw_stats') || {kt:0,kd:0,st:0,sd:0,day:null,streak:0,lastDay:null};
    const t = today();
    if(s.day !== t){ s.kd=0; s.sd=0; s.day=t; }
    return s;
  }

  window.ClawStats = {
    addKahoot(){ const s=gs(); s.kt++; s.kd++; S('claw_stats',s); },
    addStop(){   const s=gs(); s.st++; s.sd++; S('claw_stats',s); },
    getStats: gs,

    getHistory(){ return L('claw_history')||[]; },
    addHistory(e){
      const h=L('claw_history')||[];
      h.unshift({...e, ts:Date.now()});
      if(h.length>200) h.pop();
      S('claw_history',h);
    },
    clearHistory(){ S('claw_history',[]); },

    /* Cache Stop */
    getCached(l,c){ const cc=L('claw_stop_cache')||{}; return cc[(l+'|'+c).toLowerCase()]||null; },
    setCache(l,c,a){
      const cc=L('claw_stop_cache')||{};
      const k=(l+'|'+c).toLowerCase();
      cc[k]=a;
      const ks=Object.keys(cc);
      if(ks.length>5000) delete cc[ks[0]];
      S('claw_stop_cache',cc);
    },
    getCacheSize(){ return Object.keys(L('claw_stop_cache')||{}).length; },
    clearCache(){ S('claw_stop_cache',{}); },

    /* Kahoot: registra acerto/erro */
    addResult(correct){
      const r=L('claw_results')||{correct:0,wrong:0};
      if(correct) r.correct++; else r.wrong++;
      S('claw_results',r);
    },
    getResults(){ return L('claw_results')||{correct:0,wrong:0}; },
    clearResults(){ S('claw_results',{correct:0,wrong:0}); },
  };
})();
