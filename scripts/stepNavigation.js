// stepNavigation.js
// Controla toda navegação entre etapas + estado global mínimo.
import { getMaxStepReached, setMaxStepReached } from './appState.js';


const ORDER = ['etapa-1', 'etapa-2', 'etapa-3', 'etapa-4'];

const VIEW_TO_TAB = {
  'etapa-1': 'tab-step-1',
  'etapa-2': 'tab-step-2',
  'etapa-3': 'tab-step-3',
  'etapa-4': 'tab-step-4',
};
const TAB_TO_VIEW = {
  'tab-step-1': 'etapa-1',
  'tab-step-2': 'etapa-2',
  'tab-step-3': 'etapa-3',
  'tab-step-4': 'etapa-4',
};

const $ = (s) => document.querySelector(s);
const byId = (id) => document.getElementById(id);

// ===== Estado mínimo =====
const state = {
  currentView: ORDER[0],
  form: { tipoUsuario: null },
  maxStepIndex: 0, // 0-based = etapa-1
};

export function getState() {
  return state;
}

export function setState(patch = {}) {
  Object.assign(state, patch);
}

export function setView(viewId) {
  if (!ORDER.includes(viewId)) return;

  const viewIndex = ORDER.indexOf(viewId);
  console.log(`[NAV] setView → ${viewId}`);

  state.currentView = viewId;
  state.maxStepIndex = Math.max(state.maxStepIndex, viewIndex);

  setMaxStepReached(state.maxStepIndex + 1); // mantém o global (1-based)
  document.dispatchEvent(new CustomEvent('nav:changed', { detail: { viewId } }));
}


function isEtapa2Locked() {
  return state?.form?.tipoUsuario === 'comprador';
}

// ===== Navegação =====
export function goTo(viewId) {
  if (!ORDER.includes(viewId)) return;

  const targetIndex = ORDER.indexOf(viewId);
  const maxAllowed = state.maxStepIndex;

  if (targetIndex > maxAllowed) {
    console.warn(`[NAV] Ignorado: ${viewId} ainda não foi liberada`);
    return;
  }

  if (viewId === 'etapa-2' && isEtapa2Locked()) {
    console.warn('[NAV] Etapa 2 travada para comprador');
    return;
  }

  setView(viewId);
  updateEtapasBarra();
}


export function nextStep() {
  const i = ORDER.indexOf(state.currentView);
  if (i === -1 || i >= ORDER.length - 1) return;

  let target = ORDER[i + 1];
  if (target === 'etapa-2' && isEtapa2Locked()) {
    target = 'etapa-3';
    console.log('[NAV] Pulando etapa 2 (travada)');
  }

  console.log(`[NAV] nextStep → ${target}`);
  setView(target);
  updateEtapasBarra();
}

export function prevStep() {
  const i = ORDER.indexOf(state.currentView);
  if (i <= 0) return;

  let target = ORDER[i - 1];
  if (target === 'etapa-2' && isEtapa2Locked()) {
    target = 'etapa-1';
    console.log('[NAV] Pulando etapa 2 (travada)');
  }

  console.log(`[NAV] prevStep → ${target}`);
  setView(target);
  updateEtapasBarra();
}


// ===== Barra de etapas =====
export function initStepBar() {
  console.log('[INIT] initStepBar()');
  Object.keys(TAB_TO_VIEW).forEach((tabId) => {
    const el = byId(tabId);
    if (!el) return;

    el.addEventListener('click', () => {
      const viewId = TAB_TO_VIEW[tabId];

      if (!el.classList.contains('is-complete')) return;
      if (viewId === 'etapa-2' && isEtapa2Locked()) return;

      console.log(`[CLICK] Barra → ${viewId}`);
      goTo(viewId);
    });
  });

  updateEtapasBarra();
}

export function updateEtapasBarra() {
  const current = state.currentView;
  const currentIndex = ORDER.indexOf(current);
  const maxIndex = state.maxStepIndex;
  const locked2 = isEtapa2Locked();

    ORDER.forEach((viewId) => {
    const tabId = VIEW_TO_TAB[viewId];
    const btn = byId(tabId);
    if (!btn) return;

    btn.classList.remove('is-active', 'is-complete', 'is-future', 'is-locked');
    btn.removeAttribute('disabled');
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('aria-disabled', 'false');

    const index = ORDER.indexOf(viewId);
    const lockedStep2 = viewId === 'etapa-2' && locked2;

    if (viewId === current) {
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      return;
    }

    if (index <= maxIndex) {
      btn.classList.add('is-complete');

      if (lockedStep2) {
        btn.classList.add('is-locked');
        btn.setAttribute('aria-disabled', 'true');
        btn.setAttribute('disabled', 'true');
      }
      return;
    }

    btn.classList.add('is-future');
    btn.setAttribute('aria-disabled', 'true');
    btn.setAttribute('disabled', 'true');

    if (lockedStep2) {
      btn.classList.add('is-locked');
    }
  });


  console.log(`[UI] updateEtapasBarra() → etapa atual: ${current}`);
}


// ===== Campos que afetam navegação =====
export function setTipoUsuario(value) {
  state.form.tipoUsuario = value || null;
  console.log(`[STATE] tipoUsuario = ${state.form.tipoUsuario}`);
  updateEtapasBarra();
}

export function initializeNavigation({ initialView } = {}) {
  console.log('[INIT] initializeNavigation()');
  if (initialView && ORDER.includes(initialView)) {
  state.currentView = initialView;
  state.maxStepIndex = ORDER.indexOf(initialView);
  setMaxStepReached(state.maxStepIndex + 1);
}
  updateEtapasBarra();
}

// Função para resetar apenas os campos críticos de navegação/fluxo
export function resetCriticalState() {
  state.currentView = ORDER[0]; // Volta para 'etapa-1'
  state.form.tipoUsuario = null; // Zera o tipo de usuário
  // Se houver campos que persistem no HTML (como input hidden),
  // a limpeza deles deve ser feita no formSteps.js
}

