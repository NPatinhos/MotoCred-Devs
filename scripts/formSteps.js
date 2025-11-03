// formSteps.js
// Controla botões Avançar/Voltar e os botões de "Você é" (tipoUsuario), sem navegar sozinho.

import { nextStep, prevStep, setTipoUsuario } from './stepNavigation.js';
import { validateCurrentStep } from './validators.js';

const $ = (s) => document.querySelector(s);

const FORM_SEL = '#financiamento-form';
const BTN_NEXT = '#btnNext';
const BTN_PREV = '#btnPrev';

// Agora "tipo de usuário" são botões com data-tipo-usuario
const TIPO_USUARIO_BTNS = 'button[data-tipo-usuario]';

export function initFormSteps() {
  console.log('[INIT] initFormSteps()');
  const form = $(FORM_SEL);
  if (!form) {
    console.warn('[WARN] Formulário não encontrado:', FORM_SEL);
    return;
  }

  // Bloquear Enter no formulário
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log('[BLOCK] Enter bloqueado no formulário');
    }
  });

  // Botões de navegação
  const btnPrev = $(BTN_PREV);
  const btnNext = $(BTN_NEXT);

  if (!btnPrev) console.warn('[WARN] Botão VOLTAR não encontrado:', BTN_PREV);
  if (!btnNext) console.warn('[WARN] Botão AVANÇAR não encontrado:', BTN_NEXT);

  btnPrev?.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('[CLICK] Botão VOLTAR');
    prevStep();
  });

 btnNext?.addEventListener('click', (e) => {
  e.preventDefault();
  console.log('[CLICK] Botão AVANÇAR');

  const res = validateCurrentStep(); // Fase 1 -> Fase 2 (por etapa)
  if (!res.ok) {
    console.warn('[VALIDATE] bloqueado avanço: etapa inválida');
    if (res.firstInvalid && typeof res.firstInvalid.focus === 'function') {
      res.firstInvalid.focus();
    }
    res.firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return; // NÃO avança
  }

  nextStep(); // tudo ok → avança
});

  // “Você é” → define tipoUsuario, não navega
  const tipoBtns = document.querySelectorAll(TIPO_USUARIO_BTNS);
  if (!tipoBtns.length) {
    console.warn('[WARN] Botões de tipoUsuario não encontrados:', TIPO_USUARIO_BTNS);
  } else {
    tipoBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const valor = btn.getAttribute('data-tipo-usuario'); // comprador | vendedor
        console.log(`[INPUT] tipoUsuario alterado → ${valor}`);
        setTipoUsuario(valor);

        // Atualiza aria-pressed visual do grupo
        tipoBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
      });
    });
  }
 btnNext?.addEventListener('click', (e) => {
    e.preventDefault();

    console.log('[CLICK] Botão AVANÇAR');
    const res = validateCurrentStep();

    if (!res.ok) {
      console.warn('[VALIDATE] bloqueado avanço: etapa inválida');
      // foca no primeiro inválido, se houver
      if (res.firstInvalid && typeof res.firstInvalid.focus === 'function') {
        res.firstInvalid.focus();
      }
      return; // NÃO avança
    }

    // ok, pode avançar
    nextStep();
  });

  console.log('[BIND] initFormSteps() concluído');
}
