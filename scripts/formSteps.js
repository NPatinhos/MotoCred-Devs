// formSteps.js
// Controla botões Avançar/Voltar e os botões de "Você é" (tipoUsuario), sem navegar sozinho.

import { nextStep, prevStep, setTipoUsuario } from './stepNavigation.js';
import { verificaEtapaAtual  } from './validators.js';
import { attachCurrencyMask, formatNumberToBRL } from './moneyMask.js';

const $ = (s) => document.querySelector(s);

const FORM_SEL = '#financiamento-form';
const BTN_NEXT = '#btnNext';
const BTN_PREV = '#btnPrev';

// Agora "tipo de usuário" são botões com data-tipo-usuario
const TIPO_USUARIO_BTNS = 'button[data-tipo-usuario]';

const CNH_BTNS = 'button[data-cnh]';
const cnhBtns = document.querySelectorAll(CNH_BTNS);
const cnhHidden = document.querySelector('#possui-cnh');

const SEL = (s) => document.getElementById(s);
const VALOR_MOTO_ID = 'valorMoto'; 
const VALOR_ENTRADA_ID = 'valorEntrada'; 
const PERCENTUAL_MINIMO_ENTRADA = 0.40; // 40%

const formatBRL = (n) =>
  `R$ ${Number(n || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;


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
  prevStep(); // agora SEM validação
});



 btnNext?.addEventListener('click', (e) => {
  e.preventDefault();
  console.log('[CLICK] Botão AVANÇAR');

console.log('[DEBUG] Valor atual de CNH:', cnhHidden?.value);

const ok = verificaEtapaAtual(); // cria/remover blocos inline por campo
if (!ok) {
  console.warn('[VALIDATE] avanço BLOQUEADO pela validação da etapa atual');
  return;
}

  const res = verificaEtapaAtual(); // Fase 1 -> Fase 2 (por etapa)
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


if (!cnhBtns.length || !cnhHidden) {
  console.warn('[WARN] Botões de CNH ou hidden não encontrados');
} else {
  cnhBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const valor = btn.getAttribute('data-cnh'); // sim | nao
      cnhHidden.value = valor;
      console.log(`[INPUT] CNH alterado → ${valor}`);

      // Visual do grupo com aria-pressed
      cnhBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
    });
  });
}

function setupInputSugerido() {
  const motoInput = SEL(VALOR_MOTO_ID);
  const entradaInput = SEL(VALOR_ENTRADA_ID);
  
  if (!motoInput || !entradaInput) return;
  
  const updateEntradaSugerida = () => {
      // Pega o valor da MOTO em número puro
      const valorMotoNum = parseBRLToNumber(motoInput.value) || 0; 
      
      const sugeridoMinimo = valorMotoNum * PERCENTUAL_MINIMO_ENTRADA;
      
      // Formata e ATUALIZA o placeholder
      const sugeridoFormatado = formatBRLFromNumber(sugeridoMinimo);
      entradaInput.placeholder = `Min. sugerido: ${sugeridoFormatado}`;
      
      // Salva o valor puro NUMÉRICO no data-set para uso no submit
      entradaInput.dataset.valorSugerido = sugeridoMinimo; 
  };
  
  // Inicializa e adiciona o listener de input para recalcular
  updateEntradaSugerida(); 
  motoInput.addEventListener('input', updateEntradaSugerida); 
}

setupInputSugerido();


// === Máscara de CPF ===
const cpfInput = document.querySelector('#cpf');
cpfInput?.addEventListener('input', () => {
  let v = cpfInput.value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  cpfInput.value = v;
});

// === Máscara de telefone ===
const telInput = document.querySelector('#telefone');
telInput?.addEventListener('input', () => {
  let v = telInput.value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/^(\d{2})(\d)/, '($1) $2');
  v = v.replace(/(\d{5})(\d)/, '$1-$2');
  telInput.value = v;
});

// === Máscara de renda ===
const rendaInput = document.querySelector('#renda_mensal');
rendaInput?.addEventListener('input', () => {
  let raw = rendaInput.value.replace(/\D/g, '');

  // Remove todos os zeros à esquerda EXCETO se o número for "0"
  raw = raw.replace(/^0+(?!$)/, '');

  if (raw.length === 0) {
    rendaInput.value = '';
    return;
  }

  // Garante no mínimo 3 dígitos (para pelo menos 0,01)
  raw = raw.padStart(3, '0');

  const cents = raw.slice(-2);
  const reais = raw.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  rendaInput.value = `R$ ${reais},${cents}`;
});

const etapa4 = document.querySelector('#etapa-4');
  if (etapa4) {
    const inputValorMoto = etapa4.querySelector('#valor-moto');
    const inputValorEntrada = etapa4.querySelector('#valor-entrada');

    if (!inputValorMoto || !inputValorEntrada) return;

    const maskMoto = attachCurrencyMask?.(inputValorMoto);
    const maskEntrada = attachCurrencyMask?.(inputValorEntrada);

    const formatBRL = (n) =>
      `R$ ${Number(n || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

    const resetEntradaComPlaceholderMin = () => {
      // 1) lê valor da moto (numérico)
      const valorMoto = typeof maskMoto?.getNumericValue === 'function'
        ? maskMoto.getNumericValue()
        : Number((inputValorMoto.value || '0').replace(/[^\d,]/g, '').replace(',', '.')) || 0;

      // 2) calcula 40%
      const min = Math.max(0, Math.round(valorMoto * 0.40 * 100) / 100);

      // 3) limpa a ENTRADA para reaparecer o placeholder
      if (typeof maskEntrada?.clear === 'function') {
        maskEntrada.clear();
      }
      // força vazio mesmo que a máscara tente colocar "R$ 0,00"
      inputValorEntrada.value = '';

      // 4) atualiza placeholder dinâmico
      inputValorEntrada.setAttribute('placeholder', `Min. sugerido: ${formatBRL(min)}`);

      // 5) dispara input pra sincronizar outros listeners (se houver)
      inputValorEntrada.dispatchEvent(new Event('input', { bubbles: true }));
    };

    // Sempre que o usuário interagir com "Valor da Moto", reseta a entrada e atualiza o placeholder
    ['input', 'keyup', 'change', 'blur', 'focus'].forEach((ev) => {
      inputValorMoto.addEventListener(ev, resetEntradaComPlaceholderMin);
    });

    // Quando a etapa 4 ficar visível, garante estado correto
    const obs = new MutationObserver(() => {
      if (!etapa4.classList.contains('hidden')) {
        resetEntradaComPlaceholderMin();
      }
    });
    obs.observe(etapa4, { attributes: true, attributeFilter: ['class'] });

    // Chamada inicial (caso a etapa já esteja visível ao carregar)
    if (!etapa4.classList.contains('hidden')) {
      resetEntradaComPlaceholderMin();
    }
  }

(function restauraEstadoCNH() {
  const valor = cnhHidden?.value;
  if (!valor) return;
  cnhBtns.forEach((b) => {
    const v = b.getAttribute('data-cnh');
    b.setAttribute('aria-pressed', v === valor ? 'true' : 'false');
  });
})();

  console.log('[BIND] initFormSteps() concluído');
}
