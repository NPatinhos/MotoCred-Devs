// stepNavigation.js

import { getState, setView, setState } from './appState.js';
import { renderView } from './uiRenderer.js';

const STEP_TABS = [
  'tab-step-1',
  'tab-step-2',
  'tab-step-3',
  'tab-step-4'
];

const VIEW_TO_TAB = {
  'etapa-1': 'tab-step-1',
  'etapa-2': 'tab-step-2',
  'etapa-3': 'tab-step-3',
  'etapa-4': 'tab-step-4'
};

const TAB_TO_VIEW = {
  'tab-step-1': 'etapa-1',
  'tab-step-2': 'etapa-2',
  'tab-step-3': 'etapa-3',
  'tab-step-4': 'etapa-4'
};

const F = (...args) => console.log('[FORM]', ...args);

// --- Navega entre etapas ---
export function goTo(viewId) {
  const { maxStepReached } = getState();
  setView(viewId);

  const stepNum = parseInt(viewId.replace('etapa-', ''), 10);
  if (!isNaN(stepNum) && stepNum > maxStepReached) {
    setState({ maxStepReached: stepNum });
  }

  renderView();
}

export function getProximaEtapa(currentView) {
  const { tipoUsuario } = getState();
  if (currentView === 'etapa-1') {
    return tipoUsuario === 'comprador' ? 'etapa-3' : 'etapa-2';
  }
  if (currentView === 'etapa-2' || currentView === 'etapa-3') {
    return 'etapa-4';
  }
  return 'etapa-1';
}

export function handleNext() {
  const current = getState().currentView;
  const next = getProximaEtapa(current);
  F('Avançando para', next);
  goTo(next);
}

export function handlePrev() {
  const { currentView, tipoUsuario } = getState();

  if (currentView === 'etapa-2') {
    return goTo('etapa-1');
  }
  if (currentView === 'etapa-3') {
    return tipoUsuario === 'comprador' ? goTo('etapa-1') : goTo('etapa-2');
  }
  if (currentView === 'etapa-4') {
    return tipoUsuario === 'comprador' ? goTo('etapa-3') : goTo('etapa-3');
  }
}

export function bindEtapasBarraClick() {
  const botoes = document.querySelectorAll('.step-tab');
  botoes.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.id;
      const viewId = TAB_TO_VIEW[tabId];
      const { tipoUsuario } = getState();

      if (viewId === 'etapa-2' && tipoUsuario === 'comprador') {
        F('clique ignorado: comprador não pode acessar etapa-2');
        return;
      }

      if (!btn.classList.contains('is-complete') && !btn.classList.contains('is-active')) {
        F('clique ignorado: etapa ainda não completa →', tabId);
        return;
      }

      F('navegando via barra para:', viewId);
      goTo(viewId);
    });
  });
}

export function bindTipoUsuarioButtons() {
  const btns = document.querySelectorAll('[data-tipo-usuario]');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.getAttribute('data-tipo-usuario');
      F('tipoUsuario:', tipo);
      setState({ tipoUsuario: tipo });
      handleNext();
    });
  });
}

export function bindCNHButtons() {
  const btns = document.querySelectorAll('[data-cnh]');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const valor = btn.getAttribute('data-cnh');
      setState({ possuiCNH: valor });
      F('possuiCNH:', valor);
      handleNext();
    });
  });
}

export function updateEtapasBarra() {
  const { currentView, tipoUsuario, maxStepReached } = getState();
  const etapaAtualIndex = STEP_TABS.findIndex(tab => VIEW_TO_TAB[currentView] === tab);

  STEP_TABS.forEach((tabId, index) => {
    const btn = document.getElementById(tabId);
    if (!btn) return;

    const viewId = TAB_TO_VIEW[tabId];
    const stepNum = parseInt(viewId.replace('etapa-', ''), 10);

    btn.classList.remove('is-active', 'is-complete', 'is-future', 'is-locked');
    btn.removeAttribute('disabled');
    btn.setAttribute('aria-disabled', 'false');

    if (viewId === currentView) {
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      F('→', tabId, 'is-active');
      return;
    }

    if (viewId === 'etapa-2' && tipoUsuario === 'comprador') {
      btn.classList.add('is-locked');
      btn.setAttribute('aria-disabled', 'true');
      F('→', tabId, 'is-locked (comprador)');
      return;
    }

    if (stepNum < parseInt(currentView.replace('etapa-', '')) || stepNum <= maxStepReached) {
      btn.classList.add('is-complete');
      F('→', tabId, 'is-complete');
    } else {
      btn.classList.add('is-future');
      btn.setAttribute('disabled', 'true');
      btn.setAttribute('aria-disabled', 'true');
      F('→', tabId, 'is-future');
    }
  });
}

export function initFormSteps() {
  bindTipoUsuarioButtons();
  bindCNHButtons();
}
