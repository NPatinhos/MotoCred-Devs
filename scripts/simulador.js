// src/js/simulador.js
// Simulador pós-aprovação: sliders (total/entrada), limites, prazos, parcela.
// - Lê limites de getAnaliseCredito()
// - Pede cálculo de parcela ao flowController (quando sua API existir)
// - Salva a escolha final via setSimulacaoEscolhida()
// - Não decide navegação; só UI da simulação.

import { getAnaliseCredito, setSimulacaoEscolhida } from './appState.js';
import { calcularParcelaRemota } from './flowController.js';

// ------------------------------
// Ajuste os seletores ao seu HTML
// (supondo que a simulação esteja em #pagina-aprovado ou #pagina-simulacao)
// ------------------------------
const SEL = {
  container:    '#pagina-aprovado', // ou '#pagina-simulacao' se for separado
  rangeTotal:   '#sim_valor_moto',        // <input type="range">
  rangeEntrada: '#sim_valor_entrada',     // <input type="range">
  outTotal:     '#sim_valor_moto_num',    // <span>
  outEntrada:   '#sim_valor_entrada_num', // <span>
  outFin:       '#sim_valor_financiado_num', // <span>
  prazoBtns:    '[data-prazo]',           // <button data-prazo="12|24|36">
  outParcela:   '#sim_valor_parcela',     // <span> "R$ X/mês"
  btnConcluir:  '#sim_btn_concluir',      // <button> finalizar escolha
};

const $  = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
const fmtBRL = (n) => (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

// Preenche a “trilha” do range com gradiente (opcional; se não usar, remova)
function syncRangeFill(input) {
  const min = Number(input.min||0);
  const max = Number(input.max||100);
  const val = Number(input.value||0);
  const pct = ((val - min) / (max - min)) * 100;
  input.style.background = `linear-gradient(to right, currentColor ${pct}%, #e5e7eb ${pct}%)`;
}

export function initSimulador() {
  const root = $(SEL.container);
  if (!root) return;

  const analise = getAnaliseCredito() || {};
  // Esperado da análise (ajuste nomes conforme seu objeto):
  // limiteMaxFinanciado: número máximo financiável
  // prazosPermitidos: ex [12,24,36]
  // taxaMensal: ex 0.025 (caso API de parcela não esteja pronta)
  const limiteMax = Number(analise.limiteMaxFinanciado ?? 0);
  const prazos    = Array.isArray(analise.prazosPermitidos) ? analise.prazosPermitidos : [12,24,36];

  // elementos
  const rTotal    = $(SEL.rangeTotal, root);
  const rEntrada  = $(SEL.rangeEntrada, root);
  const sTotal    = $(SEL.outTotal, root);
  const sEntrada  = $(SEL.outEntrada, root);
  const sFin      = $(SEL.outFin, root);
  const btnsPrazo = $$(SEL.prazoBtns, root);
  const sParcela  = $(SEL.outParcela, root);
  const btnGo     = $(SEL.btnConcluir, root);

  if (!rTotal || !rEntrada || !sTotal || !sEntrada || !sFin || !btnsPrazo.length || !sParcela || !btnGo) {
    // elementos faltando; não inicia
    return;
  }

  // estado local
  let total     = sanitizeNum(rTotal.value, 5000);
  let entrada   = sanitizeNum(rEntrada.value, 0);
  let financiado= clamp(total - entrada, 0, limiteMax);
  let prazoSel  = prazos[0] ?? 12;
  let parcela   = 0;

  // configura min/max coerentes
  // (assuma que o HTML já tenha min/max; se não, definimos alguns defaults)
  if (!rTotal.min)   rTotal.min = '2000';
  if (!rTotal.max)   rTotal.max = String(Math.max(total, 100000));
  if (!rEntrada.min) rEntrada.min = '0';
  if (!rEntrada.max) rEntrada.max = rTotal.max;

  // sync inicial
  applyStateToUI('init');

  // listeners
  rTotal.addEventListener('input', () => {
    total = sanitizeNum(rTotal.value, total);
    // garantir que entrada <= total
    if (entrada > total) {
      entrada = total;
      rEntrada.value = String(entrada);
    }
    financiado = clamp(total - entrada, 0, limiteMax);
    applyStateToUI('total');
  });

  rEntrada.addEventListener('input', () => {
    entrada = sanitizeNum(rEntrada.value, entrada);
    // trava pra não passar do total
    entrada = Math.min(entrada, total);
    rEntrada.value = String(entrada);
    financiado = clamp(total - entrada, 0, limiteMax);
    // se bateu limiteMax, empurra entrada pra manter financiado no teto
    if ((total - entrada) > limiteMax) {
      entrada = total - limiteMax;
      rEntrada.value = String(entrada);
      financiado = limiteMax;
    }
    applyStateToUI('entrada');
  });

  btnsPrazo.forEach(btn => {
    const p = Number(btn.getAttribute('data-prazo'));
    // desabilita botões não permitidos
    if (!prazos.includes(p)) {
      btn.setAttribute('disabled', 'true');
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      return;
    }
    btn.addEventListener('click', async () => {
      btnsPrazo.forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      prazoSel = p;
      await atualizarParcela(); // consulta API (ou fallback local)
      applyStateToUI('prazo');
    });
  });

  btnGo.addEventListener('click', () => {
    // salva escolha final no estado global
    setSimulacaoEscolhida({
      valorMoto: total,
      entrada,
      financiamento: financiado,
      prazo: prazoSel,
      valorParcela: parcela,
    });
    // daqui em diante, você pode navegar para uma próxima view (assinatura, proposta, etc.)
    // a navegação NÃO é responsabilidade deste módulo.
  });

  // seleciona visualmente o primeiro prazo permitido e calcula parcela
  (async function bootPrazo() {
    const initiallyPressed = btnsPrazo.find(b => Number(b.getAttribute('data-prazo')) === prazoSel && !b.disabled);
    if (initiallyPressed) {
      initiallyPressed.setAttribute('aria-pressed', 'true');
    }
    await atualizarParcela();
    applyStateToUI('boot');
  })();

  // ---------------- helpers locais ----------------

  function sanitizeNum(v, fallback=0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  async function atualizarParcela() {
    // tenta via flowController (API futura). se não houver, ele faz fallback PMT.
    const res = await calcularParcelaRemota({ valorFinanciado: financiado, prazo: prazoSel });
    if (res?.ok) {
      parcela = Number(res.valorParcela) || 0;
    } else {
      parcela = 0;
    }
  }

  function applyStateToUI(reason) {
    // spans
    sTotal.textContent   = fmtBRL(total);
    sEntrada.textContent = fmtBRL(entrada);
    sFin.textContent     = fmtBRL(financiado);
    sParcela.textContent = parcela ? `${fmtBRL(parcela)}/mês` : '—';

    // ranges e fill
    rTotal.value = String(total);
    rEntrada.value = String(entrada);
    syncRangeFill(rTotal);
    syncRangeFill(rEntrada);

    // opcional: atualizar título/observações com limite
    // ex.: mostrar "Limite: R$ X"
    const elLim = $('[data-sim-limite]', root);
    if (elLim) elLim.textContent = fmtBRL(limiteMax);

    // se financiado == limiteMax, você pode destacar visualmente
    const finHolder = sFin.closest('[data-field]');
    if (finHolder) {
      finHolder.classList.toggle('ring-2', financiado === limiteMax);
    }
  }
}
