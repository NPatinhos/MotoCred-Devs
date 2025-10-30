// uiRenderer.js
// Mostra/esconde as sections corretas com base no estado atual (appState.currentView).
// Não contém regra de negócio. Não chama API. Só lida com DOM e classes de visibilidade.
//
// Requisitos de HTML (ajuste os IDs abaixo para bater com o seu index.html):
// - Etapas do formulário: <section id="etapa-1" class="form-step"> ... </section> (até etapa-4)
// - Tela aprovado:  <section id="pagina-aprovado"  class="hidden">...</section>
// - Tela reprovado: <section id="pagina-negado"    class="hidden">...</section>
// - (Opcional) Tela simulação separada: <section id="pagina-simulacao" class="hidden">...</section>
//
// Tailwind: usa .hidden para ocultar e adiciona .flex .items-center .justify-center quando mostra páginas finais.
// Para as etapas, deixo você com as classes que já usa (ex.: .is-hidden-step / .is-active) se quiser manter.

import { getState } from './appState.js';
const R = (...a) => console.log('[RENDER]', ...a);


// IDs esperados no DOM (ajuste se necessário)
const FORM_STEPS = ['etapa-1', 'etapa-2', 'etapa-3', 'etapa-4'];
const PAGE_APROVADO_ID  = 'pagina-aprovado';
const PAGE_NEGADO_ID    = 'pagina-negado';
// se você não tiver uma página separada de "simulação", mantemos mapeado para "pagina-aprovado"
const PAGE_SIMULACAO_ID = 'pagina-simulacao'; // opcional; se não existir, caímos no aprovado

// Cache simples de nós (evita querySelector repetido)
const cache = new Map();
function el(id) {
  if (!cache.has(id)) cache.set(id, document.getElementById(id));
  return cache.get(id);
}

// Helpers básicos de visibilidade
function hideNode(node) {
  if (!node) return;
  node.classList.add('hidden');
  node.classList.remove('flex');
}

function showNodeAsFlexCentered(node) {
  if (!node) return;
  node.classList.remove('hidden');
  node.classList.add('flex', 'items-center', 'justify-center', 'min-h-screen');
}

function showFormStep(stepId) {
  // Esconde todas as steps
  for (const id of FORM_STEPS) {
    const section = el(id);
    if (!section) continue;
    section.classList.add('hidden'); // você pode trocar por sua classe .is-hidden-step se preferir
    section.classList.remove('is-active');
  }
  // Mostra a step atual
  const current = el(stepId);
  if (current) {
    current.classList.remove('hidden');
    current.classList.add('is-active');
  }
}

// Zera tudo que não é a view atual
function hideAllSections() {
    R('hideAllSections()');

  // Esconde todas as etapas
  for (const id of FORM_STEPS) hideNode(el(id));
  // Esconde páginas finais
  hideNode(el(PAGE_APROVADO_ID));
  hideNode(el(PAGE_NEGADO_ID));
  // Esconde simulação (se existir)
  hideNode(el(PAGE_SIMULACAO_ID));
}

// API principal: renderiza conforme appState.currentView
export function renderView() {
  const { currentView } = getState();
  R('renderView currentView=', getState().currentView);


  // 1) Esconde tudo
  hideAllSections();

  // 2) Roteia pela view
  if (currentView.startsWith('etapa-')) {
    // Etapas do formulário
    R('-> mostrar step', currentView);
    showFormStep(currentView);
    return;
  }

  if (currentView === 'reprovado') {
    R('-> mostrar reprovado');
    showNodeAsFlexCentered(el(PAGE_NEGADO_ID));
    return;
  }

  if (currentView === 'simulacao') {
    R('-> mostrar simulacao em #pagina-aprovado');
    // Se você tem uma página dedicada de simulação
    const nodeSimu = el(PAGE_SIMULACAO_ID);
    if (nodeSimu) {
      showNodeAsFlexCentered(nodeSimu);
    } else {
      // fallback: usa a página de aprovado (onde a simulação já existia)
      showNodeAsFlexCentered(el(PAGE_APROVADO_ID));
    }
    return;
  }

  // fallback defensivo: se vier uma view desconhecida, volta pra etapa-1
  R('fallback -> etapa-1');
  showFormStep('etapa-1');
}

// Opcional: se quiser forçar uma re-leitura do DOM (por exemplo, em SPA parcial)
export function invalidateCache() {
  cache.clear();
}
