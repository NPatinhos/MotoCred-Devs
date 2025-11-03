// validators.js
// Validações por etapa. Mantém logs detalhados.

import { getState } from './stepNavigation.js';

const $ = (s) => document.querySelector(s);

function logPrefix(stepId) { return `[VALIDATE:${stepId}]`; }

// ===== Utilitários de marcação visual =====
function markInvalid(input, message) {
  if (!input) return;
  input.setAttribute('aria-invalid', 'true');
  input.classList.add(
    'border-2', 'border-[#D11B1B]',
    'ring-0', 'focus:ring-0', // zera o ring azul
    'outline-none'
  );
  input.dataset.error = message || 'Campo inválido';
}

function clearInvalid(input) {
  if (!input) return;
  input.removeAttribute('aria-invalid');
  input.classList.remove(
    'border-2', 'border-[#D11B1B]',
    'ring-0', 'focus:ring-0',
    'outline-none'
  );
  delete input.dataset.error;
}

// Limpa erros de uma etapa inteira
function clearStepErrors(stepId) {
  document.querySelectorAll(`#${stepId} [aria-invalid="true"]`).forEach(clearInvalid);
}

// ===== Regex / regras =====
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const TEL_RE   = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/; // (00) 0000-0000 ou (00) 00000-0000
const CURRENCY_RE = /^R?\$?\s?\d{1,3}(\.\d{3})*(,\d{2})?$|^\d+([.,]\d{2})?$/; // aceita "R$ 1.234,56" ou "1234,56"

// CPF algorítmico
function onlyDigits(v) { return (v || '').replace(/\D+/g, ''); }
function isValidCPF(strCPF) {
  const cpf = onlyDigits(strCPF);
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let sum = 0; let rest;

  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i-1, i), 10) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10), 10)) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i-1, i), 10) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(10, 11), 10)) return false;

  return true;
}

// ===== Validadores unitários =====
function requireNonEmpty(input, name = 'Campo') {
  if (!input) return false;
  clearInvalid(input);
  const v = String(input.value || '').trim();
  if (!v) { markInvalid(input, `${name} obrigatório`); return false; }
  return true;
}
function validateEmail(input) {
  if (!input) return false;
  clearInvalid(input);
  const v = String(input.value || '').trim();
  const ok = EMAIL_RE.test(v);
  if (!ok) markInvalid(input, 'E-mail inválido');
  return ok;
}
function validateTelefone(input) {
  if (!input) return false;
  clearInvalid(input);
  const v = String(input.value || '').trim();
  const ok = TEL_RE.test(v);
  if (!ok) markInvalid(input, 'Telefone inválido');
  return ok;
}
function validateCPF(input) {
  if (!input) return false;
  clearInvalid(input);
  const v = String(input.value || '').trim();
  const ok = isValidCPF(v);
  if (!ok) markInvalid(input, 'CPF inválido');
  return ok;
}
function validateCurrency(input) {
  if (!input) return false;
  clearInvalid(input);
  const v = String(input.value || '').trim();
  const ok = CURRENCY_RE.test(v);
  if (!ok) markInvalid(input, 'Valor inválido');
  return ok;
}
function validateCNHHidden(input) {
  if (!input) return false;
  clearInvalid(input);
  const v = String(input.value || '').trim();
  const ok = v === 'sim' || v === 'nao';
  if (!ok) markInvalid(input, 'Selecione se possui CNH');
  return ok;
}

// ===== Regras por etapa =====
// Etapa 1: precisa escolher "tipoUsuario"
function validateStep1() {
  const stepId = 'etapa-1';
  console.log(`${logPrefix(stepId)} iniciando...`);
  clearStepErrors(stepId);

  // Em etapa 1 não há input, usamos estado (definido por botões data-tipo-usuario)
  const tipo = getState()?.form?.tipoUsuario || null;
  if (!tipo) {
    console.warn(`${logPrefix(stepId)} tipoUsuario ausente`);
    // Destacar o grupo visual dos botões (feedback sutil)
    const group = document.querySelector('#etapa-1 .max-w-[400px]');
    if (group) {
      group.classList.add('ring-2', 'ring-red-500');
      setTimeout(() => group.classList.remove('ring-2', 'ring-red-500'), 1500);
    }
    return { ok: false, firstInvalid: group || null };
  }

  console.log(`${logPrefix(stepId)} OK`);
  return { ok: true };
}

// Etapa 2: somente quando NÃO estiver travada (ou seja, tipoUsuario !== 'comprador')
function validateStep2() {
  const stepId = 'etapa-2';
  console.log(`${logPrefix(stepId)} iniciando...`);
  clearStepErrors(stepId);

  const loja = $('#loja');
  const nomeVend = $('#nome-vendedor');
  const emailVend = $('#email-vendedor');

  const checks = [
    requireNonEmpty(loja, 'Loja/Concessionária'),
    requireNonEmpty(nomeVend, 'Nome do Vendedor'),
    validateEmail(emailVend),
  ];

  const ok = checks.every(Boolean);
  const firstInvalid = [loja, nomeVend, emailVend].find((el) => el?.getAttribute('aria-invalid') === 'true') || null;

  console.log(`${logPrefix(stepId)} ${ok ? 'OK' : 'FALHOU'}`);
  return { ok, firstInvalid };
}

// Etapa 3: válida para ambos os fluxos — campos do cliente
function validateStep3() {
  const stepId = 'etapa-3';
  console.log(`[VALIDATE:${stepId}] iniciando...`);
  clearStepErrors(stepId);

  const nome   = $('#nome-cliente');
  const cpf    = $('#cpf');
  const email  = $('#email-cliente');
  const tel    = $('#telefone');
  const renda  = $('#renda_mensal');
  const cnhHid = $('#possui-cnh'); // hidden preenchido pelos botões

  // ---------- FASE 1: presença ----------
  const presences = [
    requireNonEmpty(nome,  'Nome do Cliente'),
    requireNonEmpty(cpf,   'CPF'),
    requireNonEmpty(email, 'E-mail'),
    requireNonEmpty(tel,   'Telefone'),
    requireNonEmpty(renda, 'Renda Mensal'),
    requireNonEmpty(cnhHid,'Possui CNH'),
  ];

  if (!presences.every(Boolean)) {
    const firstInvalidPresence = [nome, cpf, email, tel, renda, cnhHid]
      .find((el) => el?.getAttribute('aria-invalid') === 'true') || null;

    console.warn('[VALIDATE:etapa-3] FALHOU na presença.');
    return { ok: false, firstInvalid: firstInvalidPresence };
  }

  // ---------- FASE 2: formato/regex ----------
  const formats = [
    validateCPF(cpf),
    validateEmail(email),
    validateTelefone(tel),
    validateCurrency(renda),
    validateCNHHidden(cnhHid),
  ];

  const ok = formats.every(Boolean);
  const firstInvalidFormat = [cpf, email, tel, renda, cnhHid]
    .find((el) => el?.getAttribute('aria-invalid') === 'true') || null;

  console.log(`[VALIDATE:${stepId}] ${ok ? 'OK' : 'FALHOU'}`);
  return { ok, firstInvalid: ok ? null : firstInvalidFormat };
}


// ===== Orquestrador por etapa atual =====
export function validateCurrentStep() {
  const { currentView, form } = getState();
  const stepId = currentView;
  console.log(`[VALIDATE] currentView=${currentView}`);

  if (stepId === 'etapa-1') return validateStep1();

  if (stepId === 'etapa-2') {
    // Se comprador, etapa 2 está travada no fluxo de navegação
    // Mas se por algum motivo cair aqui, garantimos a regra:
    if (form?.tipoUsuario === 'comprador') {
      console.log('[VALIDATE:etapa-2] pulada (comprador)');
      return { ok: true }; // não exige vendedor
    }
    return validateStep2();
  }

  if (stepId === 'etapa-3') return validateStep3();

  // Outras etapas (ex.: 4) serão tratadas depois
  console.log('[VALIDATE] etapa sem validação específica → OK');
  return { ok: true };
}
