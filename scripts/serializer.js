// serializer.js
// Constrói o payload final a partir do appState (sem DOM)
// Opcional: função extra para serializar diretamente de um <form> (modo legado)

import { getFormData } from './appState.js';

/**
 * Gera um ID simples de submissão. Troque se quiser outro padrão.
 */
function generateSubmissionId() {
  return `SUB-${Date.now()}`; // ex.: SUB-1730299965123
}

/**
 * Serializa os dados do fluxo (armazenados no appState) para o formato
 * esperado pelo Apps Script / planilha.
 * Não acessa DOM. Não faz fetch. Apenas monta o objeto.
 */
export function serializeFormToPayload() {
  const f = getFormData();

  return {
    // metadados
    submission_id: f.submission_id || generateSubmissionId(),

    // identificação / vendedor
    tipo_usuario: f.tipoUsuario ?? "",
    loja: f.loja ?? "",
    nome_vendedor: f.nomeVendedor ?? "",
    email_vendedor: f.emailVendedor ?? "",

    // cliente
    nome_cliente: f.nomeCliente ?? "",
    cpf: f.cpf ?? "",
    cnh: f.possuiCNH ? "sim" : "nao",
    email_cliente: f.emailCliente ?? "",
    telefone: f.telefoneCliente ?? "",

    // venda (números já devem estar limpos no appState)
    renda_mensal: numberOrNull(f.rendaMensal),
    valor_moto: numberOrNull(f.valorMoto),
    valor_entrada: numberOrNull(f.valorEntrada),
  };
}

// ------------------------
// OPCIONAL (modo legado):
// Se ainda precisar montar o payload direto de um <form> do DOM.
// Útil só enquanto migra pro appState.
// ------------------------
export function serializeFormFromDOM(formEl, { numFromInput } = {}) {
  if (!formEl) throw new Error("serializeFormFromDOM: formEl ausente");

  const get = (name) => formEl.elements?.[name]?.value?.trim() ?? "";

  const renda = getNumericFromMaskedInput('#renda_mensal');
  const vMoto = getNumericFromMaskedInput('#valor_moto');
  const vEnt  = getNumericFromMaskedInput('#valor_entrada');

  return {
    submission_id: get("submission_id") || generateSubmissionId(),
    tipo_usuario: get("tipo_usuario"),
    loja: get("loja"),
    nome_vendedor: get("nome_vendedor"),
    email_vendedor: get("email_vendedor"),
    nome_cliente: get("nome_cliente"),
    cpf: get("cpf"),
    cnh: get("cnh"),
    email_cliente: get("email_cliente"),
    telefone: get("telefone"),
    renda_mensal: renda,
    valor_moto:   vMoto,
    valor_entrada:vEnt,
  };

  function getNumericFromMaskedInput(selector) {
    const el = formEl.querySelector(selector);
    if (!el) return null;
    // preferir função injetada do seu moneyMask (mais confiável)
    if (typeof numFromInput === 'function') return numFromInput(el);
    // fallback simples: extrai dígitos e converte para número com 2 casas
    const digits = String(el.value || "").replace(/\D/g, "");
    if (!digits) return null;
    const intPart = digits.slice(0, -2) || "0";
    const cents   = digits.slice(-2);
    return Number(`${intPart}.${cents}`);
  }
}

// ------------------------
// helpers
// ------------------------
function numberOrNull(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}
