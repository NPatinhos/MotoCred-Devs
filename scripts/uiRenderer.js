// uiRenderer.js
// Renderiza a etapa atual e controla opacidade do botão Voltar.

import { getState } from './stepNavigation.js';

const ORDER = ['etapa-1', 'etapa-2', 'etapa-3', 'etapa-4'];
const byId = (id) => document.getElementById(id);
const $ = (s) => document.querySelector(s);

function hide(node) {
  node?.classList?.add('hidden');
}
function show(node) {
  node?.classList?.remove('hidden');
}

function setBackButtonOpacity() {
  const backBtn = $('#btnPrev'); // ← seu ID atual
  if (!backBtn) return;

  const { currentView } = getState();
  const isFirst = ORDER.indexOf(currentView) === 0;

  // Sem transição: 0% só na primeira etapa
  backBtn.style.transition = 'none';
  backBtn.style.opacity = isFirst ? '0' : '1';
  backBtn.style.pointerEvents = isFirst ? 'none' : 'auto';
  console.log(`[UI] BackButton → ${isFirst ? 'oculto' : 'visível'}`);
}

function showOnlyCurrentView() {
  const { currentView } = getState();
  ORDER.forEach((viewId) => hide(byId(viewId)));
  show(byId(currentView));

  // Ajuste das classes auxiliares se você usa "is-active" visual nas sections
  ORDER.forEach((id) => byId(id)?.classList?.remove('is-active'));
  byId(currentView)?.classList?.add('is-active');

  console.log(`[UI] Renderizando view → ${currentView}`);
}

export function renderView() {
  showOnlyCurrentView();
  setBackButtonOpacity();
}
