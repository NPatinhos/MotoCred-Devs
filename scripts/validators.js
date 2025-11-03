// validators.js
// Exibe balõezinhos de erro (tooltips) junto aos inputs inválidos.
// Não altera HTML nem CSS, apenas cria/remover elementos <div> temporários.

import { getState } from './stepNavigation.js';

const ORDER = ['etapa-1', 'etapa-2', 'etapa-3', 'etapa-4'];
const $ = (s) => document.querySelector(s);

// ===== Regex util =====
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const TEL_RE   = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
const CURRENCY_RE = /^R?\$?\s?\d{1,3}(\.\d{3})*(,\d{2})?$|^\d+([.,]\d{2})?$/;

function onlyDigits(v) { return (v || '').replace(/\D+/g, ''); }
function isValidCPF(strCPF) {
  const cpf = onlyDigits(strCPF);
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  let sum = 0; let rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i-1, i), 10) * (11 - i);
  rest = (sum * 10) % 11; if (rest >= 10) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10), 10)) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i-1, i), 10) * (12 - i);
  rest = (sum * 10) % 11; if (rest >= 10) rest = 0;
  if (rest !== parseInt(cpf.substring(10, 11), 10)) return false;
  return true;
}

// ===== helpers =====
function hasValue(input) { return !!input && String(input.value || '').trim().length > 0; }
function validEmail(input) { return !!input && EMAIL_RE.test(String(input.value || '').trim()); }
function validTelefone(input) { return !!input && TEL_RE.test(String(input.value || '').trim()); }
function validCurrency(input) { return !!input && CURRENCY_RE.test(String(input.value || '').trim()); }
function validCPF(input) { return !!input && isValidCPF(String(input.value || '').trim()); }
function validCNHHidden(input) { 
  if (!input) return false;
  const v = String(input.value || '').trim();
  return v === 'sim' || v === 'nao';
}

// ===== balão de erro =====
function createTooltip(input, message) {
  if (!input) return;
  const id = input.id || Math.random().toString(36).slice(2);
  const existing = document.querySelector(`[data-tooltip-for="${id}"]`);
  if (existing) {
    existing.textContent = message;
    return;
  }

  // container principal do balão
  const tip = document.createElement('div');
  tip.setAttribute('data-tooltip-for', id);
  tip.textContent = message;
  tip.style.position = 'absolute';
  tip.style.background = 'white';
  tip.style.color = 'black';
  tip.style.fontSize = '0.8rem';
  tip.style.padding = '4px 8px';
  tip.style.borderRadius = '6px';
  tip.style.marginTop = '6px';
  tip.style.zIndex = 1000;
  tip.style.whiteSpace = 'nowrap';
  tip.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  tip.style.pointerEvents = 'none';

  // cria a setinha
  const arrow = document.createElement('div');
  arrow.style.position = 'absolute';
  arrow.style.width = '0';
  arrow.style.height = '0';
  arrow.style.borderLeft = '6px solid transparent';
  arrow.style.borderRight = '6px solid transparent';
  arrow.style.borderBottom = '6px solid white'; // cor igual ao fundo do balão
  arrow.style.top = '-6px';
  arrow.style.left = '10px';
  tip.appendChild(arrow);

  // posicionar o balão logo abaixo do input
  const rect = input.getBoundingClientRect();
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  tip.style.left = `${rect.left + scrollX}px`;
  tip.style.top = `${rect.bottom + scrollY + 4}px`;

  document.body.appendChild(tip);
}

function clearTooltip(input) {
  if (!input) return;
  const id = input.id || '';
  const el = document.querySelector(`[data-tooltip-for="${id}"]`);
  if (el) el.remove();
}

function clearTooltips(stepId) {
  document.querySelectorAll(`[data-tooltip-for]`).forEach((el) => el.remove());
}

// ===== Etapa 1 =====
function verificaEtapa1() {
  const stepId = 'etapa-1';
  clearTooltips(stepId);

  const tipo = getState()?.form?.tipoUsuario || null;
  if (!tipo) {
    console.warn('[VALIDATE:etapa-1] faltando tipoUsuario');
    const btn = document.querySelector('#etapa-1 button[data-tipo-usuario]');
    createTooltip(btn, 'Selecione se é Comprador ou Vendedor');
    return false;
  }
  return true;
}

// ===== Etapa 2 =====
function verificaEtapa2() {
  const { form } = getState();
  clearTooltips('etapa-2');
  if (form?.tipoUsuario === 'comprador') return true;

  const loja = $('#loja');
  const nomeVend = $('#nome-vendedor');
  const emailVend = $('#email-vendedor');
  let ok = true;

  if (!hasValue(loja))  { createTooltip(loja, 'Informe a loja'); ok = false; }
  if (!hasValue(nomeVend)) { createTooltip(nomeVend, 'Informe o nome do vendedor'); ok = false; }
  if (!hasValue(emailVend)) { createTooltip(emailVend, 'Informe o e-mail'); ok = false; }
  if (hasValue(emailVend) && !validEmail(emailVend)) {
    createTooltip(emailVend, 'E-mail inválido');
    ok = false;
  }
  return ok;
}

// ===== Etapa 3 =====
function verificaEtapa3() {
  const nome   = $('#nome-cliente');
  const cpf    = $('#cpf');
  const email  = $('#email-cliente');
  const tel    = $('#telefone');
  const renda  = $('#renda_mensal');
  const cnhHid = $('#possui-cnh');
  clearTooltips('etapa-3');
  let ok = true;

  // presença
  if (!hasValue(nome))   { createTooltip(nome, 'Informe o nome'); ok = false; }
  if (!hasValue(cpf))    { createTooltip(cpf, 'Informe o CPF'); ok = false; }
  if (!hasValue(email))  { createTooltip(email, 'Informe o e-mail'); ok = false; }
  if (!hasValue(tel))    { createTooltip(tel, 'Informe o telefone'); ok = false; }
  if (!hasValue(renda))  { createTooltip(renda, 'Informe a renda mensal'); ok = false; }
  if (!validCNHHidden(cnhHid)) { createTooltip(tel || nome, 'Selecione se possui CNH'); ok = false; }

  // regex
  if (hasValue(cpf) && !validCPF(cpf)) { createTooltip(cpf, 'CPF inválido'); ok = false; }
  if (hasValue(email) && !validEmail(email)) { createTooltip(email, 'E-mail inválido'); ok = false; }
  if (hasValue(tel) && !validTelefone(tel)) { createTooltip(tel, 'Telefone inválido'); ok = false; }
  if (hasValue(renda) && !validCurrency(renda)) { createTooltip(renda, 'Renda em formato inválido'); ok = false; }

  return ok;
}

// ===== Etapa 4 (adiada) =====
function verificaEtapa4() { return true; }

// ===== API pública =====
export function verificaEtapaCompleta(stepIndexOrId) {
  const id = typeof stepIndexOrId === 'number' ? ORDER[stepIndexOrId] : stepIndexOrId;
  switch (id) {
    case 'etapa-1': return verificaEtapa1();
    case 'etapa-2': return verificaEtapa2();
    case 'etapa-3': return verificaEtapa3();
    case 'etapa-4': return verificaEtapa4();
    default: return true;
  }
}

export function verificaEtapaAtual() {
  const { currentView } = getState();
  return verificaEtapaCompleta(currentView);
}
