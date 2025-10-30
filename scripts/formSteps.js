// src/js/formSteps.js
// Controla as 4 etapas do formulário (navegação, validações, salvamento no estado).
// ⚠️ Ajuste os seletores/IDs para os seus elementos reais do index.html.

import {
  getCurrentView,
  getProximaEtapa,
  etapaEhUltimaDoFormulario,
  setView,
  setTipoUsuario,
  setPossuiCNH,
  mergeVendedorData,
  mergeClienteData,
  mergeVendaData,
} from './appState.js';

import { renderView } from './uiRenderer.js';
import {
  validateEtapaIdentificacao,
  validateEtapaVendedor,
  validateEtapaCliente,
  validateEtapaVenda,
} from './validators.js';

import {
  attachCurrencyMask,
  getNumericValueFromCurrencyInput,
} from './moneyMask.js';

import { submitFormulario } from './flowController.js';

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

// -----------------------------------------
// HANDLERS DE ESCOLHA (etapa 1 e 3)
// -----------------------------------------

function bindTipoUsuarioButtons() {
  document.querySelectorAll(TIPO_USUARIO_BTNS).forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.getAttribute('data-tipo-usuario'); // "comprador" | "vendedor"
      // marca aria-pressed visualmente
      document.querySelectorAll(TIPO_USUARIO_BTNS).forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      // salva no estado
      setTipoUsuario(tipo);
    });
  });
}

function bindCNHButtons() {
  const hidden = $(CNH_HIDDEN);
  document.querySelectorAll(CNH_BTNS).forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-cnh'); // "sim" | "nao"
      document.querySelectorAll(CNH_BTNS).forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      if (hidden) hidden.value = v;
      setPossuiCNH(v === 'sim');
    });
  });
}

// -----------------------------------------
// NAVEGAÇÃO (prev/next)
// -----------------------------------------

function goTo(view) {
  setView(view);
  renderView();
}

async function onNext() {
  const current = getCurrentView(); // "etapa-1"..."etapa-4"
  F('onNext from', current);
  clearErrors();

  // valida e salva cada etapa antes de avançar
  if (current === 'etapa-1') {
    const tipoUsuarioRaw = document.querySelector('[data-tipo-usuario][aria-pressed="true"]')?.getAttribute('data-tipo-usuario') || '';
    const r = validateEtapaIdentificacao({ tipoUsuarioRaw });
    if (!r.ok) return showFieldErrors(r.fieldErrors);
    // já salvamos setTipoUsuario no click; nada extra aqui
  }

  if (current === 'etapa-2') {
    const r = validateEtapaVendedor({
      lojaRaw:           $(LOJA_INPUT)?.value ?? '',
      nomeVendedorRaw:   $(NOME_VENDEDOR_INPUT)?.value ?? '',
      emailVendedorRaw:  $(EMAIL_VENDEDOR_INPUT)?.value ?? '',
    });
    if (!r.ok) return showFieldErrors(r.fieldErrors);
    mergeVendedorData(r.values);
  }

  if (current === 'etapa-3') {
    const r = validateEtapaCliente({
      nomeClienteRaw:   $(NOME_CLIENTE_INPUT)?.value ?? '',
      cpfRaw:           $(CPF_INPUT)?.value ?? '',
      cnhRaw:           $(CNH_HIDDEN)?.value ?? '', // "sim"/"nao"
      emailClienteRaw:  $(EMAIL_CLIENTE_INPUT)?.value ?? '',
      telefoneRaw:      $(TELEFONE_INPUT)?.value ?? '',
    });
    if (!r.ok) return showFieldErrors(r.fieldErrors);
    mergeClienteData(r.values);
  }

  if (current === 'etapa-4') {
    // leia números da máscara
    const renda  = rendaCtrl ? rendaCtrl.getNumericValue() : getNumericValueFromCurrencyInput($(RENDA_INPUT));
    const moto   = motoCtrl  ? motoCtrl.getNumericValue()  : getNumericValueFromCurrencyInput($(VALOR_MOTO_INPUT));
    const entrada= entradaCtrl? entradaCtrl.getNumericValue(): getNumericValueFromCurrencyInput($(VALOR_ENTRADA_INPUT));

    const r = validateEtapaVenda({
      rendaMensalNumber: renda,
      valorMotoNumber: moto,
      valorEntradaNumber: entrada,
    });
    if (!r.ok) return showFieldErrors(r.fieldErrors);

    mergeVendaData(r.values);

    // última etapa? então envia e decide aprovado/reprovado
    if (etapaEhUltimaDoFormulario(current)) {
      // desabilite botão, mostre spinner se quiser (UI sua)
      await submitFormulario();
      // submitFormulario chama setView('aprovado'|'reprovado');
      renderView();
      return;
    }
  }

  // se não era a última, vai pra próxima etapa válida
  const next = getProximaEtapa(current);
  if (next) goTo(next);
}

function onPrev() {
  const current = getCurrentView();
   F('onPrev from', current);
  // volta 1 etapa na sequência considerando pulo do vendedor quando for “comprador”
  const ordem = ['etapa-1', 'etapa-2', 'etapa-3', 'etapa-4'];
  const tipo = document.querySelector('[data-tipo-usuario][aria-pressed="true"]')?.getAttribute('data-tipo-usuario');
  const efetiva = (tipo === 'vendedor') ? ordem : ordem.filter(x => x !== 'etapa-2');

  const idx = efetiva.indexOf(current);
  const prev = idx > 0 ? efetiva[idx - 1] : null;
  if (prev) goTo(prev);
}

// -----------------------------------------
// BIND INICIAL
// -----------------------------------------

export function initFormSteps() {
    F('initFormSteps()');
    F('BTN prev/next:', document.querySelector('#btnPrev'), document.querySelector('#btnNext'));
    F('tipo-usuario btns count:', document.querySelectorAll('[data-tipo-usuario]').length);
    F('CNH btns count:', document.querySelectorAll('[data-cnh]').length);

    // inputs (checar null)
    F('inputs:',
    document.querySelector('#loja'),
    document.querySelector('#nome-vendedor'),
    document.querySelector('#email-vendedor'),
    document.querySelector('#nome-cliente'),
    document.querySelector('#cpf'),
    document.querySelector('#email-cliente'),
    document.querySelector('#telefone'),
    document.querySelector('#valor-moto'),
    document.querySelector('#valor-entrada')
    );

  // máscaras de dinheiro (etapa 4)
  initMoneyMasks();

  // handlers de seleção (etapas 1 e 3)
  bindTipoUsuarioButtons();
  bindCNHButtons();

  // navegação
  const btnPrev = $(BTN_PREV);
  const btnNext = $(BTN_NEXT);
  btnPrev?.addEventListener('click', onPrev);
  btnNext?.addEventListener('click', onNext);
}
