// appState.js
// Guarda o estado global da aplicação (fluxo inteiro).
// Não toca DOM, não chama API. Só guarda e fornece dados.
// Qualquer módulo pode importar isso pra ler / atualizar estado.

// -----------------------------------------------------------------------------
// ESTADO INTERNO
// -----------------------------------------------------------------------------
const L = (...a) => console.log('[STATE]', ...a);

  // Qual "tela" ou view está ativa no momento.
  // Exemplos esperados:
  // "etapa-1", "etapa-2", "etapa-3", "etapa-4",
  // "aprovado", "reprovado", "simulacao"
  export const state = {
  currentView: 'etapa-1',
  tipoUsuario: null,
  possuiCNH: null,
  maxStepReached: 1, // ✅ progresso mais avançado atingido

  // Se você quiser travar uma view específica no modo dev,
  // você seta isso antes de iniciar a aplicação.
  // Se devOverride estiver setado, ele vence tudo.
  devOverride: null, // ex: "simulacao", "aprovado", "etapa-3", etc.

  // Quem é o usuário (impacta fluxo das etapas)
  // "comprador" | "vendedor"
  tipoUsuario: null,

  // CNH: true/false ou null se ainda não escolheu
  possuiCNH: null,

  // Dados já coletados do formulário (parciais ou finalizados)
  // Vamos ir preenchendo isso etapa por etapa.
  formData: {
    // etapa identificação
    tipoUsuario: null,

    // etapa vendedor
    loja: null,
    nomeVendedor: null,
    emailVendedor: null,

    // etapa cliente
    nomeCliente: null,
    cpf: null,
    possuiCNH: null,
    emailCliente: null,
    telefoneCliente: null,

    // etapa venda
    rendaMensal: null,
    valorMoto: null,
    valorEntrada: null,
  },

  valorEntrada: null, // O valor numérico da entrada
  entradaTouched: false, // Indica se o usuário digitou algo
  entradaDeveExibirPlaceholder: false,
  analiseCredito: null,

  // Escolha final da simulação (pra depois mandar pro backend)
  // Exemplo:
  // {
  //   valorMoto: 15000,
  //   entrada: 3000,
  //   financiamento: 12000,
  //   prazo: 24,               // meses
  //   valorParcela: 650.50
  // }
  simulacaoEscolhida: null,
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// -----------------------------------------------------------------------------
// GETTERS (LEITURA DO ESTADO)
// -----------------------------------------------------------------------------

export function getState() {
  // Retorna a referência do objeto inteiro.
  // Uso: const { currentView } = getState();
  return state;
}

export function getCurrentView() {
  return state.currentView;
}

export function getFormData() {
  return state.formData;
}

export function getAnaliseCredito() {
  return state.analiseCredito;
}

export function getSimulacaoEscolhida() {
  return state.simulacaoEscolhida;
}

export function getMaxStepReached() {
  return state.maxStepReached;
}

export function getMinEntrada40() {
  return round2((state.valorMoto || 0) * 0.40);
}

export function getPpaInputs() {
  const entrada = (state.entradaTouched && state.valorEntrada != null)
    ? state.valorEntrada
    : getMinEntrada40();

  return {
    renda: state.renda || 0,
    valorMoto: state.valorMoto || 0,
    entrada,
  };
}

// -----------------------------------------------------------------------------
// SETTERS / UPDATERS (MUDAR ESTADO)
// -----------------------------------------------------------------------------

// Trocar a "tela" atual
export function setView(viewName) {
    // se devOverride estiver ativo, ignoramos qualquer tentativa de mudar view
    if (state.devOverride) {
        //L('setView ignorado por devOverride=', state.devOverride);
        state.currentView = state.devOverride;
        return;
    }
    //L('setView ->', viewName);
    state.currentView = viewName;
}

// Forçar o modo dev (você chama isso logo no boot se quiser pular direto pra uma view)
export function setDevOverride(viewName) {
     state.devOverride = viewName;
    state.currentView = viewName;
}

// Atualiza tipo de usuário ("comprador" | "vendedor")
export function setTipoUsuario(tipo) {
    //L('setTipoUsuario ->', tipo);
     state.tipoUsuario = tipo;
     state.formData.tipoUsuario = tipo;
}

// Atualiza info de CNH (true/false)
export function setPossuiCNH(flagCNH) {
    //L('setPossuiCNH ->', flag);  
    state.possuiCNH = flagCNH;
    state.formData.possuiCNH = flagCNH;
}

export function setMaxStepReached(stepNumber) {
  const safeStep = Math.max(1, Number(stepNumber) || 1);
  state.maxStepReached = Math.max(state.maxStepReached, safeStep);
}

export function setRenda(v) {
  state.renda = round2(v);
}

export function setValorMoto(v) {
  state.valorMoto = round2(v);
  // sempre que a moto muda, a entrada volta a depender do mínimo sugerido (40%)
  state.valorEntrada = null;
  state.entradaTouched = false;
}

export function setValorEntrada(v) {
  const num = round2(v); // Assumindo round2 está acessível

  if (num === 0 || num === null || Number.isNaN(num)) {
    state.valorEntrada = null;
    state.entradaTouched = false;
    state.entradaDeveExibirPlaceholder = true; // <<-- ATIVA FLAG: Deve mostrar placeholder
  } else {
    state.valorEntrada = num;
    state.entradaTouched = true;
    state.entradaDeveExibirPlaceholder = false; // <<-- DESATIVA FLAG: Valor digitado
  }
}

export function getEntradaDeveExibirPlaceholder() {
    return state.entradaDeveExibirPlaceholder;
}

// Atualiza um pedaço da etapa de vendedor
export function mergeVendedorData({ loja, nomeVendedor, emailVendedor }) {
    //L('mergeVendedorData', state.formData);
    if (loja !== undefined) state.formData.loja = loja;
    if (nomeVendedor !== undefined) state.formData.nomeVendedor = nomeVendedor;
    if (emailVendedor !== undefined) state.formData.emailVendedor = emailVendedor;
}

// Atualiza um pedaço da etapa de cliente
export function mergeClienteData({
    nomeCliente,
    cpf,
    possuiCNH,
    emailCliente,
    telefoneCliente,
}) {
    if (nomeCliente !== undefined) state.formData.nomeCliente = nomeCliente;
    if (cpf !== undefined) state.formData.cpf = cpf;
    if (possuiCNH !== undefined) {
        state.possuiCNH = possuiCNH;
        state.formData.possuiCNH = possuiCNH;
    }
    if (emailCliente !== undefined) state.formData.emailCliente = emailCliente;
    if (telefoneCliente !== undefined)
        state.formData.telefoneCliente = telefoneCliente;
    //L('mergeClienteData', state.formData);
}

// Atualiza um pedaço da etapa de venda
export function mergeVendaData({
  rendaMensal,
  valorMoto,
  valorEntrada,
}) {
    //L('mergeVendaData', state.formData);
    if (rendaMensal !== undefined) state.formData.rendaMensal = rendaMensal;
    if (valorMoto !== undefined) state.formData.valorMoto = valorMoto;
    if (valorEntrada !== undefined) state.formData.valorEntrada = valorEntrada;
}

// Guarda o resultado da análise de crédito que veio da(s) API(s)
export function setAnaliseCredito(analiseObj) {
  state.analiseCredito = analiseObj;
}

// Guarda a escolha final da simulação (pra envio depois)
export function setSimulacaoEscolhida(simulacaoObj) {
  state.simulacaoEscolhida = simulacaoObj;
}

// -----------------------------------------------------------------------------
// HELPERS DE ESTADO (LÓGICA SIMPLES DE FLUXO)
// -----------------------------------------------------------------------------

// Saber se etapa "vendedor" é obrigatória ou pode ser pulada
// Se tipoUsuario === "comprador", normalmente pula os dados de vendedor
export function vendedorEhObrigatorio() {
  return state.tipoUsuario === "vendedor";
}


// Saber se a etapa informada é a última etapa do formulário (antes de chamar API)
export function etapaEhUltimaDoFormulario(etapaId) {
  // depois da última etapa válida, o próximo passo é análise de crédito (aprovado/reprovado)
  return getProximaEtapa(etapaId) === null;
}

export function setState(partial) {
  state = { ...state, ...partial };
  console.log('[STATE] setState →', partial);
}
