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

  (function initEtapa4EntradaMinDebugger() {
    const etapa4 = document.querySelector('#etapa-4');
    if (!etapa4) {
      console.warn('[Etapa4][DEBUG] #etapa-4 NÃO encontrado no DOM.');
      return;
    }

    const inputValorMoto = etapa4.querySelector('input#valor-moto');      // escopo dentro da etapa 4
    const inputValorEntrada = etapa4.querySelector('input#valor-entrada');

    console.groupCollapsed('[Etapa4][DEBUG] Setup inicial');
    console.log('etapa4:', etapa4);
    console.log('inputValorMoto:', inputValorMoto);
    console.log('inputValorEntrada:', inputValorEntrada);
    console.groupEnd();

    if (!inputValorMoto || !inputValorEntrada) {
      console.warn('[Etapa4][DEBUG] Inputs da etapa 4 não encontrados. Verifique IDs dentro da seção #etapa-4.');
      return;
    }

    // Aplica máscaras BRL e loga o resultado
    const maskMoto = attachCurrencyMask?.(inputValorMoto);
    const maskEntrada = attachCurrencyMask?.(inputValorEntrada);

    console.groupCollapsed('[Etapa4][DEBUG] Máscaras');
    console.log('maskMoto:', maskMoto, 'tem getNumericValue?', !!maskMoto?.getNumericValue, 'tem setValueFromNumber?', !!maskMoto?.setValueFromNumber);
    console.log('maskEntrada:', maskEntrada, 'tem getNumericValue?', !!maskEntrada?.getNumericValue, 'tem setValueFromNumber?', !!maskEntrada?.setValueFromNumber);
    console.groupEnd();

    let usuarioEditouEntrada = false;

    inputValorEntrada.addEventListener('input', () => {
      usuarioEditouEntrada = true;
      const valNum = maskEntrada?.getNumericValue ? maskEntrada.getNumericValue() : NaN;
      console.log('[Etapa4][DEBUG] Usuário editou ENTRADA. usuarioEditouEntrada =', usuarioEditouEntrada, '| entrada.num =', valNum, '| entrada.value =', inputValorEntrada.value);
    });

    const formatBRL = (n) =>
      `R$ ${Number(n || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

    const atualizarMinEntradaPlaceholder = (reason = 'manual') => {
      // lê valor da moto via máscara
      const valorMoto = maskMoto?.getNumericValue ? maskMoto.getNumericValue() : 0;

      // 40%
      const min = Math.max(0, Math.round(valorMoto * 0.40 * 100) / 100);
      const placeholderStr = `Min. sugerido: ${formatBRL(min)}`;

      // LOGS completos
      console.group('[Etapa4][DEBUG] atualizarMinEntradaPlaceholder:', reason);
      console.log('valorMoto.num =', valorMoto);
      console.log('min(40%) =', min, '| placeholderStr =', placeholderStr);
      console.log('inputValorEntrada.value (antes) =', inputValorEntrada.value);
      console.log('usuarioEditouEntrada =', usuarioEditouEntrada);

      // Atualiza SOMENTE o placeholder
      inputValorEntrada.setAttribute('placeholder', placeholderStr);
      console.log('placeholder atualizado ->', inputValorEntrada.getAttribute('placeholder'));

      // Se o usuário ainda não mexeu e o campo está vazio/zero, pré-preencher
      const entradaNum = maskEntrada?.getNumericValue ? maskEntrada.getNumericValue() : 0;
      const campoVazio = !inputValorEntrada.value || entradaNum === 0;

      console.log('entradaNum =', entradaNum, '| campoVazio =', campoVazio);
      if (!usuarioEditouEntrada && campoVazio && maskEntrada?.setValueFromNumber) {
        maskEntrada.setValueFromNumber(min);
        console.log('Pré-preencheu ENTRADA com min ->', min, '| value agora =', inputValorEntrada.value);
      } else {
        console.log('Não pré-preencheu ENTRADA (usuário já editou ou campo não está vazio).');
      }
      console.groupEnd();
    };

    // Atualizar ENQUANTO digita no valor da moto
    const onMotoInput = (evt) => {
      console.log('[Etapa4][DEBUG] Evento no VALOR MOTO:', evt.type, '| value =', inputValorMoto.value);
      atualizarMinEntradaPlaceholder(evt.type);
    };

    inputValorMoto.addEventListener('input', onMotoInput);
    inputValorMoto.addEventListener('keyup', onMotoInput);
    inputValorMoto.addEventListener('blur', onMotoInput);

    // Chamada inicial
    console.log('[Etapa4][DEBUG] Chamada inicial do atualizarMinEntradaPlaceholder()');
    atualizarMinEntradaPlaceholder('init');

    // Observa quando a etapa 4 ficar visível (remove classe "hidden") para atualizar na entrada da etapa
    const etapa4VisibilityObserver = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          const estaOculta = etapa4.classList.contains('hidden');
          console.log('[Etapa4][DEBUG] MutationObserver -> class mudou. hidden =', estaOculta, '| className =', etapa4.className);
          if (!estaOculta) {
            atualizarMinEntradaPlaceholder('step-visible');
          }
        }
      });
    });
    etapa4VisibilityObserver.observe(etapa4, { attributes: true, attributeFilter: ['class'] });

    // Também revalida quando clicar em Próximo/Voltar (se existirem no DOM)
    const btnNext = document.querySelector('#btnNext');
    const btnPrev = document.querySelector('#btnPrev');
    btnNext?.addEventListener('click', () => {
      setTimeout(() => {
        const visivel = !etapa4.classList.contains('hidden');
        console.log('[Etapa4][DEBUG] Click Next -> etapa4 visível?', visivel);
        if (visivel) atualizarMinEntradaPlaceholder('btnNext');
      }, 0);
    });
    btnPrev?.addEventListener('click', () => {
      setTimeout(() => {
        const visivel = !etapa4.classList.contains('hidden');
        console.log('[Etapa4][DEBUG] Click Prev -> etapa4 visível?', visivel);
        if (visivel) atualizarMinEntradaPlaceholder('btnPrev');
      }, 0);
    });

    console.log('[Etapa4][DEBUG] Inicialização concluída.');
  })();

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
