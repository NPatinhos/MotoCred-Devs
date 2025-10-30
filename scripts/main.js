// main.js
// Ponto de inicialização da aplicação (modo módulo ES).

import { renderView } from './uiRenderer.js';
import { initFormSteps } from './formSteps.js';
import { initResultadoView } from './resultado.js';
import { initSimulador } from './simulador.js';
import { getCurrentView, setDevOverride } from './appState.js';
import { initFlowController } from './flowController.js';
import { postToAppsScript } from './api.js';

// [DEBUG] util de log
const D = (...a) => console.log('[MAIN]', ...a);
window.__DBG = true;

// ------------------------------------------------------------
// 🧩 1. MODO DEV (opcional)
// ------------------------------------------------------------
// Use setDevOverride('etapa-3') ou 'simulacao' para pular direto.
// Comente/remova esta linha no deploy.
setDevOverride('etapa-1');

// ------------------------------------------------------------
// ⚙️ 2. INJETAR SUAS APIS NO FLOW CONTROLLER
// ------------------------------------------------------------
initFlowController({
  enviarFormularioDados: async (payload) => {
    try {
      const r = await postToAppsScript(payload);
      return { ok: r.success };
    } catch (err) {
      console.error('Erro no envio:', err);
      return { ok: false };
    }
  },
  // consultarAnaliseCredito, calcularParcelas, acaoPosPPA
  // serão adicionadas quando suas APIs estiverem prontas.
});

// ------------------------------------------------------------
// 🚀 3. INICIALIZAR MÓDULOS DE UI
// ------------------------------------------------------------
D('boot');
D('setDevOverride já chamado');

D('initFlowController: injetando enviarFormularioDados');

// Renderiza a view inicial baseada no appState
renderView();
D('renderView() inicial chamada');

// Inicializa as seções do app
initFormSteps();      // etapas 1–4
D('initFormSteps() OK');
initResultadoView();  // tela reprovado (negado)
D('initResultadoView() OK');

// Função que ativa o simulador quando a view mudar pra "simulacao"
function checkAndInitSimulador() {
  const v = getCurrentView();
  D('view atual após init:', v);
  if (v === 'simulacao') 
    D('initSimulador() na carga inicial');
    initSimulador();
}

// Roda na carga inicial
checkAndInitSimulador();

// Se quiser, no futuro você pode amarrar esse check a um observer de mudança de view
// (ex.: sempre que chamar setView() + renderView(), rodar checkAndInitSimulador()).
