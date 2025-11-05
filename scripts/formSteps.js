// formSteps.js
// Controla botões Avançar/Voltar e os botões de "Você é" (tipoUsuario), sem navegar sozinho.

import { nextStep, prevStep, setTipoUsuario } from './stepNavigation.js';
import { verificaEtapaAtual  } from './validators.js';
import { attachCurrencyMask, formatNumberToBRL } from './moneyMask.js';
// <<<< CORREÇÃO: As 3 funções essenciais da PPA DEVEM ser importadas aqui >>>>
import { calcularPPA, obterMotivosDeReprovacao, calcularSugestoes } from './calculo-ppa.js';
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

// Reutiliza a função de formatação do moneyMask.js ou define localmente
const toBRL = formatNumberToBRL || ((n) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`);


// <<<< FUNÇÃO AUXILIAR DE PPA (PRECISA ESTAR AQUI FORA DE initFormSteps) >>>>
function avaliarPPAComGuardas({ renda, valorMoto, entrada }, calcularPPA) {
  const sanitized = {
    renda: Number.isFinite(renda) ? renda : 0,
    valorMoto: Number.isFinite(valorMoto) ? valorMoto : 0,
    entrada: Number.isFinite(entrada) ? entrada : 0,
  };

  //console.group('[PPA][guards]');
  //console.log('inputs =>', { renda, valorMoto, entrada });
  //console.groupEnd();

  let raw = [];
  try {
    // A função calcularPPA retorna um array de códigos de falha ou [] se aprovado
    raw = calcularPPA(sanitized.valorMoto, sanitized.entrada, sanitized.renda);
    //console.log('[PPA] raw (engine) =>', raw);
  } catch (e) {
    //console.error('[PPA] Erro ao executar calcularPPA:', e);
    // Retorna um erro interno para ser tratado
    return ['ERRO_INTERNO_PPA']; 
  }
  
  // Retorna o array de códigos de falha (pode ser [] se aprovado)
  return raw; 
}


export function initFormSteps() {
  //console.log('[INIT] initFormSteps()');
  const form = $(FORM_SEL);
  if (!form) {
    //console.warn('[WARN] Formulário não encontrado:', FORM_SEL);
    return;
  }
  
  // -------------------------------------------------------------------------
  // VARIÁVEIS, BOTÕES E OBJETOS CRÍTICOS
  // -------------------------------------------------------------------------

  // Bloquear Enter no formulário
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      //console.log('[BLOCK] Enter bloqueado no formulário');
    }
  });

  // Botões de navegação
  const btnPrev = $(BTN_PREV);
  const btnNext = $(BTN_NEXT);
  const btnNextLabel = btnNext?.querySelector('span');

  if (!btnPrev) console.warn('[WARN] Botão VOLTAR não encontrado:', BTN_PREV);
  if (!btnNext) console.warn('[WARN] Botão AVANÇAR não encontrado:', BTN_NEXT);

  const etapa4 = document.querySelector('#etapa-4');
  if (!etapa4 || !btnNext || !btnNextLabel) {
      //console.warn('[WARN] Elementos de Etapa 4 não encontrados.');
      return;
  }

  // Campos da etapa 4 + renda (etapa 3)
  const inputValorMoto    = etapa4.querySelector('#valor-moto');
  const inputValorEntrada = etapa4.querySelector('#valor-entrada');
  const ppaErroEl         = etapa4.querySelector('#ppa-erro');
  const inputRenda        = document.querySelector('#renda_mensal');
  if (inputValorEntrada) {
    inputValorEntrada.dataset.allowEmpty = 'true';
  }

  // -------------------------------------------------------------------------
  // MÁSCARAS E BINDINGS DE ESTADO (CORRETO)
  // -------------------------------------------------------------------------

  // **USANDO attachCurrencyMask para garantir valores numéricos limpos**
  const maskMoto    = inputValorMoto    ? attachCurrencyMask(inputValorMoto)    : null;
  const maskEntrada = inputValorEntrada ? attachCurrencyMask(inputValorEntrada) : null;
  const maskRenda   = inputRenda        ? attachCurrencyMask(inputRenda)        : null;

  // Placeholder dinâmico (40%)
  const renderPlaceholderMin = () => {
    const min = getMinEntrada40();
    const placeholderText = `Min. sugerido: ${formatNumberToBRL(min)}`;
    inputValorEntrada.setAttribute('placeholder', placeholderText);
    console.log(`[FORM] renderPlaceholderMin() chamado. Placeholder: "${placeholderText}"`); // << LOG AQUI
  };

  const resetEntradaComPlaceholderMin = () => {
    // Isto define state.entradaDeveExibirPlaceholder = true, que fará a máscara limpar o campo.
    console.log('[FORM] resetEntradaComPlaceholderMin() chamado. DISPARANDO setValorEntrada(0)...'); 
    // Limpa o valor manualmente, não via estado
    inputValorEntrada.value = '';

    // Apenas define placeholder com 40% calculado
    renderPlaceholderMin();    
    console.log('[FORM] reset concluído. Verifique o console para a mensagem de SUPRESSÃO da máscara.');
  };

  // Bindings para o estado global
  const onRendaChange = () => {
    const v = maskRenda?.getNumericValue ? maskRenda.getNumericValue() : 0;
    setRenda(v);
  };

  const onMotoChange = () => {
    const v = maskMoto?.getNumericValue ? maskMoto.getNumericValue() : 0;
    setValorMoto(v);
    resetEntradaComPlaceholderMin(); // Zera entrada e recalcula o mínimo
  };

  const onEntradaChange = () => {
    const v = maskEntrada?.getNumericValue ? maskEntrada.getNumericValue() : 0;
    setValorEntrada(v);
  };

  ['input','keyup','change','blur'].forEach(ev => {
    inputRenda?.addEventListener(ev, onRendaChange);
    inputValorMoto?.addEventListener(ev, onMotoChange);
    inputValorEntrada?.addEventListener(ev, onEntradaChange);
  });
  
  // -------------------------------------------------------------------------
  // LISTENERS DE NAVEGAÇÃO E GRUPOS DE BOTÕES
  // -------------------------------------------------------------------------

  btnPrev?.addEventListener('click', (e) => {
    e.preventDefault();
    //console.log('[CLICK] Botão VOLTAR');
    prevStep(); 
  });

  // “Você é” → define tipoUsuario, não navega
  const tipoBtns = document.querySelectorAll(TIPO_USUARIO_BTNS);
  tipoBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const valor = btn.getAttribute('data-tipo-usuario'); // comprador | vendedor
      setTipoUsuario(valor);

      // Atualiza aria-pressed visual do grupo
      tipoBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
    });
  });

  // CNH
  const cnhBtns = document.querySelectorAll(CNH_BTNS);
  const cnhHidden = document.querySelector('#possui-cnh');
  if (cnhBtns.length > 0 && cnhHidden) {
    cnhBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const valor = btn.getAttribute('data-cnh'); // sim | nao
        cnhHidden.value = valor;

        // Visual do grupo com aria-pressed
        cnhBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
      });
    });
  }

  // Lógica do botão AVANÇAR/ENVIAR (validação e PPA)
  btnNext?.addEventListener('click', (e) => {
    e.preventDefault(); // Controlamos o fluxo manualmente

    const etapa4Visivel = !etapa4.classList.contains('hidden');

    // Validação de inputs na etapa atual (Fase 1)
    const res = verificaEtapaAtual(); 
    if (!res.ok) {
      //console.warn('[VALIDATE] avanço BLOQUEADO pela validação da etapa atual');
      if (res.firstInvalid && typeof res.firstInvalid.focus === 'function') {
        res.firstInvalid.focus();
      }
      res.firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return; // NÃO avança
    }
    
    // Se não for a última etapa, avança a etapa
    if (!etapa4Visivel) {
      //console.log('[CLICK] Botão AVANÇAR');
      nextStep(); // tudo ok → avança
      return;
    }
    
    // -------------------------------------------------------------------------
    // LÓGICA PPA (ETAPA 4 - Botão ENVIAR)
    // -------------------------------------------------------------------------

    // Garante que os inputs estão atualizados no estado antes da PPA
    onRendaChange(); 
    //onMotoChange(); 
    onEntradaChange(); 
    
    const { renda, valorMoto, entrada } = getPpaInputs();
    
    // Chama a PPA, que retorna um array de códigos de falha (vazio se aprovado)
    const codigosDeFalha = avaliarPPAComGuardas({ renda, valorMoto, entrada }, calcularPPA);

    if (codigosDeFalha.length === 0) {
      // APROVADO
      ppaErroEl?.classList.add('hidden');
      if (ppaErroEl) ppaErroEl.innerHTML = '';
      //console.log('[PPA] Aprovado ✅. Submetendo formulário...');
      // Submete o formulário
      document.querySelector('#financiamento-form')?.submit(); 
    } else {
      // REPROVADO
      //console.warn('[PPA] Reprovado ❌', codigosDeFalha);

      // 1. GERAÇÃO DOS MOTIVOS DE REPROVAÇÃO
      // <<<< Esta chamada agora funciona porque obterMotivosDeReprovacao está importada >>>>
      const motivos = obterMotivosDeReprovacao(codigosDeFalha);
      // Usando classes Tailwind para estilizar a lista
      const listaMotivos = motivos.map(m => `<li class="ml-5 text-[#B91C1C]">${m}</li>`).join('');

      // 2. GERAÇÃO DAS SUGESTÕES
      // <<<< Esta chamada agora funciona porque calcularSugestoes está importada >>>>
      const sugestoes = calcularSugestoes(codigosDeFalha, valorMoto, entrada, renda);
      // Usando classes Tailwind para estilizar a lista (valores já estão em <b></b>)
      const listaSugestoes = sugestoes.map(s => `<li class="ml-5 text-[#B91C1C]">${s}</li>`).join('');

      // 3. CONSTRUÇÃO DA MENSAGEM FINAL (HTML)
      let mensagemHTML = '';
      if (motivos.length > 0) {
          // Classes Tailwind para o título de reprovação
          mensagemHTML += `<p class="font-bold text-[#B91C1C] mb-2">Pré-Análise Não Concedida.</p>`;
          mensagemHTML += `<ul class="list-disc space-y-1">${listaMotivos}</ul>`;
      }
      if (sugestoes.length > 0) {
          // Classes Tailwind para o título de sugestão
          mensagemHTML += `<p class="font-bold mt-4 mb-2 text-[#B91C1C]">Para ser aprovado, sugerimos que você:</p>`;
          mensagemHTML += `<ul class="list-disc space-y-1">${listaSugestoes}</ul>`;
      }

      if (ppaErroEl) {
        ppaErroEl.innerHTML = mensagemHTML || 'Proposta reprovada.';
        // Estiliza o container de erro (fundo, borda, sombra)
        //ppaErroEl.classList.add('p-4', 'bg-[#B91C1C]/60', 'border', 'border-red-400', 'rounded-2xl', 'shadow-md');
        ppaErroEl.classList.remove('hidden');
      }
    }
    console.groupEnd();
  });

  // -------------------------------------------------------------------------
  // SETUP VISUAL
  // -------------------------------------------------------------------------

  // Botão Next vira "Enviar" só na Etapa 4
  const updateNextLabelForCurrentStep = () => {
    const etapa4Visivel = !etapa4.classList.contains('hidden');
    btnNextLabel.textContent = etapa4Visivel ? 'Enviar' : 'Avançar';
  };

  // Observer para garantir que o label do botão e o placeholder sejam atualizados
  const etapa4Observer = new MutationObserver(() => {
    updateNextLabelForCurrentStep();
    if (!etapa4.classList.contains('hidden')) {
      renderPlaceholderMin();
    }
  });
  etapa4Observer.observe(etapa4, { attributes: true, attributeFilter: ['class'] });
  updateNextLabelForCurrentStep();

  // Restaura estado CNH na inicialização
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
