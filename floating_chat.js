/* CLAW — floating_chat.js v26 | Full popup via iframe + Draggable FAB */
(function(){
'use strict';
if(window.__clawChat__) return;
window.__clawChat__ = true;

let open = false;

const ICON_URL = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
  ? chrome.runtime.getURL('claude-icon.png')
  : 'claude-icon.png';

const POPUP_URL = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
  ? chrome.runtime.getURL('popup.html')
  : 'popup.html';

/* ── Styles ── */
const style = document.createElement('style');
style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

#__claw_fab__{
  position:fixed!important;
  width:50px;height:50px;border-radius:14px;z-index:2147483646!important;
  background:#1e1e22;
  border:1px solid rgba(255,255,255,.07);
  cursor:grab;
  box-shadow:0 6px 24px rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;
  transition:transform .2s ease, box-shadow .2s ease;
  user-select:none;padding:0;overflow:hidden;
}
#__claw_fab__.dragging{cursor:grabbing;transition:none!important}
#__claw_fab__ img{
  width:28px;height:28px;object-fit:contain;
  transition:transform .2s ease;
  pointer-events:none;
}
#__claw_fab__:hover{
  transform:scale(1.06);
  box-shadow:0 8px 32px rgba(0,0,0,.6);
  border-color:rgba(255,255,255,.1);
}
#__claw_fab__:hover img{transform:rotate(-8deg)}
#__claw_fab__:active{transform:scale(.94)}

#__claw_panel__{
  position:fixed!important;
  width:390px;z-index:2147483647!important;
  background:rgba(22,22,26,.98);
  border:1px solid rgba(255,255,255,.08);
  border-radius:16px;
  box-shadow:0 24px 64px rgba(0,0,0,.6),0 4px 16px rgba(0,0,0,.3);
  display:none;flex-direction:column;overflow:hidden;
  backdrop-filter:blur(40px);
  -webkit-backdrop-filter:blur(40px);
  max-height:600px;
  height:580px;
}
#__claw_panel__.open{
  display:flex;
  animation:__claw_in .22s ease both;
}

@keyframes __claw_in{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:none}
}

#__claw_panel__ iframe{
  width:100%;height:100%;border:none;border-radius:16px;
  background:transparent;
}
`;
document.head.appendChild(style);

/* ── Position state ── */
let fabX, fabY;
const MARGIN = 24;
const FAB_SIZE = 50;
const PANEL_W = 390;
const PANEL_H = 580;
const PANEL_GAP = 10;

function initPosition() {
  fabX = window.innerWidth - FAB_SIZE - MARGIN;
  fabY = window.innerHeight - FAB_SIZE - MARGIN;
  applyFabPosition();
}

function applyFabPosition() {
  fab.style.left = fabX + 'px';
  fab.style.top = fabY + 'px';
  fab.style.right = 'auto';
  fab.style.bottom = 'auto';
  updatePanelPosition();
}

function updatePanelPosition() {
  let panelLeft = fabX + FAB_SIZE - PANEL_W;
  if (panelLeft < 8) panelLeft = fabX;
  if (panelLeft + PANEL_W > window.innerWidth - 8) panelLeft = window.innerWidth - PANEL_W - 8;

  let panelTop;
  const spaceAbove = fabY;
  const spaceBelow = window.innerHeight - fabY - FAB_SIZE;

  if (spaceAbove > PANEL_H + PANEL_GAP) {
    panelTop = fabY - PANEL_H - PANEL_GAP;
  } else if (spaceBelow > PANEL_H + PANEL_GAP) {
    panelTop = fabY + FAB_SIZE + PANEL_GAP;
  } else {
    panelTop = Math.max(8, fabY - PANEL_H - PANEL_GAP);
  }

  panel.style.left = panelLeft + 'px';
  panel.style.top = panelTop + 'px';
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';
}

/* ── FAB ── */
const fab = document.createElement('button');
fab.id = '__claw_fab__';
fab.innerHTML = `<img src="${ICON_URL}" alt="Claw"/>`;
fab.title = 'Claw — arraste para mover';
document.body.appendChild(fab);

/* ── Drag logic ── */
let isDragging = false;
let dragStartX, dragStartY, dragFabStartX, dragFabStartY;
let didDrag = false;

fab.addEventListener('mousedown', onDragStart);
fab.addEventListener('touchstart', onDragStart, { passive: false });

function onDragStart(e) {
  const ev = e.touches ? e.touches[0] : e;
  isDragging = true;
  didDrag = false;
  dragStartX = ev.clientX;
  dragStartY = ev.clientY;
  dragFabStartX = fabX;
  dragFabStartY = fabY;
  fab.classList.add('dragging');
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onDragMove, { passive: false });
  document.addEventListener('touchend', onDragEnd);
  e.preventDefault();
}

function onDragMove(e) {
  if (!isDragging) return;
  const ev = e.touches ? e.touches[0] : e;
  const dx = ev.clientX - dragStartX;
  const dy = ev.clientY - dragStartY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
  fabX = Math.max(0, Math.min(window.innerWidth - FAB_SIZE, dragFabStartX + dx));
  fabY = Math.max(0, Math.min(window.innerHeight - FAB_SIZE, dragFabStartY + dy));
  applyFabPosition();
  e.preventDefault();
}

function onDragEnd() {
  isDragging = false;
  fab.classList.remove('dragging');
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('touchmove', onDragMove);
  document.removeEventListener('touchend', onDragEnd);
  if (!didDrag) togglePanel();
}

/* ── Panel with iframe ── */
const panel = document.createElement('div');
panel.id = '__claw_panel__';
panel.innerHTML = `<iframe src="${POPUP_URL}" allow="microphone"></iframe>`;
document.body.appendChild(panel);

/* ── Init position ── */
initPosition();
window.addEventListener('resize', () => {
  fabX = Math.min(fabX, window.innerWidth - FAB_SIZE);
  fabY = Math.min(fabY, window.innerHeight - FAB_SIZE);
  applyFabPosition();
});

function togglePanel(){
  open = !open;
  panel.classList.toggle('open', open);
  if(open) updatePanelPosition();
}

})();
