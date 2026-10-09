/**
 * SISTEMA FINANCEIRO - BUNDLE CONSOLIDADO
 * Gerado automaticamente a partir dos módulos em js/
 */
(function() {
'use strict';

// --- MÓDULO: js/constants.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - CONSTANTES & CONFIGURAÇÕES GLOBAIS
 * =============================================================================
 */

const STORAGE_KEYS = {
  CATEGORIES: 'financas_categorias',
  TRANSACTIONS: 'financas_lancamentos',
  TAGS: 'finance_tags',
  JSONBIN_KEY: 'financas_jsonbin_key',
  JSONBIN_BIN_ID: 'financas_jsonbin_bin_id',
  LAST_UPDATED: 'financas_last_updated'
};

const DEFAULT_TAGS = [];

const CATEGORY_TYPES = [
  { id: 'Receita', label: 'Receitas', badgeClass: 'badge-receita', isRevenue: true },
  { id: 'Conta Fixa', label: 'Contas Fixas', badgeClass: 'badge-fixa', isRevenue: false },
  { id: 'Cartão de Crédito', label: 'Cartões de Crédito', badgeClass: 'badge-cartao', isRevenue: false },
  { id: 'Variável Prevista', label: 'Variáveis Previstas', badgeClass: 'badge-variavel', isRevenue: false },
  { id: 'Repasse', label: 'Repasses', badgeClass: 'badge-repasse', isRevenue: true }
];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// --- MÓDULO: js/dom.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - CACHE & ACESSO A ELEMENTOS DO DOM
 * Getters dinâmicos para garantir resiliência e integridade das referências
 * =============================================================================
 */

const get = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);
const getAll = (sel) => (typeof document !== 'undefined' ? document.querySelectorAll(sel) : []);

const DOM = {
  get headerTitle() { return get('headerTitle'); },
  get fixedNavLinks() { return getAll('.nav-link[data-route]'); },
  get dynamicCategorySections() { return get('dynamicCategorySections'); },
  get mobileToggle() { return get('mobileToggle') || get('btnMenuToggle'); },
  get btnMenuToggle() { return get('btnMenuToggle'); },
  get sidebarOverlay() { return get('sidebarOverlay'); },
  get sidebar() { return get('sidebar'); },
  get toastContainer() { return get('toast-container') || get('toastContainer'); },

  // Seletor de Ano no Header
  get yearDisplay() { return get('yearDisplay'); },
  get btnPrevYear() { return get('btnPrevYear'); },
  get btnNextYear() { return get('btnNextYear'); },

  // Views SPA
  get viewDashboard() { return get('viewDashboard'); },
  get viewConfiguracoes() { return get('viewConfiguracoes'); },
  get viewCategoryDetail() { return get('viewCategoryDetail'); },

  // Dashboard
  get dashMonthLabel() { return get('dashMonthLabel'); },
  get dashboardMetrics() { return get('dashboardMetrics'); },
  get dashMonthTabsBar() { return get('dashMonthTabsBar'); },
  get dashboardSheetsWrapper() { return get('dashboardSheetsWrapper'); },
  get dashboardTablesContainer() { return get('dashboardTablesContainer'); },
  get dashCategoryCount() { return get('dashCategoryCount'); },
  get btnGoToConfig() { return get('btnGoToConfig'); },
  get btnAbrirFiltros() { return get('btnAbrirFiltros'); },

  // Drawer de Filtros
  get overlayFiltros() { return get('overlayFiltros'); },
  get drawerFiltros() { return get('drawerFiltros'); },
  get btnFecharFiltros() { return get('btnFecharFiltros'); },
  get drawerTiposList() { return get('drawerTiposList'); },
  get btnLimparFiltros() { return get('btnLimparFiltros'); },
  get btnConcluidoFiltros() { return get('btnConcluidoFiltros'); },

  // Configurações
  get categoryForm() { return get('categoryForm'); },
  get categoryNameInput() { return get('categoryName'); },
  get categoryTypeSelect() { return get('categoryType'); },
  get categoryTableBody() { return get('categoryTableBody'); },
  get emptyState() { return get('emptyState'); },
  get categoryCountLabel() { return get('categoryCountLabel'); },
  get nameError() { return get('nameError'); },
  get typeError() { return get('typeError'); },
  get storageStatusBadge() { return get('storageStatusBadge'); },
  get btnExportBackup() { return get('btnExportBackup'); },
  get importBackupInput() { return get('importBackupInput'); },
  get btnClearAllData() { return get('btnClearAllData'); },

  // Sincronização na Nuvem (JSONBin)
  get jsonbinApiKey() { return get('jsonbinApiKey'); },
  get jsonbinBinId() { return get('jsonbinBinId'); },
  get btnSaveCloudCreds() { return get('btnSaveCloudCreds'); },
  get btnSyncToCloud() { return get('btnSyncToCloud'); },
  get btnSyncFromCloud() { return get('btnSyncFromCloud'); },
  get cloudStatusBadge() { return get('cloudStatusBadge'); },
  get cloudLastUpdatedText() { return get('cloudLastUpdatedText'); },
  get cloudStatus() { return get('cloudStatus'); },

  // Categoria & Lançamentos
  get catHeaderName() { return get('catHeaderName'); },
  get catHeaderBadge() { return get('catHeaderBadge'); },
  get monthTabsBar() { return get('monthTabsBar'); },
  get transactionForm() { return get('transactionForm'); },
  get transDescriptionInput() { return get('transDescription'); },
  get transInstallmentInput() { return get('transInstallment'); },
  get transValueInput() { return get('transValue'); },
  get transDescError() { return get('transDescError'); },
  get transInstallmentError() { return get('transInstallmentError'); },
  get transValueError() { return get('transValueError'); },
  get itemTag() { return get('itemTag'); },
  get itemTagError() { return get('itemTagError'); },
  get btnManageTags() { return get('btnManageTags'); },
  get modalManageTagsOverlay() { return get('modalManageTagsOverlay'); },
  get btnCloseManageTags() { return get('btnCloseManageTags'); },
  get btnDoneManageTags() { return get('btnDoneManageTags'); },
  get formAddTag() { return get('formAddTag'); },
  get newTagNameInput() { return get('newTagNameInput'); },
  get btnAddTagBtn() { return get('btnAddTagBtn'); },
  get newTagError() { return get('newTagError'); },
  get manageTagsList() { return get('manageTagsList'); },
  get manageTagsEmpty() { return get('manageTagsEmpty'); },
  get transRepasseGroup() { return get('transRepasseGroup'); },
  get transRepasseSelect() { return get('transRepasseSelect'); },
  get transRepasseError() { return get('transRepasseError'); },
  get btnAddTransaction() { return get('btnAddTransaction'); },
  get btnSubmitTransIcon() { return get('btnSubmitTransIcon'); },
  get btnSubmitTransText() { return get('btnSubmitTransText'); },
  get btnCancelEdit() { return get('btnCancelEdit'); },
  get transactionTable() { return get('transactionTable'); },
  get transactionTableBody() { return get('transactionTableBody'); },
  get transactionTableFoot() { return get('transactionTableFoot'); },
  get transTotalValue() { return get('transTotalValue'); },
  get transCountLabel() { return get('transCountLabel'); },
  get emptyTransState() { return get('emptyTransState'); },
  get filtroTipoCompra() { return get('filtroTipoCompra'); },

  // Visualização Gráfica (Modal de Gráficos)
  get btnOpenChartsModal() { return get('btnOpenChartsModal'); },
  get modalChartsOverlay() { return get('modalChartsOverlay'); },
  get btnCloseChartsModal() { return get('btnCloseChartsModal'); },
  get btnDoneChartsModal() { return get('btnDoneChartsModal'); },
  get chartsModalSubtitle() { return get('chartsModalSubtitle'); },
  get chartMonthSelect() { return get('chartMonthSelect'); },
  get btnChartPeriodMonth() { return get('btnChartPeriodMonth'); },
  get btnChartPeriodYear() { return get('btnChartPeriodYear'); },
  get btnChartGroupCategory() { return get('btnChartGroupCategory'); },
  get btnChartGroupType() { return get('btnChartGroupType'); },
  get btnChartGroupTag() { return get('btnChartGroupTag'); },
  get chartsTotalExpensesVal() { return get('chartsTotalExpensesVal'); },
  get chartsCountLabel() { return get('chartsCountLabel'); },
  get donutContainer() { return get('donutContainer'); },
  get rankingContainer() { return get('rankingContainer'); },
  get evolutionContainer() { return get('evolutionContainer'); }
};


// --- MÓDULO: js/normalization.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - NORMALIZAÇÃO ROBUSTA DE DADOS
 * =============================================================================
 */

function normalizeCategoryType(rawType) {
  if (!rawType) return 'Conta Fixa';
  const clean = rawType.toString().trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (clean.includes('receit')) return 'Receita';
  if (clean.includes('cartao') || clean.includes('credito')) return 'Cartão de Crédito';
  if (clean.includes('fix')) return 'Conta Fixa';
  if (clean.includes('var') || clean.includes('previst')) return 'Variável Prevista';
  if (clean.includes('repass')) return 'Repasse';

  return rawType.toString().trim();
}

function normalizeCategory(item, idx = 0) {
  if (typeof item === 'string') {
    return {
      id: 'cat_' + Date.now() + '_' + idx,
      name: item.trim(),
      type: 'Conta Fixa'
    };
  }

  const name = (item.name || item.nome || item.descricao || item.title || '').toString().trim();
  const rawType = (item.type || item.tipo || item.categoria || item.grupo || 'Conta Fixa').toString().trim();
  const type = normalizeCategoryType(rawType);
  const id = item.id ? String(item.id) : ('cat_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6));

  return { id, name, type };
}

function normalizeTransaction(item, idx = 0) {
  const id = item.id ? String(item.id) : ('lanc_' + Date.now() + '_' + idx);
  const groupId = item.groupId ? String(item.groupId) : null;
  const linkedId = item.linkedId ? String(item.linkedId) : null;
  const categoryId = item.categoryId ? String(item.categoryId) : null;
  const categoryName = (item.categoryName || item.categoria || item.category || '').toString().trim();
  
  let year = new Date().getFullYear();
  if (item.year !== undefined && item.year !== null) {
    year = Number(item.year);
  } else if (item.ano !== undefined && item.ano !== null) {
    year = Number(item.ano);
  }

  let monthIndex = new Date().getMonth();
  if (item.monthIndex !== undefined && item.monthIndex !== null) {
    monthIndex = Number(item.monthIndex);
  } else if (item.mes !== undefined && item.mes !== null) {
    monthIndex = Number(item.mes);
  }

  const description = (item.description || item.descricao || item.desc || '').toString().trim();
  const installment = (item.installment || item.parcela || '-').toString().trim();
  const value = Number(item.value !== undefined ? item.value : (item.valor !== undefined ? item.valor : 0)) || 0;
  const isPaid = Boolean(item.isPaid !== undefined ? item.isPaid : (item.pago !== undefined ? item.pago : (item.status === true || item.status === 'pago')));
  const isRevenue = item.isRevenue !== undefined ? Boolean(item.isRevenue) : undefined;
  const categoryType = item.categoryType ? normalizeCategoryType(item.categoryType) : undefined;
  const tag = (item.tag || item.classificacao || item.classification || '').toString().trim();

  return { id, groupId, linkedId, categoryId, categoryName, categoryType, year, monthIndex, description, installment, value, isPaid, isRevenue, tag };
}

// --- MÓDULO: js/storage.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - MOTOR DE ARMAZENAMENTO SEGURO & PERSISTÊNCIA
 * =============================================================================
 */


let cloudSyncHook = null;
let toastHook = null;

function setCloudSyncHook(fn) {
  cloudSyncHook = fn;
}

function setToastHook(fn) {
  toastHook = fn;
}

function notifyCloudSync() {
  if (typeof cloudSyncHook === 'function') {
    cloudSyncHook();
  } else if (typeof window !== 'undefined' && typeof window.Financas?.triggerCloudSync === 'function') {
    window.Financas.triggerCloudSync();
  }
}

function notifyToast(message, type) {
  if (typeof toastHook === 'function') {
    toastHook(message, type);
  } else if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
    window.showToast(message, type);
  }
}

const StorageEngine = {
  isAvailable: false,

  init() {
    try {
      const testKey = '__financas_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      this.isAvailable = true;
    } catch (e) {
      console.warn('localStorage inacessível. Usando sessionStorage como fallback seguro:', e);
      this.isAvailable = false;
    }
  },

  set(key, data) {
    const serialized = JSON.stringify(data);
    let success = false;

    try {
      localStorage.setItem(key, serialized);
      const verify = localStorage.getItem(key);
      if (verify === serialized) success = true;
    } catch (err) {
      console.error(`Erro ao salvar no localStorage para [${key}]:`, err);
    }

    try {
      sessionStorage.setItem(key, serialized);
    } catch (e) {}

    return success;
  },

  get(key) {
    try {
      const fromLocal = localStorage.getItem(key);
      if (fromLocal) return JSON.parse(fromLocal);
    } catch (e) {
      console.warn(`Falha na leitura do localStorage [${key}]:`, e);
    }

    try {
      const fromSession = sessionStorage.getItem(key);
      if (fromSession) return JSON.parse(fromSession);
    } catch (e) {}

    return null;
  }
};

StorageEngine.init();

function loadLastUpdated() {
  const data = StorageEngine.get(STORAGE_KEYS.LAST_UPDATED);
  if (data && typeof data === 'number') return data;
  if (data && !isNaN(Number(data))) return Number(data);
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
    if (raw && !isNaN(Number(raw))) return Number(raw);
  } catch (e) {}
  return 0;
}

function formatTimestamp(ts) {
  if (!ts || isNaN(Number(ts)) || Number(ts) <= 0) return 'Nunca';
  try {
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return 'Nunca';
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return 'Nunca';
  }
}

function updateLastUpdatedUI(customTs) {
  if (DOM.cloudLastUpdatedText) {
    const ts = customTs !== undefined ? customTs : loadLastUpdated();
    const formatted = formatTimestamp(ts);
    DOM.cloudLastUpdatedText.textContent = `Última modificação local: ${formatted}`;
  }
}

function touchLastUpdated(ts = Date.now()) {
  const numTs = Number(ts) || Date.now();
  if (typeof window !== 'undefined' && window.Financas?.AppState) {
    window.Financas.AppState.lastUpdated = numTs;
  }
  StorageEngine.set(STORAGE_KEYS.LAST_UPDATED, numTs);
  updateLastUpdatedUI(numTs);
  return numTs;
}

function loadCategories() {
  const data = StorageEngine.get(STORAGE_KEYS.CATEGORIES);
  if (Array.isArray(data) && data.length > 0) {
    return data.map((c, idx) => normalizeCategory(c, idx)).filter(c => c.name.length > 0);
  }
  return [];
}

function saveCategories(categories, skipTouch = false) {
  const saved = StorageEngine.set(STORAGE_KEYS.CATEGORIES, categories);
  if (!skipTouch) {
    touchLastUpdated();
    notifyCloudSync();
  }
  if (!saved) {
    notifyToast('Atenção: verifique se o navegador bloqueia dados locais.', 'error');
  }
  return saved;
}

function loadTransactions() {
  const data = StorageEngine.get(STORAGE_KEYS.TRANSACTIONS);
  if (Array.isArray(data) && data.length > 0) {
    return data.map((t, idx) => normalizeTransaction(t, idx)).filter(t => t.categoryName.length > 0);
  }
  return [];
}

function saveTransactions(transactions, skipTouch = false) {
  const saved = StorageEngine.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  if (!skipTouch) {
    touchLastUpdated();
    notifyCloudSync();
  }
  if (!saved) {
    notifyToast('Atenção: verifique se o navegador bloqueia dados locais.', 'error');
  }
  return saved;
}

function loadTags() {
  let data = StorageEngine.get(STORAGE_KEYS.TAGS);
  if (!data) {
    data = StorageEngine.get('financas_tags');
  }
  if (Array.isArray(data)) {
    return data.map(t => String(t).trim()).filter(Boolean);
  }
  saveTags([], true);
  return [];
}

function saveTags(tags, skipTouch = false) {
  const list = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [];
  const saved = StorageEngine.set(STORAGE_KEYS.TAGS, list);
  StorageEngine.set('financas_tags', list);
  if (!skipTouch) {
    touchLastUpdated();
    notifyCloudSync();
  }
  return saved;
}

// --- MÓDULO: js/state.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - ESTADO GLOBAL DA APLICAÇÃO (STATE MANAGEMENT)
 * =============================================================================
 */


const hoje = new Date();
let mesSelecionado = hoje.getMonth() + 1;
let anoSelecionado = hoje.getFullYear();

// Se o mês atual for Dezembro (11), o próximo mês é Janeiro (0) do ano seguinte
if (mesSelecionado > 11) {
  mesSelecionado = 0;
  anoSelecionado += 1;
}

const AppState = {
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

// --- MÓDULO: js/utils.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - FEEDBACK VISUAL & UTILITÁRIOS
 * =============================================================================
 */


function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Exibe notificação flutuante (Toast) adaptada ao Dark Mode.
 * @param {string} message Texto da notificação
 * @param {'success'|'error'|'info'} type Tipo do alerta
 */
function showToast(message, type = 'success') {
  const container = DOM.toastContainer;
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  toast.innerHTML = `${icon}<span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, 3000);
}

// Vincula ao storage e global
setToastHook(showToast);
if (typeof window !== 'undefined') {
  window.showToast = showToast;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

/**
 * Aplica máscara dinâmica de moeda (BRL) em tempo real no evento input.
 * Permite valores negativos para estornos sem travar ao apagar dígitos.
 * @param {Event} e - Evento input
 */
function handleCurrencyInput(e) {
  const input = e.target;
  let rawValue = input.value;

  if (!rawValue || rawValue.trim() === '' || rawValue.trim() === '-') {
    return;
  }

  const isNegative = rawValue.includes('-');
  const digits = rawValue.replace(/\D/g, '');

  if (!digits || digits === '0') {
    input.value = isNegative ? '-R$ 0,00' : 'R$ 0,00';
    return;
  }

  const valor = parseFloat(digits) / 100;
  let valorFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);

  if (isNegative) {
    valorFormatado = '-' + valorFormatado.replace(/^-/, '');
  }

  input.value = valorFormatado;
}

/**
 * Desmascara string de moeda BRL para float para persistência e cálculos.
 * @param {string|number} valorFormatado - Ex: "1.500,00", "R$ 1.500,00", "-R$ 50,00"
 * @returns {number} Valor numérico float
 */
function parseCurrencyToFloat(valorFormatado) {
  if (typeof valorFormatado === 'number') {
    return isNaN(valorFormatado) ? 0 : valorFormatado;
  }
  if (!valorFormatado || typeof valorFormatado !== 'string') {
    return 0;
  }

  const isNegative = valorFormatado.includes('-');
  let limpo = valorFormatado
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '');

  limpo = limpo.replace(',', '.');
  let valorFloat = parseFloat(limpo);

  if (isNaN(valorFloat)) {
    return 0;
  }

  if (isNegative && valorFloat > 0) {
    valorFloat = -valorFloat;
  }

  return valorFloat;
}

/**
 * Debounce para evitar sobrecarga de requisições
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay = 3000) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Atualiza o indicador #cloudStatus no cabeçalho
 */
function setCloudStatus(state, customText) {
  if (!DOM.cloudStatus) return;

  DOM.cloudStatus.classList.remove('syncing', 'synced', 'error', 'disconnected');

  if (state === 'syncing') {
    DOM.cloudStatus.classList.add('syncing');
    DOM.cloudStatus.textContent = customText || '🔄 A sincronizar...';
    DOM.cloudStatus.style.color = '#f59e0b';
    DOM.cloudStatus.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    DOM.cloudStatus.style.backgroundColor = 'rgba(245, 158, 11, 0.12)';
  } else if (state === 'synced') {
    DOM.cloudStatus.classList.add('synced');
    DOM.cloudStatus.textContent = customText || '☁️ Nuvem Atualizada';
    DOM.cloudStatus.style.color = '#10b981';
    DOM.cloudStatus.style.borderColor = 'rgba(16, 185, 129, 0.35)';
    DOM.cloudStatus.style.backgroundColor = 'rgba(16, 185, 129, 0.12)';
  } else if (state === 'error') {
    DOM.cloudStatus.classList.add('error');
    DOM.cloudStatus.textContent = customText || '⚠️ Erro na Nuvem';
    DOM.cloudStatus.style.color = '#ef4444';
    DOM.cloudStatus.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    DOM.cloudStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
  } else {
    DOM.cloudStatus.classList.add('disconnected');
    DOM.cloudStatus.textContent = customText || '☁️ Nuvem Atualizada';
    DOM.cloudStatus.style.color = '';
    DOM.cloudStatus.style.borderColor = '';
    DOM.cloudStatus.style.backgroundColor = '';
  }
}

// --- MÓDULO: js/calculations.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - CAMADA DE CÁLCULO E REGRAS DE NEGÓCIO PURAS
 * Isolada do DOM - Altamente testável via testes unitários
 * =============================================================================
 */


/**
 * LÓGICA DE PARCELAMENTO & VIRADA DE ANO:
 * Gera parcelas e contas fixas/variáveis considerando a transição de ano (ex: mês 11 de 2026 -> mês 0 de 2027).
 * 
 * @param {Object} params
 * @param {string} params.description
 * @param {number} params.value
 * @param {string} [params.installment='-']
 * @param {number} params.monthIndex
 * @param {number} params.year
 * @param {string} params.categoryName
 * @param {string} [params.categoryType='Conta Fixa']
 * @param {boolean} [params.isPaid=false]
 * @param {string} [params.tag='']
 * @returns {Array<Object>}
 */
function generateTransactionsMultiYear({
  description = '',
  value = 0,
  installment = '-',
  monthIndex = 0,
  year = new Date().getFullYear(),
  categoryId = null,
  categoryName = '',
  categoryType = 'Conta Fixa',
  isPaid = false,
  shouldPropagate = true,
  linkedId = null,
  isRevenue = undefined,
  tag = ''
} = {}) {
  const descVal = (description || '').toString().trim();
  const valNum = Number(value) || 0;
  const installmentRaw = (installment || '-').toString().trim();
  const currentMonth = Number(monthIndex) || 0;
  const currentYear = Number(year) || new Date().getFullYear();
  const typeNorm = normalizeCategoryType(categoryType);
  const isFixedOrVariable = (typeNorm === 'Conta Fixa' || typeNorm === 'Variável Prevista' || typeNorm === 'Receita' || typeNorm === 'Repasse');
  const fractionMatch = installmentRaw.match(/^(\d+)\s*\/\s*(\d+)$/);
  const tagVal = (tag || '').toString().trim();

  // 1. REGRA PARA CONTAS FIXAS E VARIÁVEIS PREVISTAS:
  if (isFixedOrVariable && !fractionMatch) {
    if (!shouldPropagate) {
      return [{
        id: 'lanc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        groupId: null,
        linkedId: linkedId || null,
        categoryId: categoryId || null,
        categoryName: categoryName.trim(),
        categoryType: typeNorm,
        year: currentYear,
        monthIndex: ((currentMonth % 12) + 12) % 12,
        description: descVal,
        installment: installmentRaw || '-',
        value: valNum,
        isPaid: Boolean(isPaid),
        tag: tagVal,
        ...(isRevenue !== undefined ? { isRevenue } : {})
      }];
    }

    const groupId = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const result = [{
      id: 'lanc_' + Date.now() + '_0_' + Math.random().toString(36).substring(2, 6),
      groupId,
      linkedId: linkedId || null,
      categoryId: categoryId || null,
      categoryName: categoryName.trim(),
      categoryType: typeNorm,
      year: currentYear,
      monthIndex: currentMonth,
      description: descVal,
      installment: installmentRaw || '-',
      value: valNum,
      isPaid: Boolean(isPaid),
      tag: tagVal,
      ...(isRevenue !== undefined ? { isRevenue } : {})
    }];

    // Gera os lançamentos do mês seguinte (currentMonth + 1) até o índice 11 (Dezembro) do ano atual
    for (let m = currentMonth + 1; m <= 11; m++) {
      result.push({
        id: 'lanc_' + Date.now() + '_' + (m - currentMonth) + '_' + Math.random().toString(36).substring(2, 6),
        groupId,
        linkedId: linkedId || null,
        categoryId: categoryId || null,
        categoryName: categoryName.trim(),
        categoryType: typeNorm,
        year: currentYear,
        monthIndex: m,
        description: descVal,
        installment: installmentRaw || '-',
        value: valNum,
        isPaid: false,
        tag: tagVal,
        ...(isRevenue !== undefined ? { isRevenue } : {})
      });
    }
    return result;
  }

  // 2. REGRA PARA CONTAS PARCELADAS (MANTÉM-SE A VIRADA DE ANO):
  if (fractionMatch) {
    const currentInst = parseInt(fractionMatch[1], 10);
    const totalInst = parseInt(fractionMatch[2], 10);

    if (currentInst <= 0 || totalInst <= 0) {
      throw new Error('Os números da parcela devem ser maiores que zero.');
    }

    if (currentInst > totalInst) {
      throw new Error('A parcela atual não pode ser maior que o total.');
    }

    const groupId = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const result = [];
    const totalRemaining = totalInst - currentInst + 1;

    for (let i = 0; i < totalRemaining; i++) {
      const p = currentInst + i;
      const targetMonth = (currentMonth + i) % 12;
      const targetYear = currentYear + Math.floor((currentMonth + i) / 12);

      result.push({
        id: 'lanc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) + '_' + p,
        groupId,
        linkedId: linkedId || null,
        categoryId: categoryId || null,
        categoryName: categoryName.trim(),
        categoryType: typeNorm,
        year: targetYear,
        monthIndex: targetMonth,
        description: descVal,
        installment: `${p}/${totalInst}`,
        value: valNum,
        isPaid: Boolean(isPaid && i === 0),
        tag: tagVal,
        ...(isRevenue !== undefined ? { isRevenue } : {})
      });
    }
    return result;
  }

  // Lançamento avulso
  return [{
    id: 'lanc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    groupId: null,
    linkedId: linkedId || null,
    categoryId: categoryId || null,
    categoryName: categoryName.trim(),
    categoryType: typeNorm,
    year: currentYear,
    monthIndex: ((currentMonth % 12) + 12) % 12,
    description: descVal,
    installment: installmentRaw || '-',
    value: valNum,
    isPaid: Boolean(isPaid),
    tag: tagVal,
    ...(isRevenue !== undefined ? { isRevenue } : {})
  }];
}

/**
 * Cria par sincronizado de despesa no Cartão de Crédito e receita no Repasse
 * vinculados pelo mesmo linkedId único para neutralidade financeira no dashboard.
 * 
 * @param {Object} params
 * @returns {{ expenses: Array<Object>, revenues: Array<Object>, all: Array<Object> }}
 */
function createExpenseWithRepasseMirror({
  description = '',
  value = 0,
  installment = '-',
  monthIndex = 0,
  year = new Date().getFullYear(),
  cardCategory = null,
  repasseCategory = null,
  shouldPropagate = false,
  tag = ''
} = {}) {
  const generatedExpense = generateTransactionsMultiYear({
    description,
    value,
    installment,
    monthIndex,
    year,
    categoryId: cardCategory ? cardCategory.id : null,
    categoryName: cardCategory ? cardCategory.name : '',
    categoryType: cardCategory ? cardCategory.type : 'Cartão de Crédito',
    isPaid: false,
    shouldPropagate,
    tag
  });

  if (!repasseCategory) {
    return {
      expenses: generatedExpense,
      revenues: [],
      all: [...generatedExpense]
    };
  }

  const cardName = cardCategory ? cardCategory.name : 'Cartão';
  const repasseDesc = `${description} ( ${cardName} )`;

  const generatedRevenue = generateTransactionsMultiYear({
    description: repasseDesc,
    value,
    installment,
    monthIndex,
    year,
    categoryId: repasseCategory.id,
    categoryName: repasseCategory.name,
    categoryType: repasseCategory.type,
    isPaid: false,
    shouldPropagate,
    isRevenue: true,
    tag
  });

  const totalPairs = Math.min(generatedExpense.length, generatedRevenue.length);
  for (let i = 0; i < totalPairs; i++) {
    const linkToken = 'link_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 7);
    generatedExpense[i].linkedId = linkToken;
    generatedRevenue[i].linkedId = linkToken;
  }

  return {
    expenses: generatedExpense,
    revenues: generatedRevenue,
    all: [...generatedExpense, ...generatedRevenue]
  };
}

/**
 * EXCLUSÃO EM CASCATA COM SUPORTE A GROUPID E TRANSIÇÃO DE ANOS:
 * @param {Array<Object>} transactions Lista de lançamentos
 * @param {string} transactionId ID do lançamento a excluir
 * @param {boolean} shouldDeleteSubsequent Se true (confirmou), exclui também meses seguintes do mesmo groupId
 * @returns {{ transactions: Array<Object>, deletedCount: number, deletedTarget: Object|null }}
 */
function deleteTransactionCascade(transactions = [], transactionId, shouldDeleteSubsequent = false) {
  const target = transactions.find(t => t.id === transactionId);
  if (!target) {
    return { transactions: [...transactions], deletedCount: 0, deletedTarget: null };
  }

  const targetAbsoluteTime = (Number(target.year) * 12) + Number(target.monthIndex);

  if (shouldDeleteSubsequent) {
    const groupItemsToDelete = new Set();
    const linkedIdsToDelete = new Set();

    transactions.forEach(item => {
      const itemAbsoluteTime = (Number(item.year) * 12) + Number(item.monthIndex);
      const isTarget = item.id === target.id;
      const isFutureGroup = Boolean(target.groupId && item.groupId === target.groupId && itemAbsoluteTime >= targetAbsoluteTime);
      const isLegacyInstallment = Boolean(!target.groupId && target.installment && target.installment.includes('/') &&
        item.categoryName.toLowerCase() === target.categoryName.toLowerCase() &&
        item.description.toLowerCase() === target.description.toLowerCase() &&
        itemAbsoluteTime >= targetAbsoluteTime);

      if (isTarget || isFutureGroup || isLegacyInstallment) {
        groupItemsToDelete.add(item.id);
        if (item.linkedId) linkedIdsToDelete.add(item.linkedId);
      }
    });

    const remaining = transactions.filter(item => {
      if (groupItemsToDelete.has(item.id)) return false;
      if (item.linkedId && linkedIdsToDelete.has(item.linkedId)) return false;
      return true;
    });

    return {
      transactions: remaining,
      deletedCount: transactions.length - remaining.length,
      deletedTarget: target
    };
  } else {
    const remaining = transactions.filter(item => {
      if (item.id === target.id) return false;
      if (target.linkedId && item.linkedId === target.linkedId) return false;
      return true;
    });
    return {
      transactions: remaining,
      deletedCount: transactions.length - remaining.length,
      deletedTarget: target
    };
  }
}

/**
 * EDIÇÃO EM CASCATA COM SUPORTE A GROUPID E TRANSIÇÃO DE ANOS:
 * @param {Array<Object>} transactions Lista de lançamentos
 * @param {string} transactionId ID do lançamento a editar
 * @param {Object} newValues Novos valores { description, value, installment, tag }
 * @param {boolean} shouldPropagateToFuture Se true (confirmou), aplica nos meses seguintes do mesmo groupId
 * @returns {{ transactions: Array<Object>, updatedCount: number }}
 */
function updateTransactionCascade(transactions = [], transactionId, { description, value, installment, tag } = {}, shouldPropagateToFuture = false) {
  const target = transactions.find(t => t.id === transactionId);
  if (!target) {
    return { transactions: [...transactions], updatedCount: 0 };
  }

  const isTargetFraction = Boolean(target.installment && target.installment.includes('/'));
  let isFixedOrVariable = false;
  if (!isTargetFraction) {
    if (target.categoryType) {
      const norm = normalizeCategoryType(target.categoryType);
      isFixedOrVariable = (norm === 'Conta Fixa' || norm === 'Variável Prevista' || norm === 'Receita' || norm === 'Repasse');
    } else if (typeof AppState !== 'undefined' && Array.isArray(AppState.categories)) {
      const cat = AppState.categories.find(c => c.name.toLowerCase() === (target.categoryName || '').toLowerCase());
      if (cat) {
        const norm = normalizeCategoryType(cat.type);
        isFixedOrVariable = (norm === 'Conta Fixa' || norm === 'Variável Prevista' || norm === 'Receita' || norm === 'Repasse');
      }
    }
  }

  const targetYear = Number(target.year);
  const targetMonth = Number(target.monthIndex);
  const targetAbsoluteTime = (targetYear * 12) + targetMonth;

  const primaryIdsToUpdate = new Set();
  const linkedUpdatesMap = new Map();

  transactions.forEach(item => {
    let shouldUpdate = false;
    if (item.id === target.id) {
      shouldUpdate = true;
    } else if (shouldPropagateToFuture && target.groupId && item.groupId === target.groupId) {
      const itemYear = Number(item.year);
      const itemMonth = Number(item.monthIndex);

      if (isFixedOrVariable) {
        shouldUpdate = (itemYear === targetYear && itemMonth >= targetMonth && itemMonth <= 11);
      } else {
        const itemAbsoluteTime = (itemYear * 12) + itemMonth;
        shouldUpdate = (itemAbsoluteTime >= targetAbsoluteTime);
      }
    }

    if (shouldUpdate) {
      primaryIdsToUpdate.add(item.id);
      if (item.linkedId) {
        linkedUpdatesMap.set(item.linkedId, {
          sourceId: item.id,
          value: value !== undefined ? Number(value) : item.value,
          tag: tag !== undefined ? tag : item.tag,
          newDescription: description !== undefined ? description : item.description
        });
      }
    }
  });

  let updatedCount = 0;
  const updatedTransactions = transactions.map(item => {
    if (primaryIdsToUpdate.has(item.id)) {
      updatedCount++;
      return {
        ...item,
        description: description !== undefined ? description : item.description,
        value: value !== undefined ? Number(value) : item.value,
        installment: (item.id === target.id && installment !== undefined) ? installment : item.installment,
        tag: tag !== undefined ? tag : item.tag
      };
    }

    if (item.linkedId && linkedUpdatesMap.has(item.linkedId)) {
      const updateData = linkedUpdatesMap.get(item.linkedId);
      if (item.id !== updateData.sourceId) {
        updatedCount++;
        let newDesc = item.description;
        if (description !== undefined) {
          const suffixMatch = item.description.match(/\s*\(\s*[^)]+\s*\)$/);
          if (suffixMatch && updateData.newDescription) {
            newDesc = `${updateData.newDescription}${suffixMatch[0]}`;
          } else {
            newDesc = updateData.newDescription;
          }
        }
        return {
          ...item,
          description: newDesc,
          value: updateData.value,
          tag: updateData.tag
        };
      }
    }

    return item;
  });

  return {
    transactions: updatedTransactions,
    updatedCount
  };
}

/**
 * CÁLCULOS E FILTROS BASEADOS EM ANO E MÊS:
 * Soma totais de receitas, despesas, saldo previsto e totais por categoria
 * cruzando e filtrando estritamente monthIndex E year.
 * 
 * @param {Array<Object>} transactions
 * @param {Array<Object>} categories
 * @param {number} monthIndex
 * @param {number} year
 * @returns {{
 *   totalReceitas: number,
 *   totalDespesas: number,
 *   saldoPrevisto: number,
 *   totalLancamentos: number,
 *   categoryTotals: Map<string, number>
 * }}
 */
function calculateTotalsByMonthAndYear(transactions = [], categories = [], monthIndex = 0, year = new Date().getFullYear()) {
  const targetMonth = Number(monthIndex);
  const targetYear = Number(year);

  let totalReceitas = 0;
  let totalDespesas = 0;
  let totalLancamentos = 0;
  const categoryTotals = new Map();

  const categoryTypeMap = new Map();
  const categoryIdTypeMap = new Map();
  if (Array.isArray(categories)) {
    categories.forEach(c => {
      if (c && c.name) {
        const norm = normalizeCategoryType(c.type);
        categoryTypeMap.set(c.name.trim().toLowerCase(), norm);
        if (c.id) categoryIdTypeMap.set(c.id, norm);
      }
    });
  }

  if (Array.isArray(transactions)) {
    transactions.forEach(t => {
      if (Number(t.monthIndex) === targetMonth && Number(t.year) === targetYear) {
        totalLancamentos++;
        const catNameKey = (t.categoryName || '').trim().toLowerCase();
        const type = t.categoryType 
          ? normalizeCategoryType(t.categoryType) 
          : (t.categoryId ? categoryIdTypeMap.get(t.categoryId) : null) || categoryTypeMap.get(catNameKey) || 'Conta Fixa';
        const val = Number(t.value) || 0;

        const prevCatTotal = categoryTotals.get(catNameKey) || 0;
        categoryTotals.set(catNameKey, Math.round((prevCatTotal + val) * 100) / 100);

        const isItemRevenue = Boolean(t.isRevenue === true || type === 'Receita' || type === 'Repasse');
        if (isItemRevenue) {
          totalReceitas += val;
        } else {
          totalDespesas += val;
        }
      }
    });
  }

  totalReceitas = Math.round(totalReceitas * 100) / 100;
  totalDespesas = Math.round(totalDespesas * 100) / 100;
  const saldoPrevisto = Math.round((totalReceitas - totalDespesas) * 100) / 100;

  return {
    totalReceitas,
    totalDespesas,
    saldoPrevisto,
    totalLancamentos,
    categoryTotals
  };
}

// --- MÓDULO: js/cloud.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - SINCRONIZAÇÃO NA NUVEM (JSONBIN.IO REST API)
 * Inclui auto-save debounced e travas de segurança contra sobrescrita
 * =============================================================================
 */


function loadCloudCredentials() {
  const apiKey = (localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  if (DOM.jsonbinApiKey && !DOM.jsonbinApiKey.value) {
    DOM.jsonbinApiKey.value = apiKey;
  }
  if (DOM.jsonbinBinId && !DOM.jsonbinBinId.value) {
    DOM.jsonbinBinId.value = binId;
  }

  if (apiKey && binId) {
    setCloudStatus('synced', '☁️ Nuvem Atualizada');
  } else {
    setCloudStatus('disconnected', '☁️ Nuvem Atualizada');
  }

  updateLastUpdatedUI();
}

function saveCloudCredentials() {
  const apiKey = (DOM.jsonbinApiKey ? DOM.jsonbinApiKey.value : '').trim();
  const binId = (DOM.jsonbinBinId ? DOM.jsonbinBinId.value : '').trim();

  localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, apiKey);
  localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, binId);

  if (apiKey && binId) {
    setCloudStatus('synced', '☁️ Nuvem Atualizada');
    triggerCloudSync();
  } else {
    setCloudStatus('disconnected', '☁️ Nuvem Atualizada');
  }

  updateLastUpdatedUI();
  showToast('Credenciais da nuvem guardadas com sucesso!', 'success');
}

async function syncToCloud() {
  let apiKey = (DOM.jsonbinApiKey ? DOM.jsonbinApiKey.value : '').trim();
  let binId = (DOM.jsonbinBinId ? DOM.jsonbinBinId.value : '').trim();

  if (!apiKey) {
    apiKey = localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '';
    if (DOM.jsonbinApiKey && apiKey) DOM.jsonbinApiKey.value = apiKey;
  }
  if (!binId) {
    binId = localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '';
    if (DOM.jsonbinBinId && binId) DOM.jsonbinBinId.value = binId;
  }

  if (!apiKey) {
    showToast('Erro: É necessário introduzir a sua API Key (X-Master-Key) para enviar para a nuvem.', 'error');
    DOM.jsonbinApiKey?.focus();
    return;
  }

  if (DOM.btnSyncToCloud) {
    DOM.btnSyncToCloud.disabled = true;
    DOM.btnSyncToCloud.style.opacity = '0.7';
  }
  setCloudStatus('syncing', '🔄 A sincronizar...');

  try {
    if (binId) {
      try {
        const checkRes = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}/latest`, {
          method: 'GET',
          headers: {
            'X-Master-Key': apiKey
          }
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          const cloudRecord = checkData?.record || checkData;
          const cloudLastUpdated = Number(cloudRecord?.lastUpdated) || 0;
          const localLastUpdated = Number(AppState.lastUpdated) || 0;

          if (cloudLastUpdated > localLastUpdated) {
            const forceUpload = window.confirm(
              'Atenção: Os dados na nuvem são mais recentes que os seus dados locais. Se continuar, você vai sobrescrever dados mais novos. Deseja forçar o upload?'
            );
            if (!forceUpload) {
              setCloudStatus('synced', '☁️ Nuvem Atualizada');
              return;
            }
          }
        }
      } catch (checkErr) {
        console.warn('Não foi possível verificar a versão da nuvem previamente:', checkErr);
      }
    }

    const uploadTs = Date.now();
    const payload = {
      lastUpdated: uploadTs,
      categorias: AppState.categories,
      lancamentos: AppState.transactions,
      tags: AppState.tags || []
    };

    if (!binId) {
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey,
          'X-Bin-Name': 'FinancasPro_Backup'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status} ao criar Bin no JSONBin.io`);
      }

      const data = await response.json();
      const newBinId = data?.metadata?.id;

      if (!newBinId) {
        throw new Error('A resposta do JSONBin.io não contém o ID do Bin criado.');
      }

      if (DOM.jsonbinBinId) DOM.jsonbinBinId.value = newBinId;
      localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, apiKey);
      localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, newBinId);

      touchLastUpdated(uploadTs);
      setCloudStatus('synced', '☁️ Nuvem Atualizada');
      showToast(`Backup enviado para a nuvem! Novo Bin ID: ${newBinId}`, 'success');
    } else {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status} ao atualizar Bin no JSONBin.io`);
      }

      localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, apiKey);
      localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, binId);

      touchLastUpdated(uploadTs);
      setCloudStatus('synced', '☁️ Nuvem Atualizada');
      showToast(`Backup atualizado na nuvem com sucesso! (Bin: ${binId})`, 'success');
    }
  } catch (err) {
    console.error('Falha ao enviar backup para o JSONBin:', err);
    setCloudStatus('error', '⚠️ Erro na Nuvem');
    showToast(`Falha ao enviar backup para a nuvem: ${err.message || err}`, 'error');
  } finally {
    if (DOM.btnSyncToCloud) {
      DOM.btnSyncToCloud.disabled = false;
      DOM.btnSyncToCloud.style.opacity = '';
    }
  }
}

async function syncFromCloud() {
  let apiKey = (DOM.jsonbinApiKey ? DOM.jsonbinApiKey.value : '').trim();
  let binId = (DOM.jsonbinBinId ? DOM.jsonbinBinId.value : '').trim();

  if (!apiKey) {
    apiKey = localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '';
    if (DOM.jsonbinApiKey && apiKey) DOM.jsonbinApiKey.value = apiKey;
  }
  if (!binId) {
    binId = localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '';
    if (DOM.jsonbinBinId && binId) DOM.jsonbinBinId.value = binId;
  }

  if (!apiKey) {
    showToast('Erro: É necessário introduzir a sua API Key (X-Master-Key) para restaurar da nuvem.', 'error');
    DOM.jsonbinApiKey?.focus();
    return;
  }

  if (!binId) {
    showToast('Erro: É necessário indicar o Bin ID para restaurar os dados da nuvem.', 'error');
    DOM.jsonbinBinId?.focus();
    return;
  }

  if (DOM.btnSyncFromCloud) {
    DOM.btnSyncFromCloud.disabled = true;
    DOM.btnSyncFromCloud.style.opacity = '0.7';
  }
  setCloudStatus('syncing', '🔄 A sincronizar...');

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: Bin ID ou API Key inválidos.`);
    }

    const data = await response.json();
    const record = data?.record || data;

    const incomingCats = record.categorias || record.categories || [];
    const incomingTrans = record.lancamentos || record.transactions || [];
    const incomingTags = record.tags || record.finance_tags || [];

    if (!Array.isArray(incomingCats)) {
      throw new Error('A estrutura dos dados na nuvem é inválida (categorias ausentes ou formato incorreto).');
    }

    const cloudLastUpdated = Number(record.lastUpdated) || 0;
    const localLastUpdated = Number(AppState.lastUpdated) || 0;

    if (localLastUpdated > cloudLastUpdated) {
      const forceDownload = window.confirm(
        'Atenção: Você tem alterações locais que ainda não foram enviadas para a nuvem. Baixar os dados agora vai apagar o seu trabalho não salvo. Deseja forçar o download?'
      );
      if (!forceDownload) {
        setCloudStatus('synced', '☁️ Nuvem Atualizada');
        return;
      }
    }

    AppState.categories = incomingCats.map((c, i) => normalizeCategory(c, i));
    AppState.transactions = incomingTrans.map((t, i) => normalizeTransaction(t, i));
    if (Array.isArray(incomingTags)) {
      AppState.tags = incomingTags.map(t => String(t).trim()).filter(Boolean);
      saveTags(AppState.tags, true);
      if (typeof window !== 'undefined' && typeof window.Financas?.renderTagSelectOptions === 'function') {
        window.Financas.renderTagSelectOptions();
      }
      if (typeof window !== 'undefined' && typeof window.Financas?.renderManageTagsList === 'function') {
        window.Financas.renderManageTagsList();
      }
    }

    saveCategories(AppState.categories, true);
    saveTransactions(AppState.transactions, true);

    touchLastUpdated(cloudLastUpdated || Date.now());

    refreshUI();

    setCloudStatus('synced', '☁️ Nuvem Atualizada');
    showToast(
      `Dados restaurados da nuvem! ${AppState.categories.length} categorias e ${AppState.transactions.length} lançamentos recuperados.`,
      'success'
    );
  } catch (err) {
    console.error('Falha ao restaurar dados do JSONBin:', err);
    setCloudStatus('error', '⚠️ Erro na Nuvem');
    showToast(`Falha ao restaurar dados da nuvem: ${err.message || err}`, 'error');
  } finally {
    if (DOM.btnSyncFromCloud) {
      DOM.btnSyncFromCloud.disabled = false;
      DOM.btnSyncFromCloud.style.opacity = '';
    }
  }
}

/**
 * Re-renderiza todos os componentes visuais dependentes dos dados do AppState
 */
function refreshUI() {
  if (typeof window !== 'undefined' && window.Financas) {
    if (typeof window.Financas.renderTagSelectOptions === 'function') {
      window.Financas.renderTagSelectOptions();
    }
    if (typeof window.Financas.renderManageTagsList === 'function') {
      window.Financas.renderManageTagsList();
    }
    if (typeof window.Financas.rebuildSidebar === 'function') {
      window.Financas.rebuildSidebar();
    }
    if (typeof window.Financas.renderCategoryTable === 'function') {
      window.Financas.renderCategoryTable();
    }
    if (typeof window.Financas.renderDashboard === 'function') {
      window.Financas.renderDashboard();
    }
    if (AppState.currentRoute === 'category' && typeof window.Financas.renderTransactionsTable === 'function') {
      window.Financas.renderTransactionsTable();
      if (typeof window.Financas.updateMonthTotal === 'function') {
        window.Financas.updateMonthTotal();
      }
    }
  }
}

/**
 * Comparador de Estado / Fingerprint (inspirado em areMovieListsEqual do Multiverso)
 * Detecta se categorias, lançamentos e tags locais e remotos são idênticos em conteúdo.
 */
function areStatesEqual(localState, remoteRecord) {
  if (!remoteRecord || typeof remoteRecord !== 'object') return false;

  const remoteCats = Array.isArray(remoteRecord.categorias)
    ? remoteRecord.categorias
    : (Array.isArray(remoteRecord.categories) ? remoteRecord.categories : []);
  const remoteTrans = Array.isArray(remoteRecord.lancamentos)
    ? remoteRecord.lancamentos
    : (Array.isArray(remoteRecord.transactions) ? remoteRecord.transactions : []);
  const remoteTags = Array.isArray(remoteRecord.tags)
    ? remoteRecord.tags
    : (Array.isArray(remoteRecord.finance_tags) ? remoteRecord.finance_tags : []);

  const localCats = Array.isArray(localState.categories) ? localState.categories : [];
  const localTrans = Array.isArray(localState.transactions) ? localState.transactions : [];
  const localTags = Array.isArray(localState.tags) ? localState.tags : [];

  if (localCats.length !== remoteCats.length ||
      localTrans.length !== remoteTrans.length ||
      localTags.length !== remoteTags.length) {
    return false;
  }

  // Fingerprint das categorias
  const catFingerprint = (list) => list.map(c => 
    `${String(c.id || '')}|${String(c.name || '').trim().toLowerCase()}|${String(c.type || '').trim().toLowerCase()}`
  ).sort().join(';;');
  if (catFingerprint(localCats) !== catFingerprint(remoteCats)) return false;

  // Fingerprint das tags
  const tagFingerprint = (list) => list.map(t => String(t || '').trim().toLowerCase()).sort().join(';;');
  if (tagFingerprint(localTags) !== tagFingerprint(remoteTags)) return false;

  // Fingerprint dos lançamentos
  const transFingerprint = (list) => list.map(t => 
    `${String(t.id || '')}|${Number(t.value || 0)}|${Number(t.monthIndex || 0)}|${Number(t.year || 0)}|${String(t.description || '').trim()}|${String(t.installment || '').trim()}|${Boolean(t.isPaid)}|${String(t.tag || '').trim()}|${String(t.groupId || '')}|${String(t.linkedId || '')}`
  ).sort().join(';;');

  return transFingerprint(localTrans) === transFingerprint(remoteTrans);
}

let isCheckingStartupCloud = false;

function resetStartupSyncLock() {
  isCheckingStartupCloud = false;
}

/**
 * Verificação e Sincronização Inteligente de Inicialização
 * Executada sempre ao abrir o SPA e ao retornar o foco à aba.
 */
async function checkAndSyncCloudOnStartup({ silent = true, showNotification = true, force = false } = {}) {
  const apiKey = (localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  if (!apiKey || !binId) {
    setCloudStatus('disconnected', '☁️ Nuvem Atualizada');
    return { status: 'disconnected' };
  }

  if (force) {
    isCheckingStartupCloud = false;
  }

  if (isCheckingStartupCloud) {
    return { status: 'busy' };
  }
  isCheckingStartupCloud = true;

  setCloudStatus('syncing', '🔄 Verificando nuvem...');

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey
      }
    });

    if (!response.ok) {
      console.warn(`[Cloud Startup Check] Status retornado: ${response.status}`);
      setCloudStatus('error', '⚠️ Erro ao verificar nuvem');
      return { status: 'error', code: response.status };
    }

    const data = await response.json();
    const record = data?.record || data;

    const incomingCats = record.categorias || record.categories || [];
    const incomingTrans = record.lancamentos || record.transactions || [];
    const incomingTags = record.tags || record.finance_tags || [];

    if (!Array.isArray(incomingCats)) {
      setCloudStatus('error', '⚠️ Formato de nuvem inválido');
      return { status: 'invalid_format' };
    }

    const cloudLastUpdated = Number(record.lastUpdated) || 0;
    const localLastUpdated = Number(AppState.lastUpdated) || 0;

    const areEqual = areStatesEqual(AppState, record);

    // 1. Conteúdo 100% igual: alinha timestamp se necessário e finaliza
    if (areEqual) {
      if (cloudLastUpdated > localLastUpdated) {
        touchLastUpdated(cloudLastUpdated);
      }
      setCloudStatus('synced', '☁️ Nuvem Atualizada');
      return { status: 'up_to_date' };
    }

    const localIsEmpty = AppState.categories.length === 0 && AppState.transactions.length === 0;
    const remoteHasData = incomingCats.length > 0 || incomingTrans.length > 0;

    // 2. Nuvem é mais recente OU local está vazio com nuvem preenchida
    if (cloudLastUpdated > localLastUpdated || (localIsEmpty && remoteHasData)) {
      console.log('[Cloud Startup Check] Versão mais recente encontrada na nuvem. Sincronizando...');

      AppState.categories = incomingCats.map((c, i) => normalizeCategory(c, i));
      AppState.transactions = incomingTrans.map((t, i) => normalizeTransaction(t, i));
      if (Array.isArray(incomingTags)) {
        AppState.tags = incomingTags.map(t => String(t).trim()).filter(Boolean);
        saveTags(AppState.tags, true);
      }

      saveCategories(AppState.categories, true);
      saveTransactions(AppState.transactions, true);

      touchLastUpdated(cloudLastUpdated || Date.now());

      refreshUI();

      setCloudStatus('synced', '☁️ Nuvem Atualizada');

      if (showNotification) {
        showToast('☁️ Nuvem: dados atualizados com sua versão mais recente!', 'success');
      }

      return { status: 'updated_from_cloud', cloudLastUpdated };
    }

    // 3. Local é mais recente que a nuvem (alterações locais pendentes)
    if (localLastUpdated > cloudLastUpdated) {
      console.log('[Cloud Startup Check] Local mais recente que a nuvem. Disparando envio...');
      setCloudStatus('syncing', '🔄 A sincronizar...');
      triggerCloudSync();
      return { status: 'sync_to_cloud_triggered' };
    }

    // 4. Timestamps iguais mas dados diferentes: adota versão da nuvem por segurança
    AppState.categories = incomingCats.map((c, i) => normalizeCategory(c, i));
    AppState.transactions = incomingTrans.map((t, i) => normalizeTransaction(t, i));
    if (Array.isArray(incomingTags)) {
      AppState.tags = incomingTags.map(t => String(t).trim()).filter(Boolean);
      saveTags(AppState.tags, true);
    }
    saveCategories(AppState.categories, true);
    saveTransactions(AppState.transactions, true);
    touchLastUpdated(cloudLastUpdated || Date.now());
    refreshUI();
    setCloudStatus('synced', '☁️ Nuvem Atualizada');
    return { status: 'aligned_with_cloud' };

  } catch (err) {
    console.warn('[Cloud Startup Check] Modo offline ou erro de rede:', err);
    setCloudStatus('synced', '☁️ Nuvem Atualizada');
    return { status: 'offline', error: err };
  } finally {
    isCheckingStartupCloud = false;
  }
}

let lastFocusCheckTs = 0;

/**
 * Escuta eventos de visibilidade da página e foco para verificar atualizações
 * quando o usuário retorna à aba (com throttle de 30 segundos).
 */
function setupCloudFocusListener() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const handleFocusCheck = () => {
    if (document.visibilityState === 'visible') {
      const now = Date.now();
      if (now - lastFocusCheckTs >= 30000) {
        lastFocusCheckTs = now;
        checkAndSyncCloudOnStartup({ silent: true, showNotification: true });
      }
    }
  };

  window.addEventListener('focus', handleFocusCheck);
  document.addEventListener('visibilitychange', handleFocusCheck);
}

async function executeAutoCloudSync() {
  const apiKey = (localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  if (!apiKey || !binId) {
    return;
  }

  try {
    const checkRes = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey
      }
    });

    if (checkRes.ok) {
      const checkData = await checkRes.json();
      const cloudRecord = checkData?.record || checkData;
      const cloudLastUpdated = Number(cloudRecord?.lastUpdated) || 0;
      const localLastUpdated = Number(AppState.lastUpdated) || 0;

      if (cloudLastUpdated > localLastUpdated) {
        console.warn('[AutoSync Abortado] Nuvem possui dados mais recentes que a sessão local. Auto-save abortado para evitar perda de dados.');
        setCloudStatus('error', '⚠️ Conflito: Nuvem mais recente');
        return;
      }
    }

    setCloudStatus('syncing', '🔄 A sincronizar...');

    const uploadTs = Date.now();
    const payload = {
      lastUpdated: uploadTs,
      categorias: AppState.categories,
      lancamentos: AppState.transactions,
      tags: AppState.tags || []
    };

    const response = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status} na API`);
    }

    touchLastUpdated(uploadTs);
    setCloudStatus('synced', '☁️ Nuvem Atualizada');
    console.log('[AutoSync] Dados sincronizados na nuvem com sucesso.');
  } catch (err) {
    console.error('[AutoSync] Falha na sincronização em segundo plano:', err);
    setCloudStatus('error', '⚠️ Erro na Nuvem');
  }
}

const debouncedAutoCloudSync = debounce(executeAutoCloudSync, 3000);

function triggerCloudSync() {
  const apiKey = (localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  if (!apiKey || !binId) {
    return;
  }

  setCloudStatus('syncing', '🔄 A sincronizar...');
  debouncedAutoCloudSync();
}

// Vincula o triggerCloudSync como hook padrão para persistência no storage
setCloudSyncHook(triggerCloudSync);

// --- MÓDULO: js/router.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - ROTEADOR SPA (SINGLE PAGE APPLICATION)
 * =============================================================================
 */


function closeMobileSidebar() {
  if (DOM.sidebar) {
    DOM.sidebar.classList.remove('sidebar-open');
    DOM.sidebar.classList.remove('open');
  }
  if (DOM.sidebarOverlay) {
    DOM.sidebarOverlay.classList.remove('active');
  }
}

function resetAllForms() {
  if (typeof window !== 'undefined' && typeof window.Financas?.cancelEditingTransaction === 'function') {
    window.Financas.cancelEditingTransaction();
  }

  if (DOM.categoryForm) DOM.categoryForm.reset();
  if (DOM.transactionForm) DOM.transactionForm.reset();

  if (DOM.nameError) DOM.nameError.textContent = '';
  if (DOM.typeError) DOM.typeError.textContent = '';
  if (DOM.categoryNameInput) DOM.categoryNameInput.style.borderColor = '';
  if (DOM.categoryTypeSelect) DOM.categoryTypeSelect.style.borderColor = '';

  if (DOM.transDescError) DOM.transDescError.textContent = '';
  if (DOM.transInstallmentError) DOM.transInstallmentError.textContent = '';
  if (DOM.transValueError) DOM.transValueError.textContent = '';
  if (DOM.transDescriptionInput) DOM.transDescriptionInput.style.borderColor = '';
  if (DOM.transInstallmentInput) DOM.transInstallmentInput.style.borderColor = '';
  if (DOM.transValueInput) DOM.transValueInput.style.borderColor = '';
}

function navigateTo(route, categoryId = null) {
  closeMobileSidebar();
  resetAllForms();
  AppState.currentRoute = route;
  AppState.activeCategoryId = categoryId;

  DOM.fixedNavLinks.forEach(link => {
    if (link.getAttribute('data-route') === route) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  document.querySelectorAll('.category-item-link').forEach(link => {
    if (route === 'category' && link.getAttribute('data-category-id') === categoryId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  if (DOM.viewDashboard) DOM.viewDashboard.classList.remove('active');
  if (DOM.viewConfiguracoes) DOM.viewConfiguracoes.classList.remove('active');
  if (DOM.viewCategoryDetail) DOM.viewCategoryDetail.classList.remove('active');

  if (route === 'dashboard') {
    if (DOM.headerTitle) DOM.headerTitle.textContent = 'Dashboard';
    if (DOM.viewDashboard) DOM.viewDashboard.classList.add('active');
    if (typeof window !== 'undefined' && typeof window.Financas?.renderDashboard === 'function') {
      window.Financas.renderDashboard();
    }
  } else if (route === 'configuracoes') {
    if (DOM.headerTitle) DOM.headerTitle.textContent = 'Configurações';
    if (DOM.viewConfiguracoes) DOM.viewConfiguracoes.classList.add('active');
    if (typeof window !== 'undefined' && typeof window.Financas?.renderCategoryTable === 'function') {
      window.Financas.renderCategoryTable();
    }
    if (typeof window !== 'undefined' && typeof window.Financas?.loadCloudCredentials === 'function') {
      window.Financas.loadCloudCredentials();
    }
  } else if (route === 'category' && categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (category) {
      if (DOM.headerTitle) DOM.headerTitle.textContent = category.name;
      if (DOM.viewCategoryDetail) DOM.viewCategoryDetail.classList.add('active');
      if (typeof window !== 'undefined' && typeof window.Financas?.setupCategoryDetailView === 'function') {
        window.Financas.setupCategoryDetailView(category);
      }
    } else {
      navigateTo('configuracoes');
    }
  }

  if (window.innerWidth <= 768 && DOM.sidebar) {
    DOM.sidebar.classList.remove('open');
  }
}

// --- MÓDULO: js/sidebar.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - SIDEBAR DINÂMICA
 * =============================================================================
 */


function rebuildSidebar() {
  if (!DOM.dynamicCategorySections) return;
  DOM.dynamicCategorySections.innerHTML = '';
  const matchedCategoryIds = new Set();

  CATEGORY_TYPES.forEach(typeObj => {
    const categoriesOfType = AppState.categories.filter(c => {
      const match = normalizeCategoryType(c.type) === typeObj.id;
      if (match) matchedCategoryIds.add(c.id);
      return match;
    });

    const groupContainer = document.createElement('div');
    groupContainer.className = 'nav-section';

    const groupHeader = document.createElement('div');
    groupHeader.className = 'type-group-header';
    groupHeader.innerHTML = `
      <span>${escapeHTML(typeObj.label)}</span>
      <span class="type-badge-count">${categoriesOfType.length}</span>
    `;
    groupContainer.appendChild(groupHeader);

    if (categoriesOfType.length === 0) {
      const emptyHint = document.createElement('div');
      emptyHint.className = 'type-empty-hint';
      emptyHint.textContent = 'Nenhuma cadastrada';
      groupContainer.appendChild(emptyHint);
    } else {
      const list = document.createElement('ul');
      list.className = 'nav-list';

      categoriesOfType.forEach(cat => {
        const li = document.createElement('li');
        const isActive = (AppState.currentRoute === 'category' && AppState.activeCategoryId === cat.id);

        li.innerHTML = `
          <button class="category-item-link ${isActive ? 'active' : ''}" data-category-id="${escapeHTML(cat.id)}" title="${escapeHTML(cat.name)}">
            <span class="category-bullet"></span>
            <span>${escapeHTML(cat.name)}</span>
          </button>
        `;

        li.querySelector('button').addEventListener('click', () => {
          navigateTo('category', cat.id);
        });

        list.appendChild(li);
      });

      groupContainer.appendChild(list);
    }

    DOM.dynamicCategorySections.appendChild(groupContainer);
  });

  const remainingCategories = AppState.categories.filter(c => !matchedCategoryIds.has(c.id));
  if (remainingCategories.length > 0) {
    const extraGroup = document.createElement('div');
    extraGroup.className = 'nav-section';

    const extraHeader = document.createElement('div');
    extraHeader.className = 'type-group-header';
    extraHeader.innerHTML = `
      <span>Outras Categorias</span>
      <span class="type-badge-count">${remainingCategories.length}</span>
    `;
    extraGroup.appendChild(extraHeader);

    const extraList = document.createElement('ul');
    extraList.className = 'nav-list';

    remainingCategories.forEach(cat => {
      const li = document.createElement('li');
      const isActive = (AppState.currentRoute === 'category' && AppState.activeCategoryId === cat.id);

      li.innerHTML = `
        <button class="category-item-link ${isActive ? 'active' : ''}" data-category-id="${escapeHTML(cat.id)}" title="${escapeHTML(cat.name)}">
          <span class="category-bullet"></span>
          <span>${escapeHTML(cat.name)}</span>
        </button>
      `;

      li.querySelector('button').addEventListener('click', () => {
        navigateTo('category', cat.id);
      });

      extraList.appendChild(li);
    });

    extraGroup.appendChild(extraList);
    DOM.dynamicCategorySections.appendChild(extraGroup);
  }
}

// --- MÓDULO: js/dashboard.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - DASHBOARD CONSOLIDADO & DRAWER DE FILTROS
 * =============================================================================
 */


function renderDashboard() {
  const currentMonth = Number(AppState.selectedMonthIndex);
  const currentYear = Number(AppState.selectedYear);
  const monthName = MONTH_NAMES[currentMonth];
  
  if (DOM.dashMonthLabel) {
    DOM.dashMonthLabel.textContent = `Mês de referência: ${monthName} de ${currentYear} • ${AppState.categories.length} categorias cadastradas`;
  }

  // Sincroniza abas de meses no Dashboard
  if (DOM.dashMonthTabsBar) {
    DOM.dashMonthTabsBar.querySelectorAll('.month-tab').forEach(tab => {
      const tabMonth = parseInt(tab.getAttribute('data-month'), 10);
      if (tabMonth === currentMonth) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // 1. Métricas do Topo
  const summary = calculateTotalsByMonthAndYear(AppState.transactions, AppState.categories, currentMonth, currentYear);

  if (DOM.dashboardMetrics) {
    DOM.dashboardMetrics.innerHTML = `
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Total de Receitas</span>
          <span class="badge badge-receita">${monthName}/${currentYear}</span>
        </div>
        <div class="metric-card-val" style="color: var(--success);">${formatCurrency(summary.totalReceitas)}</div>
        <div class="metric-card-sub">Entradas no período</div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Total de Despesas</span>
          <span class="badge badge-fixa">${monthName}/${currentYear}</span>
        </div>
        <div class="metric-card-val" style="color: var(--danger);">${formatCurrency(summary.totalDespesas)}</div>
        <div class="metric-card-sub">Contas, cartões e variáveis</div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Saldo Previsto</span>
          <span class="badge ${summary.saldoPrevisto >= 0 ? 'badge-receita' : 'badge-fixa'}">${monthName}/${currentYear}</span>
        </div>
        <div class="metric-card-val" style="color: ${summary.saldoPrevisto >= 0 ? 'var(--success)' : 'var(--danger)'};">
          ${formatCurrency(summary.saldoPrevisto)}
        </div>
        <div class="metric-card-sub">Receitas - Despesas</div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Lançamentos</span>
          <span class="badge badge-variavel">${monthName}/${currentYear}</span>
        </div>
        <div class="metric-card-val">${summary.totalLancamentos}</div>
        <div class="metric-card-sub">Itens no mês e ano selecionados</div>
      </div>
    `;
  }

  if (DOM.dashCategoryCount) {
    DOM.dashCategoryCount.textContent = `${AppState.categories.length} ${AppState.categories.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}`;
  }

  // 2. Renderiza as Tabelas no formato Planilha
  renderDashboardTables(currentMonth, currentYear);
}

/**
 * Renderiza o layout de planilha financeira: tabelas empilhadas verticalmente por Tipo
 */
function renderDashboardTables(currentMonth, currentYear) {
  if (!DOM.dashboardTablesContainer) return;
  DOM.dashboardTablesContainer.innerHTML = '';

  if (AppState.categories.length === 0) {
    DOM.dashboardTablesContainer.innerHTML = `
      <div class="empty-state" style="padding: 40px 20px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M3 9h18M9 21V9"/>
        </svg>
        <p class="empty-title">Nenhuma categoria cadastrada ainda</p>
        <p class="empty-desc">Cadastre suas categorias em Configurações para visualizar a planilha consolidada.</p>
      </div>
    `;
    return;
  }

  const processedCategoryIds = new Set();

  CATEGORY_TYPES.forEach(typeObj => {
    const categoriesOfType = AppState.categories.filter(c => {
      const match = normalizeCategoryType(c.type) === typeObj.id;
      if (match) processedCategoryIds.add(c.id);
      return match;
    });

    if (categoriesOfType.length === 0) return;

    renderSpreadsheetBlock(typeObj.id, typeObj.label, categoriesOfType, Boolean(typeObj.isRevenue), currentMonth, currentYear);
  });

  const remainingCategories = AppState.categories.filter(c => !processedCategoryIds.has(c.id));
  if (remainingCategories.length > 0) {
    renderSpreadsheetBlock('Outras Despesas', 'Outras Despesas', remainingCategories, false, currentMonth, currentYear);
  }

  applyTypeFilters();
}

/**
 * Constrói uma tabela individual de bloco de planilha para um determinado Tipo de Categoria
 */
function renderSpreadsheetBlock(typeId, groupTitle, categories, isRevenue, currentMonth, currentYear) {
  let blockTotal = 0;

  const card = document.createElement('div');
  card.className = 'sheet-table-card';
  card.setAttribute('data-type-id', typeId || groupTitle);
  card.setAttribute('data-type-label', groupTitle);

  const table = document.createElement('table');
  table.className = 'sheet-table';

  table.innerHTML = `
    <thead>
      <tr class="sheet-group-header-row">
        <th colspan="3">
          <div class="sheet-group-title-content">
            <span class="sheet-group-name">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="18" x="3" y="3" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
              ${escapeHTML(groupTitle)}
            </span>
            <span class="sheet-group-badge">${categories.length} ${categories.length === 1 ? 'item' : 'itens'}</span>
          </div>
        </th>
      </tr>
      <tr class="sheet-cols-header-row">
        <th style="width: 70px; text-align: center;">Situação</th>
        <th>Nome da Categoria</th>
        <th style="text-align: right; width: 180px;">Valor Total</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');

  categories.forEach(cat => {
    const catTransactions = AppState.transactions.filter(t => {
      const matchCat = t.categoryId ? (t.categoryId === cat.id) : (t.categoryName.trim().toLowerCase() === cat.name.trim().toLowerCase());
      return matchCat && Number(t.monthIndex) === currentMonth && Number(t.year) === currentYear;
    });

    const catTotal = catTransactions.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    blockTotal += catTotal;

    const hasTransactions = catTransactions.length > 0;
    const allPaid = hasTransactions && catTransactions.every(t => t.isPaid === true);

    const tr = document.createElement('tr');
    tr.setAttribute('data-category-name', cat.name.toLowerCase());

    tr.innerHTML = `
      <td style="text-align: center;">
        <input 
          type="checkbox" 
          class="sheet-cat-checkbox" 
          data-category-id="${escapeHTML(cat.id)}"
          ${allPaid ? 'checked' : ''}
          ${!hasTransactions ? 'disabled title="Sem lançamentos neste mês"' : 'title="Marcar lançamentos deste mês como pagos/pendentes"'}
        />
      </td>
      <td class="destaque-nome">
        <button type="button" class="sheet-cat-btn destaque-nome" data-category-id="${escapeHTML(cat.id)}" title="Acessar lançamentos de ${escapeHTML(cat.name)}">
          <span class="destaque-nome">${escapeHTML(cat.name)}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.5;">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </td>
      <td style="text-align: right;" class="sheet-val-cell destaque-valor">
        <strong class="destaque-valor">${formatCurrency(catTotal)}</strong>
      </td>
    `;

    tr.querySelector('.sheet-cat-btn').addEventListener('click', () => {
      navigateTo('category', cat.id);
    });

    const chk = tr.querySelector('.sheet-cat-checkbox');
    if (hasTransactions) {
      chk.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        catTransactions.forEach(t => {
          t.isPaid = isChecked;
        });
        saveTransactions(AppState.transactions);
        triggerCloudSync();
        showToast(`${cat.name}: status atualizado para ${isChecked ? 'pago' : 'pendente'}.`);
      });
    }

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  const tfoot = document.createElement('tfoot');
  const subtotalClass = isRevenue ? 'subtotal-val-receita' : 'subtotal-val-despesa';

  tfoot.innerHTML = `
    <tr class="sheet-subtotal-row">
      <td colspan="2" style="font-weight: 600; color: var(--text-secondary);">
        Subtotal ${escapeHTML(groupTitle)}
      </td>
      <td style="text-align: right;" class="destaque-valor ${subtotalClass}">
        ${formatCurrency(blockTotal)}
      </td>
    </tr>
  `;

  table.appendChild(tfoot);

  const tableResponsive = document.createElement('div');
  tableResponsive.className = 'table-responsive';
  tableResponsive.appendChild(table);

  card.appendChild(tableResponsive);
  DOM.dashboardTablesContainer.appendChild(card);
}

/**
 * Renderiza dinamicamente a lista de checkboxes de tipos no Drawer
 */
function renderDrawerTypeFilters() {
  if (!DOM.drawerTiposList) return;
  DOM.drawerTiposList.innerHTML = '';

  const registeredTypes = new Map();

  CATEGORY_TYPES.forEach(t => {
    const count = AppState.categories.filter(c => normalizeCategoryType(c.type) === t.id).length;
    registeredTypes.set(t.id, { id: t.id, label: t.label, count });
  });

  const customCats = AppState.categories.filter(c => !CATEGORY_TYPES.some(t => normalizeCategoryType(c.type) === t.id));
  if (customCats.length > 0) {
    registeredTypes.set('Outras Despesas', { id: 'Outras Despesas', label: 'Outras Despesas', count: customCats.length });
  }

  registeredTypes.forEach(typeInfo => {
    const isChecked = AppState.selectedTypeFilters.has(typeInfo.id);

    const labelItem = document.createElement('label');
    labelItem.className = 'drawer-checkbox-item';
    labelItem.innerHTML = `
      <div class="drawer-checkbox-label">
        <input 
          type="checkbox" 
          class="drawer-checkbox" 
          value="${escapeHTML(typeInfo.id)}"
          ${isChecked ? 'checked' : ''}
        />
        <span>${escapeHTML(typeInfo.label)}</span>
      </div>
      <span class="type-badge-count">${typeInfo.count}</span>
    `;

    const checkbox = labelItem.querySelector('.drawer-checkbox');
    checkbox.addEventListener('change', (e) => {
      const val = e.target.value;
      if (e.target.checked) {
        AppState.selectedTypeFilters.add(val);
      } else {
        AppState.selectedTypeFilters.delete(val);
      }
      applyTypeFilters();
    });

    DOM.drawerTiposList.appendChild(labelItem);
  });
}

/**
 * Aplica a filtragem por Tipo de Categoria nas tabelas do Dashboard
 */
function applyTypeFilters() {
  const selectedTypes = AppState.selectedTypeFilters;
  const tableCards = document.querySelectorAll('#dashboardTablesContainer .sheet-table-card');

  if (DOM.btnAbrirFiltros) {
    if (selectedTypes.size > 0) {
      DOM.btnAbrirFiltros.classList.add('has-active-filter');
      DOM.btnAbrirFiltros.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        <span>Filtros (${selectedTypes.size})</span>
      `;
    } else {
      DOM.btnAbrirFiltros.classList.remove('has-active-filter');
      DOM.btnAbrirFiltros.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        <span>Filtros</span>
      `;
    }
  }

  tableCards.forEach(card => {
    const cardTypeId = card.getAttribute('data-type-id');
    const cardTypeLabel = card.getAttribute('data-type-label');

    if (selectedTypes.size === 0) {
      card.style.display = '';
    } else {
      const isMatch = selectedTypes.has(cardTypeId) || selectedTypes.has(cardTypeLabel);
      if (isMatch) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    }
  });
}

/**
 * Limpa todos os filtros ativos e restaura a visualização de todas as tabelas
 */
function clearTypeFilters() {
  AppState.selectedTypeFilters.clear();
  if (DOM.drawerTiposList) {
    DOM.drawerTiposList.querySelectorAll('.drawer-checkbox').forEach(cb => {
      cb.checked = false;
    });
  }
  applyTypeFilters();
  showToast('Filtros limpos. Exibindo todos os tipos.');
}

/**
 * Abre o Menu Lateral (Drawer) de Filtros
 */
function openFiltersDrawer() {
  renderDrawerTypeFilters();
  if (DOM.overlayFiltros) DOM.overlayFiltros.classList.add('open');
  if (DOM.drawerFiltros) DOM.drawerFiltros.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * Fecha o Menu Lateral (Drawer) de Filtros
 */
function closeFiltersDrawer() {
  if (DOM.overlayFiltros) DOM.overlayFiltros.classList.remove('open');
  if (DOM.drawerFiltros) DOM.drawerFiltros.classList.remove('open');
  document.body.style.overflow = '';
}

// --- MÓDULO: js/charts.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - VISUALIZAÇÃO GRÁFICA (MENSAL E ANUAL)
 * Gráficos em SVG puro (Donut Chart, Ranking de Barras e Evolução dos 12 Meses)
 * 100% nativo, zero dependências externas, compatível com file:/// e offline.
 * =============================================================================
 */


const CHART_PALETTE = [
  '#3b82f6', // Azul (Primary)
  '#ef4444', // Vermelho (Danger)
  '#10b981', // Verde (Success)
  '#f59e0b', // Âmbar (Warning)
  '#8b5cf6', // Roxo (Purple)
  '#06b6d4', // Ciano (Info)
  '#ec4899', // Rosa
  '#14b8a6', // Teal
  '#f97316', // Laranja
  '#6366f1', // Índigo
  '#84cc16', // Lima
  '#e11d48'  // Carmim
];

let currentPeriodMode = 'month'; // 'month' | 'year'
let currentGroupMode = 'category'; // 'category' | 'type' | 'tag'

/**
 * Calcula dados agregados de despesas para renderização gráfica
 */
function calculateExpensesChartData(transactions, categories, {
  periodMode = 'month',
  groupMode = 'category',
  monthIndex = AppState.selectedMonthIndex,
  year = AppState.selectedYear
} = {}) {
  const targetYear = Number(year);
  const targetMonth = Number(monthIndex);

  // Mapeamento de categorias para identificar tipo e receitas
  const catMap = new Map();
  (categories || []).forEach(c => {
    if (c.id) catMap.set(String(c.id), c);
    if (c.name) catMap.set(String(c.name).trim().toLowerCase(), c);
  });

  // Filtra transações do ano e (opcionalmente) do mês selecionado
  const filtered = (transactions || []).filter(t => {
    if (Number(t.year) !== targetYear) return false;
    if (periodMode === 'month' && Number(t.monthIndex) !== targetMonth) return false;

    const val = Number(t.value) || 0;
    if (val <= 0) return false;

    const cat = catMap.get(String(t.categoryId || '')) ||
      (t.categoryName ? catMap.get(String(t.categoryName).trim().toLowerCase()) : null);

    if (cat) {
      const typeConfig = CATEGORY_TYPES.find(ct => ct.id === cat.type);
      // Ignora receitas e repasses (isRevenue: true)
      if (typeConfig && typeConfig.isRevenue) return false;
    }
    return true;
  });

  // Agrupamento por Categoria, Tipo de Conta ou Tag
  const groups = new Map();

  filtered.forEach(t => {
    const val = Number(t.value) || 0;
    const cat = catMap.get(String(t.categoryId || '')) ||
      (t.categoryName ? catMap.get(String(t.categoryName).trim().toLowerCase()) : null);

    let key = '';
    let label = '';

    if (groupMode === 'category') {
      key = cat ? String(cat.id) : (t.categoryName ? String(t.categoryName).trim() : 'Outros');
      label = cat ? cat.name : (t.categoryName ? String(t.categoryName).trim() : 'Outros');
    } else if (groupMode === 'type') {
      key = cat ? String(cat.type) : 'Outros';
      label = cat ? cat.type : 'Outros';
    } else if (groupMode === 'tag') {
      const rawTag = (t.tag && typeof t.tag === 'string') ? t.tag.trim() : '';
      key = rawTag || 'Sem Classificação';
      label = rawTag || 'Sem Classificação';
    }

    if (!groups.has(key)) {
      groups.set(key, { key, label, total: 0 });
    }
    groups.get(key).total += val;
  });

  // Converte para lista ordenada por maior valor
  const items = Array.from(groups.values()).sort((a, b) => b.total - a.total);
  const totalExpenses = items.reduce((acc, curr) => acc + curr.total, 0);

  // Calcula percentuais e cores
  items.forEach((item, idx) => {
    item.percentage = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
    item.color = CHART_PALETTE[idx % CHART_PALETTE.length];
  });

  return {
    items,
    totalExpenses,
    count: filtered.length,
    periodMode,
    groupMode,
    year: targetYear,
    monthIndex: targetMonth
  };
}

/**
 * Calcula a evolução das despesas e receitas nos 12 meses do ano
 */
function calculateMonthlyEvolutionData(transactions, categories, year = AppState.selectedYear) {
  const targetYear = Number(year);
  const catMap = new Map();
  (categories || []).forEach(c => {
    if (c.id) catMap.set(String(c.id), c);
    if (c.name) catMap.set(String(c.name).trim().toLowerCase(), c);
  });

  const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({
    monthIndex: i,
    monthName: MONTH_NAMES[i],
    monthShort: MONTH_SHORT[i],
    expenses: 0,
    revenues: 0
  }));

  (transactions || []).forEach(t => {
    if (Number(t.year) !== targetYear) return;
    const m = Number(t.monthIndex);
    if (m < 0 || m > 11) return;

    const val = Number(t.value) || 0;
    if (val <= 0) return;

    const cat = catMap.get(String(t.categoryId || '')) ||
      (t.categoryName ? catMap.get(String(t.categoryName).trim().toLowerCase()) : null);
    const typeConfig = cat ? CATEGORY_TYPES.find(ct => ct.id === cat.type) : null;
    const isRev = typeConfig ? typeConfig.isRevenue : false;

    if (isRev) {
      monthlyTotals[m].revenues += val;
    } else {
      monthlyTotals[m].expenses += val;
    }
  });

  const maxExpense = Math.max(...monthlyTotals.map(m => m.expenses), 1);

  return {
    year: targetYear,
    monthlyTotals,
    maxExpense
  };
}

/**
 * Gera o SVG do gráfico de rosca (Donut Chart)
 */
function renderDonutChartSVG(items, totalExpenses) {
  const radius = 80;
  const strokeWidth = 24;
  const cx = 120;
  const cy = 120;
  const circumference = 2 * Math.PI * radius; // ~502.65

  if (!items || items.length === 0 || totalExpenses <= 0) {
    return `
      <svg viewBox="0 0 240 240" class="donut-chart-svg" role="img" aria-label="Nenhuma despesa no período">
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="var(--border-color)" stroke-width="${strokeWidth}" opacity="0.3" />
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" class="donut-center-label">Sem Gastos</text>
        <text x="${cx}" y="${cy + 16}" text-anchor="middle" class="donut-center-val">R$ 0,00</text>
      </svg>
    `;
  }

  let accumulatedDash = 0;
  const slices = items.map((item, idx) => {
    const dashLength = (item.total / totalExpenses) * circumference;
    const offset = -accumulatedDash;
    accumulatedDash += dashLength;

    return `
      <circle 
        cx="${cx}" 
        cy="${cy}" 
        r="${radius}" 
        fill="none" 
        stroke="${item.color}" 
        stroke-width="${strokeWidth}" 
        stroke-dasharray="${dashLength.toFixed(2)} ${(circumference - dashLength).toFixed(2)}" 
        stroke-dashoffset="${offset.toFixed(2)}"
        class="donut-slice" 
        data-index="${idx}"
        data-label="${escapeHTML(item.label)}"
        data-val="${formatCurrency(item.total)}"
        data-pct="${item.percentage.toFixed(1)}%"
      />
    `;
  }).join('');

  return `
    <svg viewBox="0 0 240 240" class="donut-chart-svg" role="img" aria-label="Gráfico de distribuição de despesas">
      <g transform="rotate(-90 ${cx} ${cy})">
        ${slices}
      </g>
      <text x="${cx}" y="${cy - 12}" text-anchor="middle" id="donutCenterLabel" class="donut-center-label">Total Gasto</text>
      <text x="${cx}" y="${cy + 12}" text-anchor="middle" id="donutCenterVal" class="donut-center-val">${formatCurrency(totalExpenses)}</text>
      <text x="${cx}" y="${cy + 28}" text-anchor="middle" id="donutCenterPct" class="donut-center-pct">100%</text>
    </svg>
  `;
}

/**
 * Gera a lista de ranking de despesas com barras de progresso
 */
function renderRankingListHTML(items, totalExpenses) {
  if (!items || items.length === 0 || totalExpenses <= 0) {
    return `
      <div class="empty-state" style="padding: 24px 12px;">
        <p class="empty-title" style="font-size: 0.95rem;">Nenhuma despesa encontrada</p>
        <p class="empty-desc" style="font-size: 0.82rem;">Não há lançamentos de despesa registrados para este período.</p>
      </div>
    `;
  }

  return `
    <div class="charts-ranking-list" id="chartsRankingList">
      ${items.map((item, idx) => `
        <div class="ranking-item" data-index="${idx}" data-label="${escapeHTML(item.label)}" data-val="${formatCurrency(item.total)}" data-pct="${item.percentage.toFixed(1)}%">
          <div class="ranking-item-header">
            <div class="ranking-label-wrap">
              <span class="ranking-color-dot" style="background: ${item.color};"></span>
              <span class="ranking-label" title="${escapeHTML(item.label)}">${escapeHTML(item.label)}</span>
            </div>
            <div class="ranking-values-wrap">
              <span class="ranking-val">${formatCurrency(item.total)}</span>
              <span class="ranking-pct">${item.percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div class="ranking-bar-bg">
            <div class="ranking-bar-fill" style="width: ${item.percentage.toFixed(1)}%; background: ${item.color};"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Gera o gráfico de barras dos 12 meses (Evolução Anual)
 */
function renderAnnualEvolutionHTML(evolutionData) {
  const { monthlyTotals, maxExpense, year } = evolutionData;
  const currentMonth = Number(AppState.selectedMonthIndex);

  return `
    <div class="charts-evolution-section">
      <div class="charts-evolution-header">
        <h4 class="charts-evolution-title">Evolução Mensal de Despesas em ${year}</h4>
        <span class="badge badge-fixa" style="font-size: 0.74rem;">Clique na coluna para alternar o mês</span>
      </div>
      <div class="charts-evolution-grid">
        ${monthlyTotals.map((m, idx) => {
          const heightPct = maxExpense > 0 ? Math.max((m.expenses / maxExpense) * 100, 4) : 4;
          const isCurrent = idx === currentMonth;
          return `
            <div class="evolution-col ${isCurrent ? 'current-month' : ''}" data-month="${idx}" title="${m.monthName}: ${formatCurrency(m.expenses)} (Clique para selecionar)">
              <div class="evolution-bar-val">${m.expenses > 0 ? formatCurrency(m.expenses) : ''}</div>
              <div class="evolution-bar-track">
                <div class="evolution-bar" style="height: ${heightPct.toFixed(1)}%;"></div>
              </div>
              <span class="evolution-month-label">${m.monthShort}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Atualiza o conteúdo completo do modal de gráficos
 */
function renderChartsModal() {
  if (!DOM.modalChartsOverlay) return;

  const currentMonth = Number(AppState.selectedMonthIndex);
  const currentYear = Number(AppState.selectedYear);
  const monthName = MONTH_NAMES[currentMonth];

  // Atualiza subtítulo do modal
  const subtitleEl = DOM.chartsModalSubtitle;
  if (subtitleEl) {
    if (currentPeriodMode === 'month') {
      subtitleEl.textContent = `Visualização: ${monthName} de ${currentYear}`;
    } else {
      subtitleEl.textContent = `Visualização: Ano Completo de ${currentYear}`;
    }
  }

  // Atualiza controles de período (Dropdown de Mês vs Ano Inteiro)
  if (DOM.chartMonthSelect) {
    DOM.chartMonthSelect.value = String(currentMonth);
    DOM.chartMonthSelect.classList.toggle('active', currentPeriodMode === 'month');
  }
  if (DOM.btnChartPeriodMonth) {
    DOM.btnChartPeriodMonth.textContent = `Mês Atual (${MONTH_SHORT[currentMonth]})`;
    DOM.btnChartPeriodMonth.classList.toggle('active', currentPeriodMode === 'month');
  }
  if (DOM.btnChartPeriodYear) {
    DOM.btnChartPeriodYear.textContent = `Ano Inteiro (${currentYear})`;
    DOM.btnChartPeriodYear.classList.toggle('active', currentPeriodMode === 'year');
  }

  // Atualiza botões de agrupamento
  if (DOM.btnChartGroupCategory) {
    DOM.btnChartGroupCategory.classList.toggle('active', currentGroupMode === 'category');
  }
  if (DOM.btnChartGroupType) {
    DOM.btnChartGroupType.classList.toggle('active', currentGroupMode === 'type');
  }
  if (DOM.btnChartGroupTag) {
    DOM.btnChartGroupTag.classList.toggle('active', currentGroupMode === 'tag');
  }

  // Calcula dados
  const chartData = calculateExpensesChartData(AppState.transactions, AppState.categories, {
    periodMode: currentPeriodMode,
    groupMode: currentGroupMode,
    monthIndex: currentMonth,
    year: currentYear
  });

  // Atualiza banner de resumo
  if (DOM.chartsTotalExpensesVal) {
    DOM.chartsTotalExpensesVal.textContent = formatCurrency(chartData.totalExpenses);
  }
  if (DOM.chartsCountLabel) {
    DOM.chartsCountLabel.textContent = `${chartData.count} ${chartData.count === 1 ? 'lançamento computado' : 'lançamentos computados'}`;
  }

  // Renderiza Donut SVG
  if (DOM.donutContainer) {
    DOM.donutContainer.innerHTML = renderDonutChartSVG(chartData.items, chartData.totalExpenses);
  }

  // Renderiza Ranking List
  if (DOM.rankingContainer) {
    DOM.rankingContainer.innerHTML = renderRankingListHTML(chartData.items, chartData.totalExpenses);
  }

  // Renderiza Evolução Mensal dos 12 Meses (sempre visível no modal)
  if (DOM.evolutionContainer) {
    const evoData = calculateMonthlyEvolutionData(AppState.transactions, AppState.categories, currentYear);
    DOM.evolutionContainer.innerHTML = renderAnnualEvolutionHTML(evoData);
    DOM.evolutionContainer.style.display = 'block';

    // Permite clicar diretamente em qualquer coluna de mês para navegar
    DOM.evolutionContainer.querySelectorAll('.evolution-col').forEach(col => {
      col.addEventListener('click', () => {
        const m = parseInt(col.getAttribute('data-month'), 10);
        if (!isNaN(m)) {
          onChartMonthChange(m);
        }
      });
    });
  }

  // Vincula interatividade de hover (Donut <-> Ranking)
  attachChartHoverListeners(chartData.totalExpenses);
}

/**
 * Vincula interatividade ao passar o mouse nas fatias e na lista
 */
function attachChartHoverListeners(totalExpenses) {
  const centerLabel = document.getElementById('donutCenterLabel');
  const centerVal = document.getElementById('donutCenterVal');
  const centerPct = document.getElementById('donutCenterPct');

  if (!centerLabel || !centerVal || !centerPct) return;

  const defaultLabel = 'Total Gasto';
  const defaultVal = formatCurrency(totalExpenses);
  const defaultPct = '100%';

  const setCenter = (label, val, pct) => {
    centerLabel.textContent = label;
    centerVal.textContent = val;
    centerPct.textContent = pct;
  };

  const resetCenter = () => {
    setCenter(defaultLabel, defaultVal, defaultPct);
  };

  // Hover nas fatias do SVG
  const slices = document.querySelectorAll('.donut-slice');
  slices.forEach(slice => {
    slice.addEventListener('mouseenter', () => {
      const label = slice.getAttribute('data-label') || defaultLabel;
      const val = slice.getAttribute('data-val') || defaultVal;
      const pct = slice.getAttribute('data-pct') || defaultPct;
      setCenter(label, val, pct);

      const idx = slice.getAttribute('data-index');
      document.querySelectorAll('.ranking-item').forEach(item => {
        item.classList.toggle('highlighted', item.getAttribute('data-index') === idx);
      });
    });

    slice.addEventListener('mouseleave', () => {
      resetCenter();
      document.querySelectorAll('.ranking-item').forEach(item => item.classList.remove('highlighted'));
    });
  });

  // Hover nos itens do Ranking
  const rankingItems = document.querySelectorAll('.ranking-item');
  rankingItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      const label = item.getAttribute('data-label') || defaultLabel;
      const val = item.getAttribute('data-val') || defaultVal;
      const pct = item.getAttribute('data-pct') || defaultPct;
      setCenter(label, val, pct);

      const idx = item.getAttribute('data-index');
      slices.forEach(s => {
        if (s.getAttribute('data-index') === idx) {
          s.classList.add('slice-hover');
        } else {
          s.classList.remove('slice-hover');
        }
      });
    });

    item.addEventListener('mouseleave', () => {
      resetCenter();
      slices.forEach(s => s.classList.remove('slice-hover'));
    });
  });
}

/**
 * Abre o modal de gráficos
 */
function openChartsModal() {
  if (!DOM.modalChartsOverlay) return;
  document.body.style.overflow = 'hidden';
  DOM.modalChartsOverlay.style.display = 'flex';
  requestAnimationFrame(() => {
    DOM.modalChartsOverlay.classList.add('active');
  });
  renderChartsModal();
}

/**
 * Fecha o modal de gráficos
 */
function closeChartsModal() {
  if (!DOM.modalChartsOverlay) return;
  document.body.style.overflow = '';
  DOM.modalChartsOverlay.classList.remove('active');
  setTimeout(() => {
    DOM.modalChartsOverlay.style.display = 'none';
  }, 250);
}

/**
 * Altera a alternância de período (mês vs ano)
 */
function setChartPeriodMode(mode) {
  if (mode !== 'month' && mode !== 'year') return;
  currentPeriodMode = mode;
  renderChartsModal();
}

/**
 * Trata a mudança de mês via dropdown no modal
 * Sincroniza o estado global e o Dashboard em segundo plano
 */
function onChartMonthChange(newMonthIndex) {
  const m = Number(newMonthIndex);
  if (isNaN(m) || m < 0 || m > 11) return;

  currentPeriodMode = 'month';
  AppState.selectedMonthIndex = m;

  // Sincroniza abas horizontais do mês no Dashboard e na tela de Lançamentos
  if (DOM.monthTabsBar) {
    DOM.monthTabsBar.querySelectorAll('.month-tab').forEach(tab => {
      tab.classList.toggle('active', parseInt(tab.getAttribute('data-month'), 10) === m);
    });
  }
  if (DOM.dashMonthTabsBar) {
    DOM.dashMonthTabsBar.querySelectorAll('.month-tab').forEach(tab => {
      tab.classList.toggle('active', parseInt(tab.getAttribute('data-month'), 10) === m);
    });
  }

  // Atualiza os dados do Dashboard em segundo plano
  if (typeof window !== 'undefined' && window.Financas && typeof window.Financas.renderDashboard === 'function') {
    window.Financas.renderDashboard();
  }

  // Re-renderiza o gráfico com o novo mês selecionado
  renderChartsModal();
}

/**
 * Altera o agrupamento (categoria vs tipo vs tag)
 */
function setChartGroupMode(group) {
  if (group !== 'category' && group !== 'type' && group !== 'tag') return;
  currentGroupMode = group;
  renderChartsModal();
}


// --- MÓDULO: js/categories.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - GERENCIAMENTO DE CATEGORIAS, BACKUPS & ZONA DE PERIGO
 * =============================================================================
 */


let isResettingData = false;

function renderCategoryTable() {
  const categories = AppState.categories;
  if (!DOM.categoryTableBody) return;
  DOM.categoryTableBody.innerHTML = '';

  if (categories.length === 0) {
    if (DOM.categoryCountLabel) DOM.categoryCountLabel.textContent = 'Nenhuma categoria cadastrada';
    if (DOM.emptyState) DOM.emptyState.style.display = 'flex';
    return;
  }

  if (DOM.emptyState) DOM.emptyState.style.display = 'none';
  if (DOM.categoryCountLabel) {
    DOM.categoryCountLabel.textContent = `${categories.length} ${categories.length === 1 ? 'categoria registrada' : 'categorias registradas'}`;
  }

  categories.forEach(cat => {
    const tr = document.createElement('tr');
    const typeConfig = CATEGORY_TYPES.find(t => t.id === cat.type) || { badgeClass: 'badge-variavel' };

    tr.innerHTML = `
      <td><strong>${escapeHTML(cat.name)}</strong></td>
      <td>
        <span class="badge ${typeConfig.badgeClass}">${escapeHTML(cat.type)}</span>
      </td>
      <td class="text-right">
        <button class="btn-delete" data-delete-id="${escapeHTML(cat.id)}" aria-label="Excluir categoria ${escapeHTML(cat.name)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Excluir</span>
        </button>
      </td>
    `;

    tr.querySelector('.btn-delete').addEventListener('click', () => {
      deleteCategory(cat.id);
    });

    DOM.categoryTableBody.appendChild(tr);
  });
}

function addCategory(name, type) {
  const newCategory = {
    id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: name.trim(),
    type: normalizeCategoryType(type.trim())
  };

  AppState.categories.push(newCategory);
  saveCategories(AppState.categories);
  triggerCloudSync();

  renderCategoryTable();
  rebuildSidebar();
  showToast(`Categoria "${newCategory.name}" salva com sucesso!`);
}

function deleteCategory(id) {
  const cat = AppState.categories.find(c => c.id === id);
  if (!cat) return;

  if (!confirm(`Deseja realmente excluir a categoria "${cat.name}" e seus lançamentos?`)) {
    return;
  }

  AppState.categories = AppState.categories.filter(c => c.id !== id);
  saveCategories(AppState.categories);

  AppState.transactions = AppState.transactions.filter(t => {
    if (t.categoryId) {
      return t.categoryId !== id;
    }
    const sameName = t.categoryName.toLowerCase() === cat.name.toLowerCase();
    const sameType = t.categoryType ? (normalizeCategoryType(t.categoryType) === normalizeCategoryType(cat.type)) : true;
    return !(sameName && sameType);
  });
  saveTransactions(AppState.transactions);
  triggerCloudSync();

  if (AppState.currentRoute === 'category' && AppState.activeCategoryId === id) {
    navigateTo('configuracoes');
  }

  renderCategoryTable();
  rebuildSidebar();
  renderDashboard();
  showToast(`Categoria "${cat.name}" excluída.`);
}

function handleCategorySubmit(e) {
  e.preventDefault();
  if (DOM.nameError) DOM.nameError.textContent = '';
  if (DOM.typeError) DOM.typeError.textContent = '';
  if (DOM.categoryNameInput) DOM.categoryNameInput.style.borderColor = '';
  if (DOM.categoryTypeSelect) DOM.categoryTypeSelect.style.borderColor = '';

  const nameVal = DOM.categoryNameInput ? DOM.categoryNameInput.value.trim() : '';
  const typeVal = DOM.categoryTypeSelect ? DOM.categoryTypeSelect.value : '';
  let hasError = false;

  if (!nameVal) {
    if (DOM.nameError) DOM.nameError.textContent = 'Informe o nome da categoria.';
    if (DOM.categoryNameInput) DOM.categoryNameInput.style.borderColor = 'var(--danger)';
    hasError = true;
  } else if (nameVal.length < 2) {
    if (DOM.nameError) DOM.nameError.textContent = 'O nome deve ter pelo menos 2 caracteres.';
    if (DOM.categoryNameInput) DOM.categoryNameInput.style.borderColor = 'var(--danger)';
    hasError = true;
  }

  if (!typeVal) {
    if (DOM.typeError) DOM.typeError.textContent = 'Selecione um tipo válido.';
    if (DOM.categoryTypeSelect) DOM.categoryTypeSelect.style.borderColor = 'var(--danger)';
    hasError = true;
  }

  if (!hasError && nameVal && typeVal) {
    const normType = normalizeCategoryType(typeVal);
    const isDuplicate = AppState.categories.some(
      c => c.name.toLowerCase() === nameVal.toLowerCase() &&
           normalizeCategoryType(c.type).toLowerCase() === normType.toLowerCase()
    );
    if (isDuplicate) {
      if (DOM.nameError) DOM.nameError.textContent = `A categoria "${nameVal}" já existe para o tipo "${normType}".`;
      if (DOM.categoryNameInput) DOM.categoryNameInput.style.borderColor = 'var(--danger)';
      hasError = true;
    }
  }

  if (hasError) return;

  addCategory(nameVal, typeVal);

  if (DOM.categoryNameInput) DOM.categoryNameInput.value = '';
  if (DOM.categoryTypeSelect) DOM.categoryTypeSelect.selectedIndex = 0;
  if (DOM.categoryNameInput) DOM.categoryNameInput.focus();
}

function exportBackup() {
  const backupData = {
    versao: '2.3',
    dataExportacao: new Date().toISOString(),
    lastUpdated: AppState.lastUpdated || Date.now(),
    categorias: AppState.categories,
    lancamentos: AppState.transactions,
    tags: AppState.tags
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const today = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `financas_backup_${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Backup baixado com sucesso!');
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const parsed = JSON.parse(event.target.result);
      const incomingCats = parsed.categorias || parsed.categories || [];
      const incomingTrans = parsed.lancamentos || parsed.transactions || [];
      const incomingTags = parsed.tags || parsed.finance_tags || [];

      if (!Array.isArray(incomingCats)) {
        showToast('Arquivo de backup inválido.', 'error');
        return;
      }

      AppState.categories = incomingCats.map((c, i) => normalizeCategory(c, i));
      AppState.transactions = incomingTrans.map((t, i) => normalizeTransaction(t, i));
      if (Array.isArray(incomingTags) && incomingTags.length > 0) {
        AppState.tags = incomingTags.map(t => String(t).trim()).filter(Boolean);
        saveTags(AppState.tags, true);
        if (typeof window !== 'undefined' && typeof window.Financas?.renderTagSelectOptions === 'function') {
          window.Financas.renderTagSelectOptions();
        }
      }

      if (parsed.lastUpdated) {
        saveCategories(AppState.categories, true);
        saveTransactions(AppState.transactions, true);
        touchLastUpdated(parsed.lastUpdated);
      } else {
        saveCategories(AppState.categories);
        saveTransactions(AppState.transactions);
      }

      rebuildSidebar();
      renderCategoryTable();
      renderDashboard();

      showToast(`Backup restaurado! (${AppState.categories.length} categorias, ${AppState.transactions.length} lançamentos)`);
    } catch (err) {
      console.error('Erro na restauração:', err);
      showToast('Falha ao processar arquivo JSON de backup.', 'error');
    }
  };

  reader.readAsText(file);
  e.target.value = '';
}

function clearAllLocalData(options = {}) {
  const skipReload = options && options.skipReload === true;
  const userInput = window.prompt(
    "Esta ação é irreversível. Para confirmar a exclusão de TODOS os dados locais, digite a palavra APAGAR:"
  );

  if (userInput && userInput.trim().toUpperCase() === "APAGAR") {
    isResettingData = true;

    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.TAGS);
    localStorage.removeItem('financas_tags');
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
    localStorage.removeItem(STORAGE_KEYS.JSONBIN_KEY);
    localStorage.removeItem(STORAGE_KEYS.JSONBIN_BIN_ID);

    sessionStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    sessionStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    sessionStorage.removeItem(STORAGE_KEYS.TAGS);
    sessionStorage.removeItem('financas_tags');
    sessionStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
    sessionStorage.removeItem(STORAGE_KEYS.JSONBIN_KEY);
    sessionStorage.removeItem(STORAGE_KEYS.JSONBIN_BIN_ID);

    AppState.categories = [];
    AppState.transactions = [];
    AppState.tags = [];
    AppState.lastUpdated = 0;

    if (DOM.jsonbinApiKey) DOM.jsonbinApiKey.value = '';
    if (DOM.jsonbinBinId) DOM.jsonbinBinId.value = '';
    if (typeof setCloudStatus === 'function') {
      setCloudStatus('disconnected', '☁️ Nuvem Atualizada');
    }

    showToast('Dados e credenciais apagados com sucesso. O sistema será reiniciado.', 'success');

    const isTestEnv = (typeof window !== 'undefined') && (Boolean(window.__TEST_RUNNER__) || Boolean(window.__FINANCAS_TEST_ENV__));
    if (!skipReload && !isTestEnv && typeof window !== 'undefined' && window.location) {
      setTimeout(() => window.location.reload(), 1200);
    }
  } else {
    showToast('Ação cancelada. Seus dados estão seguros.', 'info');
  }
}


// --- MÓDULO: js/transactions.js ---
/**
 * =============================================================================
 * SISTEMA FINANCEIRO - DETALHE DA CATEGORIA, LANÇAMENTOS (CRUD) & TAGS
 * =============================================================================
 */


function changeYear(delta) {
  AppState.selectedYear = Number(AppState.selectedYear) + delta;
  updateYearDisplay();
  renderTransactionsTable();
  renderDashboard();
  showToast(`Ano selecionado: ${AppState.selectedYear}`);
}

function updateYearDisplay() {
  if (DOM.yearDisplay) {
    DOM.yearDisplay.textContent = AppState.selectedYear;
  }
}

function setActiveMonth(monthIndex) {
  if (AppState.editingTransactionId) {
    cancelEditingTransaction();
  }
  AppState.selectedMonthIndex = Number(monthIndex);

  if (DOM.monthTabsBar) {
    DOM.monthTabsBar.querySelectorAll('.month-tab').forEach(tab => {
      const tabMonth = parseInt(tab.getAttribute('data-month'), 10);
      if (tabMonth === AppState.selectedMonthIndex) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  if (DOM.dashMonthTabsBar) {
    DOM.dashMonthTabsBar.querySelectorAll('.month-tab').forEach(tab => {
      const tabMonth = parseInt(tab.getAttribute('data-month'), 10);
      if (tabMonth === AppState.selectedMonthIndex) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  renderTransactionsTable();
  if (AppState.currentRoute === 'dashboard') {
    renderDashboard();
  }
}

function setupCategoryDetailView(category) {
  cancelEditingTransaction();

  const typeConfig = CATEGORY_TYPES.find(t => t.id === category.type) || { badgeClass: 'badge-variavel' };
  
  if (DOM.catHeaderName) DOM.catHeaderName.textContent = category.name;
  if (DOM.catHeaderBadge) {
    DOM.catHeaderBadge.textContent = category.type;
    DOM.catHeaderBadge.className = `badge ${typeConfig.badgeClass}`;
  }

  if (DOM.filtroTipoCompra) {
    DOM.filtroTipoCompra.value = 'todos';
  }

  updateTransRepasseVisibility(category);
  renderTagSelectOptions();
  setActiveMonth(AppState.selectedMonthIndex);

  setTimeout(() => {
    DOM.transDescriptionInput?.focus();
  }, 60);
}

function updateTransRepasseVisibility(category) {
  if (!DOM.transRepasseGroup || !DOM.transRepasseSelect) return;

  const isCreditCard = category && normalizeCategoryType(category.type) === 'Cartão de Crédito';

  if (isCreditCard && !AppState.editingTransactionId) {
    DOM.transRepasseGroup.style.display = 'flex';
    DOM.transRepasseSelect.innerHTML = '<option value="">Nenhum repasse vinculado</option>';

    const repasseCats = AppState.categories.filter(c => normalizeCategoryType(c.type) === 'Repasse');
    repasseCats.forEach(rc => {
      const opt = document.createElement('option');
      opt.value = rc.id;
      opt.textContent = rc.name;
      DOM.transRepasseSelect.appendChild(opt);
    });
  } else {
    DOM.transRepasseGroup.style.display = 'none';
    DOM.transRepasseSelect.value = '';
    DOM.transRepasseSelect.innerHTML = '<option value="">Nenhum repasse vinculado</option>';
  }
}

function updateMonthTotal() {
  const activeCategory = AppState.categories.find(c => c.id === AppState.activeCategoryId);
  if (!activeCategory || !DOM.transTotalValue) return;

  const currentMonth = Number(AppState.selectedMonthIndex);
  const currentYear = Number(AppState.selectedYear);

  const filtered = AppState.transactions.filter(t => {
    const matchCat = t.categoryId ? (t.categoryId === activeCategory.id) : (t.categoryName.trim().toLowerCase() === activeCategory.name.trim().toLowerCase());
    return matchCat && Number(t.monthIndex) === currentMonth && Number(t.year) === currentYear;
  });

  const totalSum = filtered.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  DOM.transTotalValue.textContent = formatCurrency(totalSum);
}

function startEditingTransaction(id) {
  const t = AppState.transactions.find(item => item.id === id);
  if (!t) return;

  AppState.editingTransactionId = t.id;

  if (DOM.transDescriptionInput) DOM.transDescriptionInput.value = t.description;
  if (DOM.transInstallmentInput) DOM.transInstallmentInput.value = (t.installment && t.installment !== '-') ? t.installment : '';
  if (DOM.transValueInput) DOM.transValueInput.value = formatCurrency(Number(t.value));

  if (DOM.itemTag) {
    renderTagSelectOptions(t.tag || '');
    DOM.itemTag.value = t.tag || '';
  }

  if (DOM.btnSubmitTransText) {
    DOM.btnSubmitTransText.textContent = 'Salvar';
  }
  if (DOM.btnSubmitTransIcon) {
    DOM.btnSubmitTransIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
  }
  if (DOM.btnCancelEdit) {
    DOM.btnCancelEdit.style.display = 'inline-flex';
  }

  DOM.transDescriptionInput?.focus();
  DOM.transactionForm?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (DOM.transRepasseGroup) {
    DOM.transRepasseGroup.style.display = 'none';
  }

  DOM.transactionForm?.classList.add('edit-mode');

  if (DOM.transactionTableBody) {
    DOM.transactionTableBody.querySelectorAll('tr').forEach(row => {
      row.classList.remove('row-editing');
    });
    const targetRow = DOM.transactionTableBody.querySelector(`[data-edit-id="${t.id}"]`)?.closest('tr');
    if (targetRow) targetRow.classList.add('row-editing');
  }

  showToast(`Editando "${t.description}"...`);
}

function cancelEditingTransaction() {
  AppState.editingTransactionId = null;

  DOM.transactionForm?.classList.remove('edit-mode');

  if (DOM.transDescriptionInput) DOM.transDescriptionInput.value = '';
  if (DOM.transInstallmentInput) DOM.transInstallmentInput.value = '';
  if (DOM.transValueInput) DOM.transValueInput.value = '';
  if (DOM.itemTag) {
    DOM.itemTag.value = '';
    DOM.itemTag.style.borderColor = '';
  }

  if (DOM.btnSubmitTransText) {
    DOM.btnSubmitTransText.textContent = 'Adicionar Lançamento';
  }
  if (DOM.btnSubmitTransIcon) {
    DOM.btnSubmitTransIcon.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
  }
  if (DOM.btnCancelEdit) {
    DOM.btnCancelEdit.style.display = 'none';
  }

  if (DOM.transDescError) DOM.transDescError.textContent = '';
  if (DOM.transInstallmentError) DOM.transInstallmentError.textContent = '';
  if (DOM.transValueError) DOM.transValueError.textContent = '';
  if (DOM.itemTagError) DOM.itemTagError.textContent = '';
  if (DOM.transRepasseError) DOM.transRepasseError.textContent = '';
  if (DOM.transDescriptionInput) DOM.transDescriptionInput.style.borderColor = '';
  if (DOM.transInstallmentInput) DOM.transInstallmentInput.style.borderColor = '';
  if (DOM.transValueInput) DOM.transValueInput.style.borderColor = '';
  if (DOM.transRepasseSelect) DOM.transRepasseSelect.style.borderColor = '';

  if (DOM.transactionTableBody) {
    DOM.transactionTableBody.querySelectorAll('.row-editing').forEach(row => {
      row.classList.remove('row-editing');
    });
  }

  renderTagSelectOptions('');

  const activeCategory = AppState.categories.find(c => c.id === AppState.activeCategoryId);
  updateTransRepasseVisibility(activeCategory);
}

function renderTransactionsTable() {
  const activeCategory = AppState.categories.find(c => c.id === AppState.activeCategoryId);
  if (!activeCategory || !DOM.transactionTableBody) return;

  const currentMonth = Number(AppState.selectedMonthIndex);
  const currentYear = Number(AppState.selectedYear);
  const categoryTypeNorm = normalizeCategoryType(activeCategory.type);
  const isFixedOrVariable = (categoryTypeNorm === 'Conta Fixa' || categoryTypeNorm === 'Variável Prevista' || categoryTypeNorm === 'Receita' || categoryTypeNorm === 'Repasse');

  const monthTransactions = AppState.transactions.filter(t => {
    const matchCat = t.categoryId ? (t.categoryId === activeCategory.id) : (t.categoryName.trim().toLowerCase() === activeCategory.name.trim().toLowerCase());
    return matchCat && Number(t.monthIndex) === currentMonth && Number(t.year) === currentYear;
  });

  const filtroTipo = DOM.filtroTipoCompra ? DOM.filtroTipoCompra.value : 'todos';

  let filteredTransactions = monthTransactions;
  if (filtroTipo === 'unicas') {
    filteredTransactions = monthTransactions.filter(t => {
      const inst = t.installment !== undefined && t.installment !== null ? String(t.installment).trim() : '';
      return !inst || inst === '-';
    });
  } else if (filtroTipo === 'parceladas') {
    filteredTransactions = monthTransactions.filter(t => {
      const inst = t.installment !== undefined && t.installment !== null ? String(t.installment) : '';
      return inst.includes('/');
    });
  }

  DOM.transactionTableBody.innerHTML = '';
  if (DOM.transCountLabel) {
    DOM.transCountLabel.textContent = `${filteredTransactions.length} ${filteredTransactions.length === 1 ? 'lançamento' : 'lançamentos'} em ${MONTH_NAMES[currentMonth]} de ${currentYear}`;
  }

  const tableWrapper = DOM.transactionTable 
    ? DOM.transactionTable.closest('.table-responsive') 
    : (DOM.transactionTableBody ? DOM.transactionTableBody.closest('.table-responsive') : null);

  if (filteredTransactions.length === 0) {
    if (tableWrapper) tableWrapper.style.display = 'none';

    if (DOM.emptyTransState) {
      DOM.emptyTransState.style.display = 'flex';
      const emptyTitle = DOM.emptyTransState.querySelector('.empty-title');
      const emptyDesc = DOM.emptyTransState.querySelector('.empty-desc');
      if (monthTransactions.length > 0 && filtroTipo !== 'todos') {
        if (emptyTitle) emptyTitle.textContent = filtroTipo === 'unicas' ? 'Nenhuma compra única neste mês' : 'Nenhuma compra parcelada neste mês';
        if (emptyDesc) emptyDesc.textContent = 'Altere o filtro acima para visualizar outros lançamentos.';
      } else {
        if (emptyTitle) emptyTitle.textContent = 'Nenhum lançamento registrado neste mês';
        if (emptyDesc) emptyDesc.textContent = 'Adicione um lançamento no formulário acima para esta categoria.';
      }
    }
    if (DOM.transTotalValue) DOM.transTotalValue.textContent = formatCurrency(0);
    return;
  }

  if (tableWrapper) tableWrapper.style.display = 'block';
  if (DOM.emptyTransState) DOM.emptyTransState.style.display = 'none';
  if (DOM.transactionTableFoot) DOM.transactionTableFoot.style.display = 'table-footer-group';

  let totalSum = 0;

  filteredTransactions.forEach(t => {
    totalSum += Number(t.value) || 0;

    const tr = document.createElement('tr');
    if (t.isPaid) tr.classList.add('row-paid');
    if (AppState.editingTransactionId === t.id) tr.classList.add('row-editing');

    const isCredit = Number(t.value) < 0;
    const creditClass = isCredit ? ' valor-credito' : '';

    const valueCellHtml = isFixedOrVariable
      ? `<td class="val-cell${creditClass}">
           <div class="inline-val-wrapper">
             <span class="inline-val-currency">R$</span>
             <input 
               type="number" 
               step="0.01" 
               class="inline-val-input${creditClass}" 
               value="${Number(t.value).toFixed(2)}" 
               data-id="${escapeHTML(t.id)}"
               title="Clique para editar este valor apenas neste mês"
               aria-label="Editar valor no mês"
             />
           </div>
         </td>`
      : `<td class="val-cell${creditClass}"><strong>${formatCurrency(t.value)}</strong></td>`;

    const tagHtml = t.tag ? ` <span class="badge-tag">${escapeHTML(t.tag)}</span>` : '';

    tr.innerHTML = `
      <td style="text-align: center;">
        <input 
          type="checkbox" 
          class="status-checkbox" 
          data-id="${escapeHTML(t.id)}" 
          ${t.isPaid ? 'checked' : ''} 
          aria-label="Marcar como pago"
        />
      </td>
      <td class="installment-cell">
        <span class="badge-installment">${escapeHTML(t.installment || '-')}</span>
      </td>
      <td class="desc-cell">${escapeHTML(t.description)}${tagHtml}</td>
      ${valueCellHtml}
      <td class="text-right actions-cell">
        <button class="btn-edit" data-edit-id="${escapeHTML(t.id)}" aria-label="Editar lançamento" title="Editar lançamento">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>Editar</span>
        </button>
        <button class="btn-delete" data-delete-id="${escapeHTML(t.id)}" aria-label="Excluir lançamento" title="Excluir lançamento">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Excluir</span>
        </button>
      </td>
    `;

    tr.querySelector('.status-checkbox').addEventListener('change', (e) => {
      toggleTransactionPaid(t.id, e.target.checked);
    });

    tr.querySelector('.btn-edit').addEventListener('click', () => {
      startEditingTransaction(t.id);
    });

    tr.querySelector('.btn-delete').addEventListener('click', () => {
      deleteTransaction(t.id);
    });

    if (isFixedOrVariable) {
      const inlineInput = tr.querySelector('.inline-val-input');
      if (inlineInput) {
        const commitValueChange = () => {
          const newVal = parseFloat(inlineInput.value);
          if (!isNaN(newVal) && newVal !== t.value) {
            let propagateInline = false;
            if (t.groupId) {
              propagateInline = window.confirm(
                "Deseja aplicar essa alteração (Valor) também para os meses seguintes?"
              );
            }
            const res = updateTransactionCascade(
              AppState.transactions,
              t.id,
              { description: t.description, value: newVal, installment: t.installment, tag: t.tag },
              propagateInline
            );
            AppState.transactions = res.transactions;
            saveTransactions(AppState.transactions);
            triggerCloudSync();
            renderTransactionsTable();
            renderDashboard();
            showToast(propagateInline ? "Valor atualizado neste mês e nos meses seguintes!" : `Valor de "${t.description}" atualizado para ${formatCurrency(newVal)}`);
          } else {
            inlineInput.value = Number(t.value).toFixed(2);
          }
        };

        inlineInput.addEventListener('change', commitValueChange);
        inlineInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') inlineInput.blur();
        });
      }
    }

    DOM.transactionTableBody.appendChild(tr);
  });

  if (DOM.transTotalValue) DOM.transTotalValue.textContent = formatCurrency(totalSum);
}

function toggleTransactionPaid(id, isPaid) {
  const transaction = AppState.transactions.find(t => t.id === id);
  if (!transaction) return;

  transaction.isPaid = isPaid;
  saveTransactions(AppState.transactions);
  triggerCloudSync();
  renderTransactionsTable();
  showToast(isPaid ? 'Marcado como pago' : 'Marcado como pendente');
}

function deleteTransaction(id) {
  const transaction = AppState.transactions.find(t => t.id === id);
  if (!transaction) return;

  const hasGroupOccurrences = transaction.groupId && AppState.transactions.some(
    other => other.id !== transaction.id && other.groupId === transaction.groupId
  );
  const isFraction = transaction.installment && transaction.installment.includes('/');

  if (hasGroupOccurrences || isFraction) {
    const deleteSubsequent = window.confirm(
      "Deseja excluir também as parcelas/ocorrências dos meses seguintes?"
    );

    const result = deleteTransactionCascade(AppState.transactions, id, deleteSubsequent);
    AppState.transactions = result.transactions;
    showToast(deleteSubsequent ? "Lançamento e ocorrências seguintes excluídos com sucesso." : "Apenas o lançamento deste mês foi excluído.");
  } else {
    if (!window.confirm(`Deseja excluir o lançamento "${transaction.description}"?`)) {
      return;
    }
    const result = deleteTransactionCascade(AppState.transactions, id, false);
    AppState.transactions = result.transactions;
    showToast("Lançamento excluído com sucesso.");
  }

  if (AppState.editingTransactionId === id) {
    cancelEditingTransaction();
  }

  saveTransactions(AppState.transactions);
  triggerCloudSync();
  renderTransactionsTable();
  renderDashboard();
}

function handleTransactionSubmit(e) {
  e.preventDefault();

  if (DOM.transDescError) DOM.transDescError.textContent = '';
  if (DOM.transInstallmentError) DOM.transInstallmentError.textContent = '';
  if (DOM.transValueError) DOM.transValueError.textContent = '';
  if (DOM.transDescriptionInput) DOM.transDescriptionInput.style.borderColor = '';
  if (DOM.transInstallmentInput) DOM.transInstallmentInput.style.borderColor = '';
  if (DOM.transValueInput) DOM.transValueInput.style.borderColor = '';

  const activeCategory = AppState.categories.find(c => c.id === AppState.activeCategoryId);
  if (!activeCategory) return;

  const descVal = DOM.transDescriptionInput ? DOM.transDescriptionInput.value.trim() : '';
  const installmentRaw = DOM.transInstallmentInput ? DOM.transInstallmentInput.value.trim() : '';
  const valVal = DOM.transValueInput ? DOM.transValueInput.value.trim() : '';
  const valNum = parseCurrencyToFloat(valVal);
  let hasError = false;

  if (!descVal) {
    if (DOM.transDescError) DOM.transDescError.textContent = 'Informe a descrição do lançamento.';
    if (DOM.transDescriptionInput) DOM.transDescriptionInput.style.borderColor = 'var(--danger)';
    hasError = true;
  }

  if (!valVal || isNaN(valNum) || valNum === 0) {
    if (DOM.transValueError) DOM.transValueError.textContent = 'Informe um valor válido diferente de zero.';
    if (DOM.transValueInput) DOM.transValueInput.style.borderColor = 'var(--danger)';
    hasError = true;
  }

  if (hasError) return;

  const rawTagVal = DOM.itemTag ? DOM.itemTag.value.trim() : '';
  const tagToSave = (rawTagVal === 'new') ? '' : rawTagVal;

  if (AppState.editingTransactionId) {
    const existingIndex = AppState.transactions.findIndex(item => item.id === AppState.editingTransactionId);

    if (existingIndex !== -1) {
      const existing = AppState.transactions[existingIndex];
      const hasGroupId = Boolean(existing.groupId);
      let propagateToFuture = false;

      if (hasGroupId) {
        propagateToFuture = window.confirm(
          "Deseja aplicar essa alteração (Valor/Descrição/Classificação) também para os meses seguintes?"
        );
      }

      const result = updateTransactionCascade(
        AppState.transactions,
        AppState.editingTransactionId,
        { description: descVal, value: valNum, installment: installmentRaw || '-', tag: tagToSave },
        propagateToFuture
      );

      AppState.transactions = result.transactions;
      saveTransactions(AppState.transactions);
      triggerCloudSync();
      cancelEditingTransaction();
      renderTransactionsTable();
      renderDashboard();

      if (propagateToFuture) {
        showToast(`Alteração aplicada neste mês e nos ${result.updatedCount - 1} meses seguintes!`);
      } else {
        showToast('Alteração aplicada apenas neste mês.');
      }
      return;
    } else {
      cancelEditingTransaction();
    }
  }

  const currentMonth = Number(AppState.selectedMonthIndex);
  const currentYear = Number(AppState.selectedYear);
  const typeNorm = normalizeCategoryType(activeCategory.type);
  const isFixedOrVariable = (typeNorm === 'Conta Fixa' || typeNorm === 'Variável Prevista' || typeNorm === 'Receita' || typeNorm === 'Repasse');
  const fractionMatch = installmentRaw.match(/^(\d+)\s*\/\s*(\d+)$/);
  const isFraction = Boolean(fractionMatch);

  let propagar = false;
  if (isFixedOrVariable && !isFraction) {
    propagar = window.confirm("Deseja lançar esta conta para todos os meses restantes do ano?");
  }

  try {
    const isCreditCard = typeNorm === 'Cartão de Crédito';
    const repasseTargetId = (isCreditCard && DOM.transRepasseSelect) ? DOM.transRepasseSelect.value : '';
    const repasseCategory = repasseTargetId ? AppState.categories.find(c => c.id === repasseTargetId) : null;

    const pairResult = createExpenseWithRepasseMirror({
      description: descVal,
      value: valNum,
      installment: installmentRaw,
      monthIndex: currentMonth,
      year: currentYear,
      cardCategory: activeCategory,
      repasseCategory: repasseCategory,
      shouldPropagate: propagar,
      tag: tagToSave
    });

    const generatedExpense = pairResult.expenses;
    const generatedRevenue = pairResult.revenues;

    AppState.transactions.push(...pairResult.all);
    saveTransactions(AppState.transactions);
    triggerCloudSync();

    if (DOM.transDescriptionInput) DOM.transDescriptionInput.value = '';
    if (DOM.transInstallmentInput) DOM.transInstallmentInput.value = '';
    if (DOM.transValueInput) DOM.transValueInput.value = '';
    if (DOM.itemTag) DOM.itemTag.value = '';
    if (DOM.transRepasseSelect) DOM.transRepasseSelect.value = '';
    DOM.transDescriptionInput?.focus();

    renderTransactionsTable();
    renderDashboard();

    if (repasseCategory) {
      const countMsg = generatedExpense.length > 1 ? `${generatedExpense.length} parcelas` : '1 lançamento';
      showToast(`Despesa vinculada criada no cartão e entrada registrada em "${repasseCategory.name}" (${countMsg})!`);
    } else if (generatedExpense.length > 1) {
      showToast(`Lançamento projetado com sucesso para os ${generatedExpense.length} meses seguintes!`);
    } else {
      showToast('Lançamento salvo com sucesso para o mês selecionado!');
    }
  } catch (err) {
    if (DOM.transInstallmentError) DOM.transInstallmentError.textContent = err.message || 'Erro no parcelamento.';
    if (DOM.transInstallmentInput) DOM.transInstallmentInput.style.borderColor = 'var(--danger)';
  }
}

function renderTagSelectOptions(selectedTag = '') {
  if (!DOM.itemTag) return;
  const current = selectedTag !== undefined ? String(selectedTag).trim() : (DOM.itemTag.value || '');
  const tags = (Array.isArray(AppState.tags)) ? AppState.tags : [];

  let html = '<option value="">Selecione uma classificação...</option>';
  tags.forEach(tag => {
    const isSelected = (current && current.toLowerCase() === tag.toLowerCase()) ? ' selected' : '';
    html += `<option value="${escapeHTML(tag)}"${isSelected}>${escapeHTML(tag)}</option>`;
  });

  if (current && !tags.some(t => t.toLowerCase() === current.toLowerCase())) {
    html += `<option value="${escapeHTML(current)}" selected>${escapeHTML(current)}</option>`;
  }

  DOM.itemTag.innerHTML = html;
  if (current) {
    DOM.itemTag.value = current;
  }
}

function openManageTagsModal() {
  if (!DOM.modalManageTagsOverlay) return;
  document.body.style.overflow = 'hidden';
  DOM.modalManageTagsOverlay.style.display = 'flex';
  requestAnimationFrame(() => {
    DOM.modalManageTagsOverlay.classList.add('active');
  });
  if (DOM.newTagNameInput) {
    DOM.newTagNameInput.value = '';
    DOM.newTagNameInput.style.borderColor = '';
  }
  if (DOM.newTagError) {
    DOM.newTagError.textContent = '';
  }
  renderManageTagsList();
  setTimeout(() => {
    DOM.newTagNameInput?.focus();
  }, 100);
}

function closeManageTagsModal() {
  if (!DOM.modalManageTagsOverlay) return;
  document.body.style.overflow = '';
  DOM.modalManageTagsOverlay.classList.remove('active');
  setTimeout(() => {
    DOM.modalManageTagsOverlay.style.display = 'none';
  }, 250);
  renderTagSelectOptions();
}

function addTagFromModal() {
  if (!DOM.newTagNameInput) return;
  const name = DOM.newTagNameInput.value.trim();
  if (!name) {
    if (DOM.newTagError) DOM.newTagError.textContent = 'Informe o nome da classificação.';
    DOM.newTagNameInput.style.borderColor = 'var(--danger)';
    DOM.newTagNameInput.focus();
    return;
  }

  const existing = AppState.tags.some(t => t.toLowerCase() === name.toLowerCase());
  if (existing) {
    if (DOM.newTagError) DOM.newTagError.textContent = `A classificação "${name}" já existe.`;
    DOM.newTagNameInput.style.borderColor = 'var(--danger)';
    DOM.newTagNameInput.focus();
    return;
  }

  AppState.tags.push(name);
  saveTags(AppState.tags);
  DOM.newTagNameInput.value = '';
  if (DOM.newTagError) DOM.newTagError.textContent = '';
  DOM.newTagNameInput.style.borderColor = '';

  renderManageTagsList();
  renderTagSelectOptions(name);
  showToast(`Classificação "${name}" adicionada com sucesso!`, 'success');
  DOM.newTagNameInput.focus();
}

function deleteTagFromModal(tagName) {
  if (!tagName) return;
  const confirmed = window.confirm(`Deseja remover a classificação "${tagName}" da lista de opções?\n\nLançamentos já criados com esta classificação manterão a tag intacta.`);
  if (!confirmed) return;

  AppState.tags = AppState.tags.filter(t => t.toLowerCase() !== tagName.toLowerCase());
  saveTags(AppState.tags);

  renderManageTagsList();
  renderTagSelectOptions();
  showToast(`Classificação "${tagName}" removida da lista.`, 'info');
}

function renderManageTagsList() {
  if (!DOM.manageTagsList) return;
  DOM.manageTagsList.innerHTML = '';

  const tags = Array.isArray(AppState.tags) ? AppState.tags : [];
  if (tags.length === 0) {
    if (DOM.manageTagsEmpty) DOM.manageTagsEmpty.style.display = 'block';
    return;
  }

  if (DOM.manageTagsEmpty) DOM.manageTagsEmpty.style.display = 'none';

  tags.forEach(tag => {
    const li = document.createElement('li');
    li.className = 'manage-tag-item';
    li.innerHTML = `
      <span class="manage-tag-name">${escapeHTML(tag)}</span>
      <button type="button" class="btn-delete-tag" data-tag="${escapeHTML(tag)}" title="Excluir classificação" aria-label="Excluir classificação ${escapeHTML(tag)}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    `;

    const btnDel = li.querySelector('.btn-delete-tag');
    if (btnDel) {
      btnDel.addEventListener('click', () => {
        deleteTagFromModal(tag);
      });
    }

    DOM.manageTagsList.appendChild(li);
  });
}

// --- INICIALIZAÇÃO & EVENT LISTENERS ---
function setupEventListeners() {
  if (DOM.categoryForm) DOM.categoryForm.addEventListener('submit', handleCategorySubmit);
  if (DOM.transactionForm) DOM.transactionForm.addEventListener('submit', handleTransactionSubmit);
  if (DOM.btnCancelEdit) DOM.btnCancelEdit.addEventListener('click', cancelEditingTransaction);
  if (DOM.filtroTipoCompra) DOM.filtroTipoCompra.addEventListener('change', () => renderTransactionsTable());
  if (DOM.btnPrevYear) DOM.btnPrevYear.addEventListener('click', () => changeYear(-1));
  if (DOM.btnNextYear) DOM.btnNextYear.addEventListener('click', () => changeYear(1));

  if (DOM.monthTabsBar) {
    DOM.monthTabsBar.querySelectorAll('.month-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const month = parseInt(tab.getAttribute('data-month'), 10);
        setActiveMonth(month);
      });
    });
  }

  if (DOM.dashMonthTabsBar) {
    DOM.dashMonthTabsBar.querySelectorAll('.month-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const month = parseInt(tab.getAttribute('data-month'), 10);
        setActiveMonth(month);
      });
    });
  }

  if (DOM.btnAbrirFiltros) DOM.btnAbrirFiltros.addEventListener('click', openFiltersDrawer);
  if (DOM.btnFecharFiltros) DOM.btnFecharFiltros.addEventListener('click', closeFiltersDrawer);
  if (DOM.btnConcluidoFiltros) DOM.btnConcluidoFiltros.addEventListener('click', closeFiltersDrawer);
  if (DOM.overlayFiltros) DOM.overlayFiltros.addEventListener('click', closeFiltersDrawer);
  if (DOM.btnLimparFiltros) DOM.btnLimparFiltros.addEventListener('click', clearTypeFilters);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.drawerFiltros && DOM.drawerFiltros.classList.contains('open')) {
      closeFiltersDrawer();
    }
  });

  if (DOM.fixedNavLinks) {
    DOM.fixedNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        const route = link.getAttribute('data-route');
        navigateTo(route);
      });
    });
  }

  if (DOM.btnGoToConfig) DOM.btnGoToConfig.addEventListener('click', () => navigateTo('configuracoes'));
  if (DOM.btnExportBackup) DOM.btnExportBackup.addEventListener('click', exportBackup);
  if (DOM.importBackupInput) DOM.importBackupInput.addEventListener('change', importBackup);
  if (DOM.btnSaveCloudCreds) DOM.btnSaveCloudCreds.addEventListener('click', saveCloudCredentials);
  if (DOM.btnSyncToCloud) DOM.btnSyncToCloud.addEventListener('click', syncToCloud);
  if (DOM.btnSyncFromCloud) DOM.btnSyncFromCloud.addEventListener('click', syncFromCloud);

  const toggleBtn = DOM.btnMenuToggle || DOM.mobileToggle;
  if (toggleBtn && DOM.sidebar) {
    toggleBtn.addEventListener('click', () => {
      DOM.sidebar.classList.toggle('sidebar-open');
      if (DOM.sidebarOverlay) DOM.sidebarOverlay.classList.toggle('active');
    });
  }

  if (DOM.sidebarOverlay && DOM.sidebar) {
    DOM.sidebarOverlay.addEventListener('click', () => {
      DOM.sidebar.classList.remove('sidebar-open');
      DOM.sidebarOverlay.classList.remove('active');
    });
  }

  if (DOM.categoryNameInput) {
    DOM.categoryNameInput.addEventListener('input', () => {
      if (DOM.nameError) DOM.nameError.textContent = '';
      DOM.categoryNameInput.style.borderColor = '';
    });
  }

  if (DOM.categoryTypeSelect) {
    DOM.categoryTypeSelect.addEventListener('change', () => {
      if (DOM.typeError) DOM.typeError.textContent = '';
      DOM.categoryTypeSelect.style.borderColor = '';
    });
  }

  if (DOM.transDescriptionInput) {
    DOM.transDescriptionInput.addEventListener('input', () => {
      if (DOM.transDescError) DOM.transDescError.textContent = '';
      DOM.transDescriptionInput.style.borderColor = '';
    });
  }

  if (DOM.transInstallmentInput) {
    DOM.transInstallmentInput.addEventListener('input', () => {
      if (DOM.transInstallmentError) DOM.transInstallmentError.textContent = '';
      DOM.transInstallmentInput.style.borderColor = '';
    });
  }

  if (DOM.transValueInput) {
    DOM.transValueInput.addEventListener('input', (e) => {
      if (DOM.transValueError) DOM.transValueError.textContent = '';
      DOM.transValueInput.style.borderColor = '';
      handleCurrencyInput(e);
    });
  }

  if (DOM.btnManageTags) DOM.btnManageTags.addEventListener('click', openManageTagsModal);
  if (DOM.btnCloseManageTags) DOM.btnCloseManageTags.addEventListener('click', closeManageTagsModal);
  if (DOM.btnDoneManageTags) DOM.btnDoneManageTags.addEventListener('click', closeManageTagsModal);
  if (DOM.modalManageTagsOverlay) {
    DOM.modalManageTagsOverlay.addEventListener('click', (e) => {
      if (e.target === DOM.modalManageTagsOverlay) closeManageTagsModal();
    });
  }
  if (DOM.btnAddTagBtn) DOM.btnAddTagBtn.addEventListener('click', addTagFromModal);
  if (DOM.newTagNameInput) {
    DOM.newTagNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTagFromModal();
      }
    });
    DOM.newTagNameInput.addEventListener('input', () => {
      if (DOM.newTagError) DOM.newTagError.textContent = '';
      DOM.newTagNameInput.style.borderColor = '';
    });
  }

  if (DOM.btnOpenChartsModal) DOM.btnOpenChartsModal.addEventListener('click', openChartsModal);
  if (DOM.btnCloseChartsModal) DOM.btnCloseChartsModal.addEventListener('click', closeChartsModal);
  if (DOM.btnDoneChartsModal) DOM.btnDoneChartsModal.addEventListener('click', closeChartsModal);
  if (DOM.modalChartsOverlay) {
    DOM.modalChartsOverlay.addEventListener('click', (e) => {
      if (e.target === DOM.modalChartsOverlay) closeChartsModal();
    });
  }
  if (DOM.chartMonthSelect) {
    DOM.chartMonthSelect.addEventListener('change', (e) => {
      onChartMonthChange(e.target.value);
    });
  }
  if (DOM.btnChartPeriodMonth) DOM.btnChartPeriodMonth.addEventListener('click', () => setChartPeriodMode('month'));
  if (DOM.btnChartPeriodYear) DOM.btnChartPeriodYear.addEventListener('click', () => setChartPeriodMode('year'));
  if (DOM.btnChartGroupCategory) DOM.btnChartGroupCategory.addEventListener('click', () => setChartGroupMode('category'));
  if (DOM.btnChartGroupType) DOM.btnChartGroupType.addEventListener('click', () => setChartGroupMode('type'));
  if (DOM.btnChartGroupTag) DOM.btnChartGroupTag.addEventListener('click', () => setChartGroupMode('tag'));

  if (DOM.btnClearAllData) DOM.btnClearAllData.addEventListener('click', clearAllLocalData);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.modalChartsOverlay && DOM.modalChartsOverlay.classList.contains('active')) {
        closeChartsModal();
        return;
      }
      if (DOM.modalManageTagsOverlay && DOM.modalManageTagsOverlay.classList.contains('active')) {
        closeManageTagsModal();
        return;
      }
      cancelEditingTransaction();
      resetAllForms();
      closeMobileSidebar();
      closeFiltersDrawer();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    if (isResettingData) return;
    StorageEngine.set(STORAGE_KEYS.CATEGORIES, AppState.categories);
    StorageEngine.set(STORAGE_KEYS.TRANSACTIONS, AppState.transactions);
    StorageEngine.set(STORAGE_KEYS.TAGS, AppState.tags);
  });
}

function init() {
  setupEventListeners();
  updateYearDisplay();
  loadCloudCredentials();
  renderTagSelectOptions();

  if (DOM.storageStatusBadge) {
    if (StorageEngine.isAvailable) {
      DOM.storageStatusBadge.innerHTML = '<span class="status-dot"></span><span>Storage Ativo</span>';
    } else {
      DOM.storageStatusBadge.style.color = 'var(--warning)';
      DOM.storageStatusBadge.innerHTML = '<span class="status-dot" style="background: var(--warning)"></span><span>Modo Sessão</span>';
    }
  }

  rebuildSidebar();
  navigateTo('dashboard');

  if (typeof setupCloudFocusListener === 'function') {
    setupCloudFocusListener();
  }
  if (typeof checkAndSyncCloudOnStartup === 'function') {
    checkAndSyncCloudOnStartup({ silent: true, showNotification: true });
  }
}

window.Financas = {
  STORAGE_KEYS,
  DEFAULT_TAGS,
  CATEGORY_TYPES,
  MONTH_NAMES,
  MONTH_SHORT,
  DOM,
  StorageEngine,
  normalizeCategoryType,
  normalizeCategory,
  normalizeTransaction,
  loadCategories,
  saveCategories,
  loadTransactions,
  saveTransactions,
  loadTags,
  saveTags,
  renderTagSelectOptions,
  openManageTagsModal,
  closeManageTagsModal,
  addTagFromModal,
  deleteTagFromModal,
  renderManageTagsList,
  generateTransactionsMultiYear,
  createExpenseWithRepasseMirror,
  deleteTransactionCascade,
  updateTransactionCascade,
  calculateTotalsByMonthAndYear,
  AppState,
  rebuildSidebar,
  navigateTo,
  setActiveMonth,
  changeYear,
  updateYearDisplay,
  startEditingTransaction,
  cancelEditingTransaction,
  openFiltersDrawer,
  closeFiltersDrawer,
  applyTypeFilters,
  clearTypeFilters,
  exportBackup,
  clearAllLocalData,
  loadLastUpdated,
  touchLastUpdated,
  formatTimestamp,
  updateLastUpdatedUI,
  loadCloudCredentials,
  saveCloudCredentials,
  syncToCloud,
  syncFromCloud,
  debounce,
  setCloudStatus,
  executeAutoCloudSync,
  debouncedAutoCloudSync,
  triggerCloudSync,
  areStatesEqual,
  refreshUI,
  checkAndSyncCloudOnStartup,
  resetStartupSyncLock,
  setupCloudFocusListener,
  handleCurrencyInput,
  parseCurrencyToFloat,
  showToast,
  setupCategoryDetailView,
  renderTransactionsTable,
  toggleTransactionPaid,
  deleteTransaction,
  handleTransactionSubmit,
  renderCategoryTable,
  addCategory,
  deleteCategory,
  handleCategorySubmit,
  renderDashboard,
  renderDashboardTables,
  renderSpreadsheetBlock,
  calculateExpensesChartData,
  calculateMonthlyEvolutionData,
  renderDonutChartSVG,
  renderRankingListHTML,
  renderAnnualEvolutionHTML,
  openChartsModal,
  closeChartsModal,
  setChartPeriodMode,
  setChartGroupMode,
  renderChartsModal,
  onChartMonthChange,
  init
};

window.showToast = showToast;

if (typeof document !== 'undefined' && !window.__TEST_RUNNER__ && !window.__FINANCAS_TEST_ENV__) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

})();
