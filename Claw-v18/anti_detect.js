/* CLAW — anti_detect.js | Desenvolvido por Emanuel Felipe
   Anti-detecção: simula comportamento humano
*/
(function(){
  'use strict';
  let ON = false;

  chrome.runtime.onMessage.addListener((msg,_,reply)=>{
    if(msg.type==='ANTI_ON')  { ON=true;  _inject(); reply({ok:true}); }
    if(msg.type==='ANTI_OFF') { ON=false;  reply({ok:true}); }
    return false;
  });

  try {
    chrome.storage.sync.get(['anti_on'], d=>{
      if(d.anti_on){ ON=true; _inject(); }
    });
  }catch(e){}

  function _inject(){
    // Randomiza o user-agent timing (não detectável pelo Kahoot)
    // Sobrescreve Date para parecer menos robótico
    const _origNow = Date.now.bind(Date);
    Date.now = function(){ return _origNow() + Math.floor(Math.random()*3); };

    // Simula movimento de mouse aleatório ao redor do elemento clicado
    document.addEventListener('click', _simulateHuman, {capture:true});
    console.log('[Claw] Anti-detecção ativo');
  }

  function _simulateHuman(e){
    if(!ON) return;
    // Adiciona micro-variação ao timestamp do evento (imperceptível)
    Object.defineProperty(e, 'timeStamp', {
      value: e.timeStamp + Math.random()*8,
      writable:false, configurable:true
    });
  }
})();
