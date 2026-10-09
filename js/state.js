/**
 * =============================================================================
 * SISTEMA FINANCEIRO - ESTADO GLOBAL DA APLICAÇÃO (STATE MANAGEMENT)
 * =============================================================================
 */

import { loadCategories, loadTransactions, loadLastUpdated, loadTags } from './storage.js';

const hoje = new Date();
let mesSelecionado = hoje.getMonth() + 1;
let anoSelecionado = hoje.getFullYear();

// Se o mês atual for Dezembro (11), o próximo mês é Janeiro (0) do ano seguinte
if (mesSelecionado > 11) {
  mesSelecionado = 0;
  anoSelecionado += 1;
}

export const AppState = {
  categories: loadCategories(),
  transactions: loadTransactions(),
  lastUpdated: loadLastUpdated(),
  currentRoute: 'dashboard',
  activeCategoryId: null,
  selectedMonthIndex: mesSelecionado, // 0 a 11 (inicia no próximo mês)
  selectedYear: anoSelecionado,       // ex: 2026/2027 (com rollover de ano)
  editingTransactionId: null,        // id do lançamento em modo de edição
  selectedTypeFilters: new Set(),    // tipos selecionados no Drawer de Filtros
  tags: loadTags()                   // lista de tags/classificações
};
