/* CLAW — background.js | Desenvolvido por Emanuel Felipe */
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'PING') reply({ ok: true });
  return false;
});
