// src/js/resultado.js
// Mostra dados da análise na tela de Aprovado/Reprovado
// e faz o bind dos botões de ação.

import { getAnaliseCredito, setView } from './appState.js';
import { iniciarSimulacao } from './flowController.js';
import { renderView } from './uiRenderer.js';

// ------------------------------
// Ajuste os seletores conforme seu HTML
// ------------------------------
const SELS = {
  aprovado: {
    container: '#pagina-aprovado',
    limite: '#aprovado_limite',         // <span>
    taxa: '#aprovado_taxa',             // <span> exibe "2,5% a.m."
    prazos: '#aprovado_prazos',         // <span> exibe "12x, 24x, 36x"
    btnContinuar: '#btnContinuarSimulacao',
  },
  negado: {
    container: '#pagina-negado',
    motivo: '#negado_motivo',           // <span>
    btnVoltar: '#btnNegadoVoltar',      // leva de volta para etapa-4 (ou 1)
  },
};

// Helpers
const $ = (s) => document.querySelector(s);
const fmtBRL = (n) =>
  (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtPct = (n) =>
  `${(Number(n) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

// ------------------------------
// Renderização
// ------------------------------
export function renderResultado(currentView = 'aprovado', analise = getAnaliseCredito()) {
  if (currentView === 'aprovado') {
    renderAprovado(analise);
  } else {
    renderNegado(analise);
  }
}

function renderNegado(analise) {
  // Ex.: analise = { status: 'reprovado', motivo: 'score_insuficiente' }
  const motivo = analise?.motivo || 'Não elegível no momento.';
  const elMotivo = $(SELS.negado.motivo);
  if (elMotivo) elMotivo.textContent = traduzMotivo(motivo);
}

function traduzMotivo(code) {
  // mapeie códigos para mensagens amigáveis conforme seu backend
  const map = {
    falha_envio: 'Não foi possível processar os dados. Tente novamente.',
    score_insuficiente: 'Análise de crédito não aprovada.',
  };
  return map[code] || code;
}

// ------------------------------
// Bind dos botões
// ------------------------------
export function initResultadoView() {
  // Aprovado → Continuar para simulação
  const btnContinuar = $(SELS.aprovado.btnContinuar);
  if (btnContinuar) {
    btnContinuar.addEventListener('click', () => {
      iniciarSimulacao();   // setView('simulacao')
      renderView();
    });
  }

  // Reprovado → Voltar (decida o destino que faz sentido no seu fluxo)
  const btnVoltar = $(SELS.negado.btnVoltar);
  if (btnVoltar) {
    btnVoltar.addEventListener('click', () => {
      // exemplo: voltar para etapa-4 pra tentar valores diferentes
      setView('etapa-4');
      renderView();
    });
  }
}
