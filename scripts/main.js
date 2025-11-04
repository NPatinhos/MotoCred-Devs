// main.js
// Bootstrap com checagens de elementos e listeners de navegação.

import { renderView } from './uiRenderer.js';
import { initFormSteps } from './formSteps.js';
import {
  initStepBar,
  initializeNavigation,
  updateEtapasBarra,
  resetCriticalState,
} from './stepNavigation.js';
import { clearAllTooltips } from './validators.js';

function safeBootstrap() {
  console.log('[MAIN] Inicializando aplicação...');

  // Checagem rápida de elementos críticos conforme seu HTML
  const must = [
    '#financiamento-form',
    '#btnNext',
    '#btnPrev',
    '#tab-step-1',
    '#tab-step-2',
    '#tab-step-3',
    '#tab-step-4',
    '#etapa-1',
    '#etapa-2',
    '#etapa-3',
    '#etapa-4',
  ];
  must.forEach((sel) => {
    const ok = !!document.querySelector(sel);
    console[ok ? 'log' : 'warn'](`[CHECK] ${sel} ${ok ? 'OK' : 'NÃO ENCONTRADO'}`);
  });

  // Suporte a devStep via query (?devStep=etapa-3)
  const params = new URLSearchParams(window.location.search);
  const devStep = params.get('devStep');
  resetCriticalState();
  initializeNavigation();

  renderView();
  updateEtapasBarra();

  initFormSteps();
  initStepBar();

document.addEventListener('nav:changed', (e) => {
  console.log(`[EVENT] nav:changed → ${e.detail.viewId}`);
  initializeNavigation();
  clearAllTooltips();     // ← remove qualquer balão remanescente
  renderView();
  updateEtapasBarra();
});


  console.log('[MAIN] initFormSteps() OK');
  console.log('[MAIN] initStepBar() OK');
}

// Garante execução após DOM pronto (ou imediatamente se já estiver)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[MAIN] DOMContentLoaded');
    safeBootstrap();
  });
} else {
  safeBootstrap();
}
