// formSteps.js
// Controla botões Avançar/Voltar e os botões de "Você é" (tipoUsuario), sem navegar sozinho.

import { nextStep, prevStep, setTipoUsuario } from './stepNavigation.js';
import { verificaEtapaAtual  } from './validators.js';
import { attachCurrencyMask, formatNumberToBRL } from './moneyMask.js';
import { calcularPPA } from './calculo-ppa.js';
import {
  state,
  setRenda,
  setValorMoto,
  setValorEntrada,
  getMinEntrada40,
  getPpaInputs,
} from './appState.js';

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

// Normaliza retorno da PPA para { aprovado:boolean, mensagem?:string }
function normalizePPAResult(raw) {
  console.group('[PPA][normalize] raw result');
  console.log('tipo:', typeof raw, '| Array?', Array.isArray(raw), '| valor:', raw);
  console.groupEnd();

  if (raw == null) return null;

  // Caso comum do seu projeto: lista de falhas
  if (Array.isArray(raw)) {
    if (raw.length === 0) return { aprovado: true };
    const msgs = raw.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return item.mensagem || item.message || item.motivo || JSON.stringify(item);
      }
      return String(item);
    }).filter(Boolean);
    return { aprovado: false, mensagem: msgs.join(' • ') };
  }

  // Já no formato { aprovado, mensagem }
  if (typeof raw.aprovado === 'boolean') {
    return { aprovado: raw.aprovado, mensagem: raw.mensagem || raw.message };
  }

  // Outras variações comuns
  if (typeof raw.approved === 'boolean') {
    return { aprovado: raw.approved, mensagem: raw.message };
  }
  if (typeof raw.ok === 'boolean') {
    return { aprovado: raw.ok, mensagem: raw.message };
  }
  if (typeof raw.status === 'string') {
    const s = raw.status.toLowerCase();
    if (['aprovado','approved','ok','success'].includes(s)) return { aprovado: true, mensagem: raw.message };
    if (['reprovado','denied','fail','error'].includes(s)) return { aprovado: false, mensagem: raw.message || raw.mensagem };
  }

  if (typeof raw === 'boolean') return { aprovado: raw };
  if (raw.motivo || raw.erro)   return { aprovado: false, mensagem: raw.motivo || raw.erro };
  if (typeof raw === 'string')  return { aprovado: false, mensagem: raw };

  return null;
}

// Junta guardas locais com o retorno do motor PPA
function avaliarPPAComGuardas({ renda, valorMoto, entrada }, calcularPPA) {
  const guardErrors = [];

  if (!Number.isFinite(renda) || renda <= 0)      guardErrors.push('Informe uma renda mensal válida.');
  if (!Number.isFinite(valorMoto) || valorMoto <= 0) guardErrors.push('Informe o valor da moto.');
  if (!Number.isFinite(entrada) || entrada <= 0)  guardErrors.push('Informe a entrada (ou use o mínimo sugerido).');

  console.group('[PPA][guards]');
  console.log('inputs =>', { renda, valorMoto, entrada });
  console.log('guardErrors =>', guardErrors);
  console.groupEnd();

  let raw;
  try {
    raw = calcularPPA({ renda, valorMoto, entrada }); // <<< usa o NOME que você já tem
    console.log('[PPA] raw (engine) =>', raw);
  } catch (e) {
    console.error('[PPA] Erro ao executar calcularPPA:', e);
    return { aprovado: false, mensagem: 'Falha ao validar PPA. Tente novamente.' };
  }

  if (Array.isArray(raw)) {
    raw = [...guardErrors, ...raw];
  } else if (guardErrors.length) {
    raw = guardErrors;
  }

  const norm = normalizePPAResult(raw);
  console.log('[PPA] normalizado =>', norm);
  return norm || { aprovado: false, mensagem: 'Retorno da PPA inválido.' };
}


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

 const btnNextLabel = btnNext?.querySelector('span');

  const etapa4 = document.querySelector('#etapa-4');
  if (!etapa4 || !btnNext || !btnNextLabel) return;

  // Campos da etapa 4 + renda (etapa 3)
  const inputValorMoto    = etapa4.querySelector('#valor-moto');
  const inputValorEntrada = etapa4.querySelector('#valor-entrada');
  const ppaErroEl         = etapa4.querySelector('#ppa-erro');
  const inputRenda        = document.querySelector('#renda_mensal');

  // Máscaras
  const maskMoto    = inputValorMoto    ? attachCurrencyMask(inputValorMoto)    : null;
  const maskEntrada = inputValorEntrada ? attachCurrencyMask(inputValorEntrada) : null;
  const maskRenda   = inputRenda        ? attachCurrencyMask(inputRenda)        : null;

  const toBRL = (n) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

  // Placeholder dinâmico (40%)
  const renderPlaceholderMin = () => {
    const min = getMinEntrada40();
    inputValorEntrada.setAttribute('placeholder', `Min. sugerido: ${toBRL(min)}`);
  };

  const resetEntradaComPlaceholderMin = () => {
    if (typeof maskEntrada?.clear === 'function') maskEntrada.clear();
    inputValorEntrada.value = '';
    setValorEntrada(0); // zera no estado => volta a depender de 40%
    renderPlaceholderMin();
    inputValorEntrada.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // Bindings para o estado global
  const onRendaChange = () => {
    const v = maskRenda?.getNumericValue ? maskRenda.getNumericValue() : 0;
    setRenda(v);
    console.log('[STATE][RENDA] =>', toBRL(state.renda));
  };

  const onMotoChange = () => {
    const v = maskMoto?.getNumericValue ? maskMoto.getNumericValue() : 0;
    setValorMoto(v);           // zera entrada no estado
    resetEntradaComPlaceholderMin();
    console.log('[STATE][MOTO] =>', toBRL(state.valorMoto), '| min40 =>', toBRL(getMinEntrada40()));
  };

  const onEntradaChange = () => {
    const v = maskEntrada?.getNumericValue ? maskEntrada.getNumericValue() : 0;
    setValorEntrada(v);        // se 0 => volta a 40%, se >0 => fixa
    console.log('[STATE][ENTRADA] touched=', state.entradaTouched, '| entrada =>', state.valorEntrada != null ? toBRL(state.valorEntrada) : '(dinâmico 40%)');
  };

  ['input','keyup','change','blur'].forEach(ev => {
    inputRenda?.addEventListener(ev, onRendaChange);
    inputValorMoto?.addEventListener(ev, onMotoChange);
    inputValorEntrada?.addEventListener(ev, onEntradaChange);
  });

  // Botão Next vira "Enviar" só na Etapa 4
  const updateNextLabelForCurrentStep = () => {
    const etapa4Visivel = !etapa4.classList.contains('hidden');
    btnNextLabel.textContent = etapa4Visivel ? 'Enviar' : 'Avançar';
  };

  const etapa4Observer = new MutationObserver(() => {
    updateNextLabelForCurrentStep();
    if (!etapa4.classList.contains('hidden')) {
      renderPlaceholderMin();
    }
  });
  etapa4Observer.observe(etapa4, { attributes: true, attributeFilter: ['class'] });
  updateNextLabelForCurrentStep();

  // Clique em ENVIAR (Etapa 4) -> roda PPA + logs
  btnNext.addEventListener('click', () => {
    const etapa4Visivel = !etapa4.classList.contains('hidden');
    if (!etapa4Visivel) return;

    const { renda, valorMoto, entrada } = getPpaInputs();

    console.group('[PPA] ENVIAR (click)');
    console.log('renda   =', renda,     '->', toBRL(renda));
    console.log('moto    =', valorMoto, '->', toBRL(valorMoto));
    console.log('min40   =', getMinEntrada40(), '->', toBRL(getMinEntrada40()));
    console.log('entrada =', entrada,   '->', toBRL(entrada));

    const resultado = avaliarPPAComGuardas({ renda, valorMoto, entrada }, calcularPPA);

    if (resultado.aprovado) {
      ppaErroEl?.classList.add('hidden');
      if (ppaErroEl) ppaErroEl.textContent = '';
      console.log('[PPA] Aprovado ✅');
      // se quiser submeter o form aqui, faça agora
      // document.querySelector('#financiamento-form')?.submit();
    } else {
      if (ppaErroEl) {
        ppaErroEl.textContent = resultado.mensagem || 'Proposta reprovada.';
        ppaErroEl.classList.remove('hidden');
      }
      console.warn('[PPA] Reprovado ❌', resultado.mensagem);
    }
    console.groupEnd();
  });

  // -- inicialização rápida (se etapa 4 já estiver visível) --
  if (!etapa4.classList.contains('hidden')) {
    renderPlaceholderMin();
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
