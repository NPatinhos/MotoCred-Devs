// formSteps.js (versão refatorada)

// Importe as funções de navegação necessárias do stepNavigation.js
// As funções de validação (validate...) e salvamento (merge...) devem ser mantidas.
import {
    getCurrentView,
    mergeVendedorData,
    mergeClienteData,
    mergeVendaData,
} from './appState.js';
import { submitFormulario } from './flowController.js';
import {
    validateEtapaIdentificacao,
    validateEtapaVendedor,
    validateEtapaCliente,
    validateEtapaVenda,
} from './validators.js';
// Importa as novas funções de navegação
import { handleNext, handlePrev } from './stepNavigation.js'; 
//... restante das importações (moneyMask, etc.)

// ... (todas as funções auxiliares como setFieldError, getDataFromInputs, etc. são mantidas)

// -----------------------------------------
// HANDLERS DE NAVEGAÇÃO
// -----------------------------------------

async function onNext() {
    clearErrors();
    const currentView = getCurrentView();

    // 1. Validação (mantida)
    let validationResult;
    let dataToMerge = {};

    // ... (sua lógica de validação por etapa)
    
    // 2. Salvamento (mantido)
    if (validationResult.ok) {
        // ... (sua lógica de merge de dados no appState)

        // 3. AÇÃO DE NAVEGAÇÃO CENTRALIZADA
        if (currentView === 'etapa-4') {
            // Se for a última etapa, dispara o fluxo de submissão e análise
            // Aqui ele não chama handleNext, pois o fluxo pós-formulário
            // (flowController.submitFormulario) assume o controle da view.
            submitFormulario();
        } else {
            // Se não é a última etapa, chama o controlador de navegação.
            // O handleNext() sabe a próxima etapa e atualiza o DOM via goTo/renderView.
            handleNext(); // <-- DELEGANDO A NAVEGAÇÃO PARA stepNavigation.js
        }
    } else {
        showErrors(validationResult.errors);
    }
}

function onPrev() {
    clearErrors();
    // Apenas delega para o controlador de navegação anterior.
    handlePrev(); // <-- DELEGANDO A NAVEGAÇÃO PARA stepNavigation.js
}

// -----------------------------------------
// INICIALIZAÇÃO
// -----------------------------------------

export function initFormSteps() {
  // Apenas as máscaras e os binds dos botões Next/Prev devem ficar aqui.

  // máscaras de dinheiro (etapa 4)
  initMoneyMasks();

  // navegação: apenas binds dos botões Next/Prev.
  const btnPrev = $(BTN_PREV);
  const btnNext = $(BTN_NEXT);
  btnPrev?.addEventListener('click', onPrev);
  btnNext?.addEventListener('click', onNext);

  // **Remova:** bindTipoUsuarioButtons();
  // **Remova:** bindCNHButtons();
  // **Remova:** bindEtapasBarraClick(); 
}
// **Remova:** A função mapTabIdToView() e bindEtapasBarraClick() completa