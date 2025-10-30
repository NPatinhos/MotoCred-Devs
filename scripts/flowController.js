// flowController.js
// Orquestra o pós-formulário: envio, análise (PPA) e decisão (reprovado ou simulação).
// Não toca no DOM.

import {
  getFormData,
  setAnaliseCredito,
  setView,
} from './appState.js';

// ---------------------------------------------------
// PONTOS DE INJEÇÃO (APIs) — começam com mocks/no-op
// Você pode sobrescrever com initFlowController(...)
// ---------------------------------------------------

let apiEnviarFormularioDados = async (_payload) => {
  // Substitua por sua função real (Apps Script/backend)
  return { ok: true };
};

let apiConsultarAnaliseCredito = async (_payload) => {
  // Substitua por sua PPA real. Mock aprova por padrão.
  return {
    ok: true,
    status: 'aprovado', // ou 'reprovado'
    limiteMaxFinanciado: 15000,
    prazosPermitidos: [12, 24, 36],
    taxaMensal: 0.025,
  };
};

// FUTURA: cálculo de parcelas (durante simulação)
let apiCalcularParcelas = async ({ valorFinanciado, prazo }) => {
  const taxa = 0.025; // fallback simples
  return { ok: true, valorParcela: calcPMT(taxa, prazo, valorFinanciado) };
};

// FUTURA: ação pós-PPA (log/webhook/etc). Não bloqueia fluxo.
let apiAcaoPosPPA = async (_ctx) => ({ ok: true });

// ---------------------------------------------------
// INJEÇÃO (chame isso no main.js para plugar suas APIs)
// ---------------------------------------------------

export function initFlowController({
  enviarFormularioDados,
  consultarAnaliseCredito,
  calcularParcelas,
  acaoPosPPA,
} = {}) {
  if (enviarFormularioDados)  apiEnviarFormularioDados  = enviarFormularioDados;
  if (consultarAnaliseCredito) apiConsultarAnaliseCredito = consultarAnaliseCredito;
  if (calcularParcelas)       apiCalcularParcelas       = calcularParcelas;
  if (acaoPosPPA)             apiAcaoPosPPA             = acaoPosPPA;
}

// ---------------------------------------------------
// FLUXO PRINCIPAL
// ---------------------------------------------------

export async function submitFormulario() {
  const payload = getFormData();

  // 1) Envia dados do formulário (ex.: Apps Script)
  const envio = await apiEnviarFormularioDados(payload);
  if (!envio?.ok) {
    setAnaliseCredito({ ok: false, status: 'reprovado', motivo: 'falha_envio' });
    setView('reprovado');
    return { ok: false, etapa: 'envio' };
  }

  // 2) Consulta análise de crédito (PPA)
  const analise = await apiConsultarAnaliseCredito(payload);
  setAnaliseCredito(analise);

  // 3) Ação pós-PPA (assíncrona, não bloqueia UX)
  apiAcaoPosPPA({ tipo: 'posPPA', payload, analise }).catch(() => {});

  // 4) Decide próxima tela
  if (!analise?.ok || analise.status === 'reprovado') {
    setView('reprovado');
    return { ok: false, etapa: 'analise' };
  }

  // Aprovado → direto para simulação (não existe página de "aprovado")
  setView('simulacao');
  return { ok: true };
}

// Entrar (ou reentrar) na simulação manualmente
export function iniciarSimulacao() {
  setView('simulacao');
}

// Utilitário para o simulador usar (API futura com fallback PMT)
export async function calcularParcelaRemota({ valorFinanciado, prazo }) {
  return apiCalcularParcelas({ valorFinanciado, prazo });
}

// ---------------------------------------------------
// HELPER FINANCEIRO LOCAL (PMT) — fallback
// PMT = P * i / (1 - (1+i)^-n)
// ---------------------------------------------------
function calcPMT(taxaMensal, meses, principal) {
  const i = Number(taxaMensal);
  const n = Number(meses);
  const P = Number(principal);

  if (!i || !n) return P / Math.max(n, 1);
  const fator = Math.pow(1 + i, -n);
  return (P * i) / (1 - fator);
}
