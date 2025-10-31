// src/js/formSteps.js
// Controla as 4 etapas do formulário (navegação, validações, salvamento no estado).
// ⚠️ Ajuste os seletores/IDs para os seus elementos reais do index.html.

import {
  attachCurrencyMask} from './moneyMask.js';

// -----------------------------------------
// SELETORES/IDs (ajuste se necessário)
// -----------------------------------------

const $ = (sel) => document.querySelector(sel);
const F = (...a) => console.log('[FORM]', ...a);


const BTN_PREV   = '#btnPrev';
const BTN_NEXT   = '#btnNext';

// Etapa 1 (identificação)
const TIPO_USUARIO_BTNS = '[data-tipo-usuario]'; // botões com data-tipo-usuario="comprador|vendedor"

// Etapa 2 (vendedor)
const LOJA_INPUT           = '#loja';
const NOME_VENDEDOR_INPUT  = '#nome-vendedor';
const EMAIL_VENDEDOR_INPUT = '#email-vendedor';

// Etapa 3 (cliente)
const NOME_CLIENTE_INPUT   = '#nome-cliente';
const CPF_INPUT            = '#cpf';              // ok
const CNH_BTNS             = '[data-cnh]';
const CNH_HIDDEN           = '#possui-cnh';
const EMAIL_CLIENTE_INPUT  = '#email-cliente';
const TELEFONE_INPUT       = '#telefone';

// Etapa 4 (valores) — ver correção da etapa 4 logo abaixo
const RENDA_INPUT          = '#renda_mensal';
const VALOR_MOTO_INPUT     = '#valor-moto';
const VALOR_ENTRADA_INPUT  = '#valor-entrada';


(function __stepsSanity() {
  console.log('[FORM] sanity: verificando seletores essenciais...');
  const q = s => document.querySelector(s);
  const rows = [
    { key: 'BTN_PREV', sel: BTN_PREV, ok: !!q(BTN_PREV) },
    { key: 'BTN_NEXT', sel: BTN_NEXT, ok: !!q(BTN_NEXT) },
    { key: 'TIPO_USUARIO_BTNS', sel: TIPO_USUARIO_BTNS, count: document.querySelectorAll(TIPO_USUARIO_BTNS).length },
    { key: 'CNH_BTNS', sel: CNH_BTNS, count: document.querySelectorAll(CNH_BTNS).length },
    { key: 'CNH_HIDDEN', sel: CNH_HIDDEN, ok: !!q(CNH_HIDDEN) },
  ];
  console.table(rows);
})();



// -----------------------------------------
// ERROS (UI mínima - plugue na sua UI real)
// -----------------------------------------

function clearErrors(container = document) {
  container.querySelectorAll('[data-error]').forEach(el => (el.textContent = ''));
}

function setFieldError(inputEl, message) {
  // Procura um elemento irmão com [data-error] ou personalize aqui:
  const holder = inputEl?.closest('[data-field]')?.querySelector('[data-error]');
  if (holder) holder.textContent = message;
}

function showFieldErrors(map) {
  // map = { campo: "mensagem", ... }
  // mapeie nomes aos elementos que você usa de fato:
  const refs = {
    tipoUsuario:       null, // se tiver um holder específico, coloque aqui
    loja:              $(LOJA_INPUT),
    nomeVendedor:      $(NOME_VENDEDOR_INPUT),
    emailVendedor:     $(EMAIL_VENDEDOR_INPUT),
    nomeCliente:       $(NOME_CLIENTE_INPUT),
    cpf:               $(CPF_INPUT),
    cnh:               $(CNH_HIDDEN),
    emailCliente:      $(EMAIL_CLIENTE_INPUT),
    telefoneCliente:   $(TELEFONE_INPUT),
    rendaMensal:       $(RENDA_INPUT),
    valorMoto:         $(VALOR_MOTO_INPUT),
    valorEntrada:      $(VALOR_ENTRADA_INPUT),
  };

  Object.entries(map).forEach(([k, msg]) => {
    const el = refs[k];
    if (el) setFieldError(el, msg);
  });
}

// -----------------------------------------
// MÁSCARAS (etapa 4)
// -----------------------------------------

let rendaCtrl, motoCtrl, entradaCtrl;

function initMoneyMasks() {
  const rendaEl   = $(RENDA_INPUT);
  const motoEl    = $(VALOR_MOTO_INPUT);
  const entradaEl = $(VALOR_ENTRADA_INPUT);

  if (rendaEl && motoEl && entradaEl) {
    rendaCtrl   = attachCurrencyMask(rendaEl);
    motoCtrl    = attachCurrencyMask(motoEl);
    entradaCtrl = attachCurrencyMask(entradaEl);
  }
}


function mapTabIdToView(tabId) {
  return {
    'tab-step-1': 'etapa-1',
    'tab-step-2': 'etapa-2',
    'tab-step-3': 'etapa-3',
    'tab-step-4': 'etapa-4',
  }[tabId];
}

