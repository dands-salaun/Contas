/**
 * =============================================================================
 * SISTEMA FINANCEIRO - SINGLE PAGE APPLICATION (SPA)
 * Vanilla JavaScript puro - Motor Multi-Ano, Seletor de Ano no Header,
 * Matemática de Parcelamento, Projeção de 12 Meses e Edição Completa (Update).
 * =============================================================================
 */

// =============================================================================
// 1. CONSTANTES & CONFIGURAÇÕES
// =============================================================================
const STORAGE_KEYS = {
  CATEGORIES: 'financas_categorias',
  TRANSACTIONS: 'financas_lancamentos',
  JSONBIN_KEY: 'financas_jsonbin_key',
  JSONBIN_BIN_ID: 'financas_jsonbin_bin_id',
  LAST_UPDATED: 'financas_last_updated'
};

const CATEGORY_TYPES = [
  { id: 'Receita', label: 'Receitas', badgeClass: 'badge-receita', isRevenue: true },
  { id: 'Conta Fixa', label: 'Contas Fixas', badgeClass: 'badge-fixa', isRevenue: false },
  { id: 'Cartão de Crédito', label: 'Cartões de Crédito', badgeClass: 'badge-cartao', isRevenue: false },
  { id: 'Variável Prevista', label: 'Variáveis Previstas', badgeClass: 'badge-variavel', isRevenue: false },
  { id: 'Repasse', label: 'Repasses', badgeClass: 'badge-repasse', isRevenue: false }
];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// =============================================================================
// 2. MOTOR DE ARMAZENAMENTO SEGURO (STORAGE ENGINE BLINDADO)
// =============================================================================
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

// =============================================================================
// 3. NORMALIZAÇÃO ROBUSTA DE DADOS (COM SUPORTE A YEAR)
// =============================================================================

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
  const categoryType = item.categoryType ? normalizeCategoryType(item.categoryType) : undefined;

  return { id, groupId, categoryId, categoryName, categoryType, year, monthIndex, description, installment, value, isPaid };
}

// =============================================================================
// 4. CAMADA DE NEGÓCIO PURA & PERSISTÊNCIA (ISOLADA DO DOM)
// =============================================================================

function loadLastUpdated() {
  const data = StorageEngine.get(STORAGE_KEYS.LAST_UPDATED);
  if (data && typeof data === 'number') return data;
  if (data && !isNaN(Number(data))) return Number(data);
  const raw = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
  if (raw && !isNaN(Number(raw))) return Number(raw);
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

function updateLastUpdatedUI() {
  if (typeof DOM !== 'undefined' && DOM.cloudLastUpdatedText) {
    const ts = typeof AppState !== 'undefined' ? AppState.lastUpdated : loadLastUpdated();
    const formatted = formatTimestamp(ts);
    DOM.cloudLastUpdatedText.textContent = `Última modificação local: ${formatted}`;
  }
}

function touchLastUpdated(ts = Date.now()) {
  const numTs = Number(ts) || Date.now();
  if (typeof AppState !== 'undefined') {
    AppState.lastUpdated = numTs;
  }
  StorageEngine.set(STORAGE_KEYS.LAST_UPDATED, numTs);
  updateLastUpdatedUI();
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
    if (typeof triggerCloudSync === 'function') {
      triggerCloudSync();
    }
  }
  if (!saved && typeof showToast === 'function') {
    showToast('Atenção: verifique se o navegador bloqueia dados locais.', 'error');
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
    if (typeof triggerCloudSync === 'function') {
      triggerCloudSync();
    }
  }
  if (!saved && typeof showToast === 'function') {
    showToast('Atenção: verifique se o navegador bloqueia dados locais.', 'error');
  }
  return saved;
}

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
  shouldPropagate = true
} = {}) {
  const descVal = (description || '').toString().trim();
  const valNum = Number(value) || 0;
  const installmentRaw = (installment || '-').toString().trim();
  const currentMonth = Number(monthIndex) || 0;
  const currentYear = Number(year) || new Date().getFullYear();
  const typeNorm = normalizeCategoryType(categoryType);
  const isFixedOrVariable = (typeNorm === 'Conta Fixa' || typeNorm === 'Variável Prevista' || typeNorm === 'Receita' || typeNorm === 'Repasse');
  const fractionMatch = installmentRaw.match(/^(\d+)\s*\/\s*(\d+)$/);

  // ===========================================================================
  // 1. REGRA PARA CONTAS FIXAS E VARIÁVEIS PREVISTAS:
  // Se o lançamento for uma Conta Fixa ou Variável Prevista e o usuário confirmar a propagação:
  // O laço de repetição (loop) deve iterar apenas até Dezembro do ano atual.
  // A lógica deve ser: gerar os lançamentos do mês seguinte (currentMonth + 1) até o índice 11 (Dezembro).
  // O ano (year) permanece estritamente o ano selecionado no momento da criação, sem avançar para o próximo ano.
  // ===========================================================================
  if (isFixedOrVariable && !fractionMatch) {
    if (!shouldPropagate) {
      // Salva o lançamento apenas no mês selecionado, sem repetição
      return [{
        id: 'lanc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        groupId: null,
        categoryId: categoryId || null,
        categoryName: categoryName.trim(),
        categoryType: typeNorm,
        year: currentYear,
        monthIndex: ((currentMonth % 12) + 12) % 12,
        description: descVal,
        installment: installmentRaw || '-',
        value: valNum,
        isPaid: Boolean(isPaid)
      }];
    }

    const groupId = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const result = [{
      id: 'lanc_' + Date.now() + '_0_' + Math.random().toString(36).substring(2, 6),
      groupId,
      categoryId: categoryId || null,
      categoryName: categoryName.trim(),
      categoryType: typeNorm,
      year: currentYear,
      monthIndex: currentMonth,
      description: descVal,
      installment: installmentRaw || '-',
      value: valNum,
      isPaid: Boolean(isPaid)
    }];

    // Gera os lançamentos do mês seguinte (currentMonth + 1) até o índice 11 (Dezembro) do ano atual
    for (let m = currentMonth + 1; m <= 11; m++) {
      result.push({
        id: 'lanc_' + Date.now() + '_' + (m - currentMonth) + '_' + Math.random().toString(36).substring(2, 6),
        groupId,
        categoryId: categoryId || null,
        categoryName: categoryName.trim(),
        categoryType: typeNorm,
        year: currentYear,
        monthIndex: m,
        description: descVal,
        installment: installmentRaw || '-',
        value: valNum,
        isPaid: false
      });
    }
    return result;
  }

  // ===========================================================================
  // 2. REGRA PARA CONTAS PARCELADAS (MANTÉM-SE A VIRADA DE ANO):
  // Se o lançamento for uma compra parcelada (ex: o campo parcela contém "1/5"):
  // Mantenha a lógica matemática atual que cruza os anos.
  // O laço de repetição deve rodar baseado no número total de parcelas restantes.
  // Use a matemática de targetMonth = (currentMonth + i) % 12 e targetYear = currentYear + Math.floor((currentMonth + i) / 12)
  // para garantir que as parcelas invadam os meses e anos seguintes corretamente.
  // ===========================================================================
  if (fractionMatch) {
    if (!shouldPropagate && isFixedOrVariable) {
      return [{
        id: 'lanc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        groupId: null,
        categoryId: categoryId || null,
        categoryName: categoryName.trim(),
        categoryType: typeNorm,
        year: currentYear,
        monthIndex: ((currentMonth % 12) + 12) % 12,
        description: descVal,
        installment: installmentRaw || '-',
        value: valNum,
        isPaid: Boolean(isPaid)
      }];
    }

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
        categoryId: categoryId || null,
        categoryName: categoryName.trim(),
        categoryType: typeNorm,
        year: targetYear,
        monthIndex: targetMonth,
        description: descVal,
        installment: `${p}/${totalInst}`,
        value: valNum,
        isPaid: Boolean(isPaid && i === 0)
      });
    }
    return result;
  }

  // Lançamento avulso
  return [{
    id: 'lanc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    groupId: null,
    categoryId: categoryId || null,
    categoryName: categoryName.trim(),
    categoryType: typeNorm,
    year: currentYear,
    monthIndex: ((currentMonth % 12) + 12) % 12,
    description: descVal,
    installment: installmentRaw || '-',
    value: valNum,
    isPaid: Boolean(isPaid)
  }];
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
    // Exclui o item alvo e todas as ocorrências FUTURAS do mesmo grupo
    const remaining = transactions.filter(item => {
      if (item.id === target.id) return false;

      const itemAbsoluteTime = (Number(item.year) * 12) + Number(item.monthIndex);

      if (target.groupId && item.groupId === target.groupId && itemAbsoluteTime > targetAbsoluteTime) {
        return false;
      }

      if (!target.groupId && target.installment && target.installment.includes('/')) {
        if (item.categoryName.toLowerCase() === target.categoryName.toLowerCase() &&
            item.description.toLowerCase() === target.description.toLowerCase() &&
            itemAbsoluteTime > targetAbsoluteTime) {
          return false;
        }
      }

      return true;
    });

    return {
      transactions: remaining,
      deletedCount: transactions.length - remaining.length,
      deletedTarget: target
    };
  } else {
    // Exclui apenas o lançamento atual
    const remaining = transactions.filter(item => item.id !== target.id);
    return {
      transactions: remaining,
      deletedCount: 1,
      deletedTarget: target
    };
  }
}

/**
 * EDIÇÃO EM CASCATA COM SUPORTE A GROUPID E TRANSIÇÃO DE ANOS:
 * @param {Array<Object>} transactions Lista de lançamentos
 * @param {string} transactionId ID do lançamento a editar
 * @param {Object} newValues Novos valores { description, value, installment }
 * @param {boolean} shouldPropagateToFuture Se true (confirmou), aplica nos meses seguintes do mesmo groupId
 * @returns {{ transactions: Array<Object>, updatedCount: number }}
 */
function updateTransactionCascade(transactions = [], transactionId, { description, value, installment } = {}, shouldPropagateToFuture = false) {
  const target = transactions.find(t => t.id === transactionId);
  if (!target) {
    return { transactions: [...transactions], updatedCount: 0 };
  }

  // Identifica categoria e se é Conta Fixa ou Variável Prevista (e não compra parcelada)
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
  let updatedCount = 0;

  const updatedTransactions = transactions.map(item => {
    // Se deve propagar e pertence ao mesmo groupId
    if (shouldPropagateToFuture && target.groupId && item.groupId === target.groupId) {
      const itemYear = Number(item.year);
      const itemMonth = Number(item.monthIndex);

      let shouldUpdate = false;
      if (isFixedOrVariable) {
        // Regra para Contas Fixas e Variáveis: limita estritamente até Dezembro do ano atual
        shouldUpdate = (itemYear === targetYear && itemMonth >= targetMonth && itemMonth <= 11);
      } else {
        // Regra para Compras Parceladas: permite avançar para os meses e anos seguintes
        const itemAbsoluteTime = (itemYear * 12) + itemMonth;
        shouldUpdate = (itemAbsoluteTime >= targetAbsoluteTime);
      }

      if (shouldUpdate) {
        updatedCount++;
        return {
          ...item,
          description: description !== undefined ? description : item.description,
          value: value !== undefined ? Number(value) : item.value,
          installment: (item.id === target.id && installment !== undefined) ? installment : item.installment
        };
      }
    }

    // Se é apenas o item alvo
    if (item.id === target.id) {
      updatedCount++;
      return {
        ...item,
        description: description !== undefined ? description : item.description,
        value: value !== undefined ? Number(value) : item.value,
        installment: installment !== undefined ? installment : item.installment
      };
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

        if (type === 'Receita') {
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

// =============================================================================
// 5. ESTADO GLOBAL DA APLICAÇÃO
// =============================================================================
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
  selectedTypeFilters: new Set()     // tipos selecionados no Drawer de Filtros
};

// =============================================================================
// 6. CACHE DE ELEMENTOS DO DOM
// =============================================================================
const DOM = {
  headerTitle: document.getElementById('headerTitle'),
  fixedNavLinks: document.querySelectorAll('.nav-link[data-route]'),
  dynamicCategorySections: document.getElementById('dynamicCategorySections'),
  mobileToggle: document.getElementById('mobileToggle') || document.getElementById('btnMenuToggle'),
  btnMenuToggle: document.getElementById('btnMenuToggle'),
  sidebarOverlay: document.getElementById('sidebarOverlay'),
  sidebar: document.getElementById('sidebar'),
  toastContainer: document.getElementById('toast-container') || document.getElementById('toastContainer'),

  // Seletor de Ano no Header
  yearDisplay: document.getElementById('yearDisplay'),
  btnPrevYear: document.getElementById('btnPrevYear'),
  btnNextYear: document.getElementById('btnNextYear'),

  // Views SPA
  viewDashboard: document.getElementById('viewDashboard'),
  viewConfiguracoes: document.getElementById('viewConfiguracoes'),
  viewCategoryDetail: document.getElementById('viewCategoryDetail'),

  // Dashboard
  dashMonthLabel: document.getElementById('dashMonthLabel'),
  dashboardMetrics: document.getElementById('dashboardMetrics'),
  dashMonthTabsBar: document.getElementById('dashMonthTabsBar'),
  dashboardSheetsWrapper: document.getElementById('dashboardSheetsWrapper'),
  dashboardTablesContainer: document.getElementById('dashboardTablesContainer'),
  dashCategoryCount: document.getElementById('dashCategoryCount'),
  btnGoToConfig: document.getElementById('btnGoToConfig'),
  btnAbrirFiltros: document.getElementById('btnAbrirFiltros'),

  // Drawer de Filtros
  overlayFiltros: document.getElementById('overlayFiltros'),
  drawerFiltros: document.getElementById('drawerFiltros'),
  btnFecharFiltros: document.getElementById('btnFecharFiltros'),
  drawerTiposList: document.getElementById('drawerTiposList'),
  btnLimparFiltros: document.getElementById('btnLimparFiltros'),
  btnConcluidoFiltros: document.getElementById('btnConcluidoFiltros'),

  // Configurações
  categoryForm: document.getElementById('categoryForm'),
  categoryNameInput: document.getElementById('categoryName'),
  categoryTypeSelect: document.getElementById('categoryType'),
  categoryTableBody: document.getElementById('categoryTableBody'),
  emptyState: document.getElementById('emptyState'),
  categoryCountLabel: document.getElementById('categoryCountLabel'),
  nameError: document.getElementById('nameError'),
  typeError: document.getElementById('typeError'),
  storageStatusBadge: document.getElementById('storageStatusBadge'),
  btnExportBackup: document.getElementById('btnExportBackup'),
  importBackupInput: document.getElementById('importBackupInput'),
  btnClearAllData: document.getElementById('btnClearAllData'),

  // Sincronização na Nuvem (JSONBin)
  jsonbinApiKey: document.getElementById('jsonbinApiKey'),
  jsonbinBinId: document.getElementById('jsonbinBinId'),
  btnSaveCloudCreds: document.getElementById('btnSaveCloudCreds'),
  btnSyncToCloud: document.getElementById('btnSyncToCloud'),
  btnSyncFromCloud: document.getElementById('btnSyncFromCloud'),
  cloudStatusBadge: document.getElementById('cloudStatusBadge'),
  cloudLastUpdatedText: document.getElementById('cloudLastUpdatedText'),
  cloudStatus: document.getElementById('cloudStatus'),

  // Categoria & Lançamentos
  catHeaderName: document.getElementById('catHeaderName'),
  catHeaderBadge: document.getElementById('catHeaderBadge'),
  monthTabsBar: document.getElementById('monthTabsBar'),
  transactionForm: document.getElementById('transactionForm'),
  transDescriptionInput: document.getElementById('transDescription'),
  transInstallmentInput: document.getElementById('transInstallment'),
  transValueInput: document.getElementById('transValue'),
  transDescError: document.getElementById('transDescError'),
  transInstallmentError: document.getElementById('transInstallmentError'),
  transValueError: document.getElementById('transValueError'),
  btnAddTransaction: document.getElementById('btnAddTransaction'),
  btnSubmitTransText: document.getElementById('btnSubmitTransText'),
  btnCancelEdit: document.getElementById('btnCancelEdit'),
  transactionTable: document.getElementById('transactionTable'),
  transactionTableBody: document.getElementById('transactionTableBody'),
  transactionTableFoot: document.getElementById('transactionTableFoot'),
  transTotalValue: document.getElementById('transTotalValue'),
  transCountLabel: document.getElementById('transCountLabel'),
  emptyTransState: document.getElementById('emptyTransState'),
  filtroTipoCompra: document.getElementById('filtroTipoCompra')
};

// =============================================================================
// 7. FEEDBACK VISUAL & UTILITÁRIOS
// =============================================================================

/**
 * Exibe notificação flutuante (Toast) adaptada ao Dark Mode.
 * @param {string} message Texto da notificação
 * @param {'success'|'error'|'info'} type Tipo do alerta
 */
function showToast(message, type = 'success') {
  const container = DOM.toastContainer || document.getElementById('toast-container') || document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  toast.innerHTML = `${icon}<span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  // Remove automaticamente ao fim de 3 segundos com animação suave de saída
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, 3000);
}

// Disponibilidade global conforme especificação
window.showToast = showToast;

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
    return; // Permite que o usuário digite ou apague apenas o sinal de menos livremente
  }

  // 1. Detecta sinal negativo
  const isNegative = rawValue.includes('-');

  // 2. Extrai apenas dígitos
  const digits = rawValue.replace(/\D/g, '');

  if (!digits || digits === '0') {
    input.value = isNegative ? '-R$ 0,00' : 'R$ 0,00';
    return;
  }

  // 3. Divide o número resultante por 100 para criar os centavos
  const valor = parseFloat(digits) / 100;

  // 4. Formata usando Intl.NumberFormat
  let valorFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);

  // 5. Se houver sinal de menos, reaplica o '-' na frente da string formatada
  if (isNegative) {
    valorFormatado = '-' + valorFormatado.replace(/^-/, '');
  }

  // 6. Atualiza o value do input com a string resultante
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

  // Identifica se há sinal negativo
  const isNegative = valorFormatado.includes('-');

  // 1. Remove "R$", espaços e pontos separadores de milhar
  let limpo = valorFormatado
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '');

  // 2. Troca a vírgula decimal por ponto
  limpo = limpo.replace(',', '.');

  // 3. Converte para float mantendo o sinal negativo
  let valorFloat = parseFloat(limpo);

  if (isNaN(valorFloat)) {
    return 0;
  }

  if (isNegative && valorFloat > 0) {
    valorFloat = -valorFloat;
  }

  return valorFloat;
}

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =============================================================================
// 8. ROTEADOR SPA
// =============================================================================

function closeMobileSidebar() {
  if (DOM.sidebar) {
    DOM.sidebar.classList.remove('sidebar-open');
    DOM.sidebar.classList.remove('open');
  }
  if (DOM.sidebarOverlay) {
    DOM.sidebarOverlay.classList.remove('active');
  }
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

  DOM.viewDashboard.classList.remove('active');
  DOM.viewConfiguracoes.classList.remove('active');
  DOM.viewCategoryDetail.classList.remove('active');

  if (route === 'dashboard') {
    DOM.headerTitle.textContent = 'Dashboard';
    DOM.viewDashboard.classList.add('active');
    renderDashboard();
  } else if (route === 'configuracoes') {
    DOM.headerTitle.textContent = 'Configurações';
    DOM.viewConfiguracoes.classList.add('active');
    renderCategoryTable();
    loadCloudCredentials();
  } else if (route === 'category' && categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (category) {
      DOM.headerTitle.textContent = category.name;
      DOM.viewCategoryDetail.classList.add('active');
      setupCategoryDetailView(category);
    } else {
      navigateTo('configuracoes');
    }
  }

  if (window.innerWidth <= 768) {
    DOM.sidebar.classList.remove('open');
  }
}

function resetAllForms() {
  cancelEditingTransaction();

  if (DOM.categoryForm) DOM.categoryForm.reset();
  if (DOM.transactionForm) DOM.transactionForm.reset();

  DOM.nameError.textContent = '';
  DOM.typeError.textContent = '';
  DOM.categoryNameInput.style.borderColor = '';
  DOM.categoryTypeSelect.style.borderColor = '';

  DOM.transDescError.textContent = '';
  DOM.transInstallmentError.textContent = '';
  DOM.transValueError.textContent = '';
  DOM.transDescriptionInput.style.borderColor = '';
  DOM.transInstallmentInput.style.borderColor = '';
  DOM.transValueInput.style.borderColor = '';
}

// =============================================================================
// 9. CONTROLE DE ANO (HEADER)
// =============================================================================

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

// =============================================================================
// 10. DASHBOARD (COM FILTRO DE MÊS E ANO)
// =============================================================================

function renderDashboard() {
  const currentMonth = Number(AppState.selectedMonthIndex);
  const currentYear = Number(AppState.selectedYear);
  const monthName = MONTH_NAMES[currentMonth];
  DOM.dashMonthLabel.textContent = `Mês de referência: ${monthName} de ${currentYear} • ${AppState.categories.length} categorias cadastradas`;

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

  if (DOM.dashCategoryCount) {
    DOM.dashCategoryCount.textContent = `${AppState.categories.length} ${AppState.categories.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}`;
  }

  // 2. Renderiza as Tabelas no formato Planilha
  renderDashboardTables(currentMonth, currentYear);
}

/**
 * Renderiza o layout de planilha financeira: tabelas empilhadas verticalmente por Tipo
 * @param {number} currentMonth 
 * @param {number} currentYear 
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

  // Outras categorias que não casaram com os tipos padrão (se existirem)
  const remainingCategories = AppState.categories.filter(c => !processedCategoryIds.has(c.id));
  if (remainingCategories.length > 0) {
    renderSpreadsheetBlock('Outras Despesas', 'Outras Despesas', remainingCategories, false, currentMonth, currentYear);
  }

  // Aplica os filtros avançados de tipo (Drawer)
  applyTypeFilters();
}

/**
 * Constrói uma tabela individual de bloco de planilha para um determinado Tipo de Categoria
 * @param {string} typeId
 * @param {string} groupTitle 
 * @param {Array} categories 
 * @param {boolean} isRevenue 
 * @param {number} currentMonth 
 * @param {number} currentYear 
 */
function renderSpreadsheetBlock(typeId, groupTitle, categories, isRevenue, currentMonth, currentYear) {
  let blockTotal = 0;

  const card = document.createElement('div');
  card.className = 'sheet-table-card';
  card.setAttribute('data-type-id', typeId || groupTitle);
  card.setAttribute('data-type-label', groupTitle);

  const table = document.createElement('table');
  table.className = 'sheet-table';

  // Cabeçalho do Tipo e Cabeçalho das Colunas
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
    // Filtra lançamentos da categoria no Mês e Ano selecionados
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

    // Navegação ao clicar no nome da categoria
    tr.querySelector('.sheet-cat-btn').addEventListener('click', () => {
      navigateTo('category', cat.id);
    });

    // Checkbox de Situação: atualiza todos os lançamentos da categoria no mês/ano ativo
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

  // Rodapé (Subtotal com destaque tipográfico)
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

// =============================================================================
// 10.1 MENU LATERAL (DRAWER) DE FILTROS AVANÇADOS
// =============================================================================

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

  // Atualiza visual do botão "Filtros"
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

    // Se NENHUM checkbox estiver marcado, exibe TODAS as tabelas e blocos no Dashboard
    if (selectedTypes.size === 0) {
      card.style.display = '';
    } else {
      // Se um ou mais checkboxes estiverem marcados, exibe APENAS os blocos de Tipo correspondentes
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

// =============================================================================
// 11. RECONSTRUÇÃO DA SIDEBAR
// =============================================================================

function rebuildSidebar() {
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

// =============================================================================
// 12. TELA DE CONFIGURAÇÕES - CRUD & BACKUP
// =============================================================================

function renderCategoryTable() {
  const categories = AppState.categories;
  DOM.categoryTableBody.innerHTML = '';

  if (categories.length === 0) {
    DOM.categoryCountLabel.textContent = 'Nenhuma categoria cadastrada';
    DOM.emptyState.style.display = 'flex';
    return;
  }

  DOM.emptyState.style.display = 'none';
  DOM.categoryCountLabel.textContent = `${categories.length} ${categories.length === 1 ? 'categoria registrada' : 'categorias registradas'}`;

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
    // Lançamento legado sem categoryId: só remove se casar nome e tipo
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
  DOM.nameError.textContent = '';
  DOM.typeError.textContent = '';
  DOM.categoryNameInput.style.borderColor = '';
  DOM.categoryTypeSelect.style.borderColor = '';

  const nameVal = DOM.categoryNameInput.value.trim();
  const typeVal = DOM.categoryTypeSelect.value;
  let hasError = false;

  if (!nameVal) {
    DOM.nameError.textContent = 'Informe o nome da categoria.';
    DOM.categoryNameInput.style.borderColor = 'var(--danger)';
    hasError = true;
  } else if (nameVal.length < 2) {
    DOM.nameError.textContent = 'O nome deve ter pelo menos 2 caracteres.';
    DOM.categoryNameInput.style.borderColor = 'var(--danger)';
    hasError = true;
  }

  if (!typeVal) {
    DOM.typeError.textContent = 'Selecione um tipo válido.';
    DOM.categoryTypeSelect.style.borderColor = 'var(--danger)';
    hasError = true;
  }

  // Validação de duplicados: só bloqueia se NOME e TIPO forem exatamente iguais
  if (!hasError && nameVal && typeVal) {
    const normType = normalizeCategoryType(typeVal);
    const isDuplicate = AppState.categories.some(
      c => c.name.toLowerCase() === nameVal.toLowerCase() &&
           normalizeCategoryType(c.type).toLowerCase() === normType.toLowerCase()
    );
    if (isDuplicate) {
      DOM.nameError.textContent = `A categoria "${nameVal}" já existe para o tipo "${normType}".`;
      DOM.categoryNameInput.style.borderColor = 'var(--danger)';
      hasError = true;
    }
  }

  if (hasError) return;

  addCategory(nameVal, typeVal);

  DOM.categoryNameInput.value = '';
  DOM.categoryTypeSelect.selectedIndex = 0;
  DOM.categoryNameInput.focus();
}

function exportBackup() {
  const backupData = {
    versao: '2.3',
    dataExportacao: new Date().toISOString(),
    lastUpdated: AppState.lastUpdated || Date.now(),
    categorias: AppState.categories,
    lancamentos: AppState.transactions
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

      if (!Array.isArray(incomingCats)) {
        showToast('Arquivo de backup inválido.', 'error');
        return;
      }

      AppState.categories = incomingCats.map((c, i) => normalizeCategory(c, i));
      AppState.transactions = incomingTrans.map((t, i) => normalizeTransaction(t, i));

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

// =============================================================================
// 12.0 ZONA DE PERIGO - EXCLUSÃO DE DADOS LOCAIS
// =============================================================================

let isResettingData = false;

/**
 * Trava de Segurança e Exclusão Irreversível de Dados Locais:
 * Exige que o usuário digite "APAGAR" em um prompt nativo.
 * Limpa apenas as chaves do sistema no localStorage e recarrega a página.
 */
function clearAllLocalData() {
  const userInput = window.prompt(
    "Esta ação é irreversível. Para confirmar a exclusão de TODOS os dados locais, digite a palavra APAGAR:"
  );

  if (userInput && userInput.trim().toUpperCase() === "APAGAR") {
    // Sinaliza para evitar que beforeunload ressalve os estados
    isResettingData = true;

    // Remove do localStorage apenas as chaves específicas do sistema
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);

    // Remove também do sessionStorage de fallback
    sessionStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    sessionStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    sessionStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);

    // Esvazia os arrays de estado em memória
    AppState.categories = [];
    AppState.transactions = [];
    AppState.lastUpdated = 0;

    showToast('Dados apagados com sucesso. O sistema será reiniciado.', 'success');
    setTimeout(() => window.location.reload(), 1200);
  } else {
    showToast('Ação cancelada. Seus dados estão seguros.', 'info');
  }
}

// =============================================================================
// 12.1 SINCRONIZAÇÃO NA NUVEM (JSONBIN.IO REST API)
// =============================================================================

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
    // Trava de Segurança no Upload:
    // Se o Bin ID já existir, realiza um GET silencioso para checar a versão na nuvem
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
      lancamentos: AppState.transactions
    };

    if (!binId) {
      // POST: Cria um novo Bin se não possuir Bin ID
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
      // PUT: Atualiza o Bin existente
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

    if (!Array.isArray(incomingCats)) {
      throw new Error('A estrutura dos dados na nuvem é inválida (categorias ausentes ou formato incorreto).');
    }

    const cloudLastUpdated = Number(record.lastUpdated) || 0;
    const localLastUpdated = Number(AppState.lastUpdated) || 0;

    // Trava de Segurança no Download:
    // Se o lastUpdated local for MAIOR que o da nuvem, alerta o usuário antes de sobrescrever
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

    saveCategories(AppState.categories, true);
    saveTransactions(AppState.transactions, true);

    touchLastUpdated(cloudLastUpdated || Date.now());

    localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, apiKey);
    localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, binId);

    rebuildSidebar();
    renderCategoryTable();
    renderDashboard();

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

// =============================================================================
// 12.2 SINCRONIZAÇÃO AUTOMÁTICA EM SEGUNDO PLANO (AUTO-SAVE COM DEBOUNCE)
// =============================================================================

/**
 * 1. Mecanismo de Debounce (Prevenção de Spam na API REST)
 * Atraso (delay) padrão configurado para 3000ms (3 segundos).
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
 * 3. Feedback Visual Discreto (UI):
 * Atualiza o indicador #cloudStatus no cabeçalho
 * - 'syncing' -> "🔄 A sincronizar..." (amarelo/laranja)
 * - 'synced' -> "☁️ Nuvem Atualizada" (verde)
 * - 'error' -> "⚠️ Erro na Nuvem" (vermelho)
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

/**
 * Executa a sincronização PUT em segundo plano para o JSONBin.io
 * Blindada contra race conditions e sobrescrita de versões mais novas da nuvem.
 */
async function executeAutoCloudSync() {
  const apiKey = (localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  // Condição: Só executa se API Key e Bin ID já estiverem configurados e guardados
  if (!apiKey || !binId) {
    return;
  }

  try {
    // 1. Verificação prévia de conflito silenciosa (Silent Version Check)
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

      // Se a nuvem tiver dados mais recentes, NÃO sobrescreve no background!
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
      lancamentos: AppState.transactions
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

/**
 * 2. Gatilho Automático (Auto-Save):
 * Envolvido pelo debounce de 3000ms. Disparado no final de operações que alteram o localStorage.
 */
function triggerCloudSync() {
  const apiKey = (localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  // Condição: Só executa se a API Key e o Bin ID já estiverem configurados e guardados no sistema
  if (!apiKey || !binId) {
    return;
  }

  // Quando o triggerCloudSync começar a contar os 3 segundos ou estiver a fazer o request HTTP,
  // muda o texto para "🔄 A sincronizar..." e altera a cor para amarelo/laranja
  setCloudStatus('syncing', '🔄 A sincronizar...');

  debouncedAutoCloudSync();
}

// =============================================================================
// 13. TELA DA CATEGORIA & CONTROLE DE ABAS DE MESES E ANOS
// =============================================================================

function setActiveMonth(monthIndex) {
  AppState.selectedMonthIndex = Number(monthIndex);

  // Sincroniza abas na tela de categoria
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

  // Sincroniza abas no Dashboard
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
  const typeConfig = CATEGORY_TYPES.find(t => t.id === category.type) || { badgeClass: 'badge-variavel' };
  
  DOM.catHeaderName.textContent = category.name;
  DOM.catHeaderBadge.textContent = category.type;
  DOM.catHeaderBadge.className = `badge ${typeConfig.badgeClass}`;

  if (DOM.filtroTipoCompra) {
    DOM.filtroTipoCompra.value = 'todos';
  }

  setActiveMonth(AppState.selectedMonthIndex);

  // Autofocus no campo "Descrição" ao abrir o formulário de lançamento
  setTimeout(() => {
    DOM.transDescriptionInput?.focus();
  }, 60);
}

function updateMonthTotal() {
  const activeCategory = AppState.categories.find(c => c.id === AppState.activeCategoryId);
  if (!activeCategory) return;

  const currentMonth = Number(AppState.selectedMonthIndex);
  const currentYear = Number(AppState.selectedYear);

  const filtered = AppState.transactions.filter(t => {
    const matchCat = t.categoryId ? (t.categoryId === activeCategory.id) : (t.categoryName.trim().toLowerCase() === activeCategory.name.trim().toLowerCase());
    return matchCat && Number(t.monthIndex) === currentMonth && Number(t.year) === currentYear;
  });

  const totalSum = filtered.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  DOM.transTotalValue.textContent = formatCurrency(totalSum);
}

/**
 * Inicia o Modo de Edição Completa para um lançamento
 * @param {string} id 
 */
function startEditingTransaction(id) {
  const t = AppState.transactions.find(item => item.id === id);
  if (!t) return;

  AppState.editingTransactionId = t.id;

  // Preenche os campos do formulário
  DOM.transDescriptionInput.value = t.description;
  DOM.transInstallmentInput.value = (t.installment && t.installment !== '-') ? t.installment : '';
  DOM.transValueInput.value = formatCurrency(Number(t.value));

  // Altera texto do botão e exibe botão Cancelar
  if (DOM.btnSubmitTransText) {
    DOM.btnSubmitTransText.textContent = 'Salvar Alteração';
  }
  if (DOM.btnCancelEdit) {
    DOM.btnCancelEdit.style.display = 'inline-flex';
  }

  // Foco no campo de descrição
  DOM.transDescriptionInput.focus();
  DOM.transactionForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  showToast(`Editando "${t.description}"...`);
}

/**
 * Cancela o Modo de Edição e restaura o formulário
 */
function cancelEditingTransaction() {
  AppState.editingTransactionId = null;

  if (DOM.transDescriptionInput) DOM.transDescriptionInput.value = '';
  if (DOM.transInstallmentInput) DOM.transInstallmentInput.value = '';
  if (DOM.transValueInput) DOM.transValueInput.value = '';

  if (DOM.btnSubmitTransText) {
    DOM.btnSubmitTransText.textContent = 'Adicionar Lançamento';
  }
  if (DOM.btnCancelEdit) {
    DOM.btnCancelEdit.style.display = 'none';
  }

  if (DOM.transDescError) DOM.transDescError.textContent = '';
  if (DOM.transInstallmentError) DOM.transInstallmentError.textContent = '';
  if (DOM.transValueError) DOM.transValueError.textContent = '';
  if (DOM.transDescriptionInput) DOM.transDescriptionInput.style.borderColor = '';
  if (DOM.transInstallmentInput) DOM.transInstallmentInput.style.borderColor = '';
  if (DOM.transValueInput) DOM.transValueInput.style.borderColor = '';
}

/**
 * Renderiza a tabela de lançamentos filtrada pelo monthIndex E year selecionados
 */
function renderTransactionsTable() {
  const activeCategory = AppState.categories.find(c => c.id === AppState.activeCategoryId);
  if (!activeCategory) return;

  const currentMonth = Number(AppState.selectedMonthIndex);
  const currentYear = Number(AppState.selectedYear);
  const categoryTypeNorm = normalizeCategoryType(activeCategory.type);
  const isFixedOrVariable = (categoryTypeNorm === 'Conta Fixa' || categoryTypeNorm === 'Variável Prevista' || categoryTypeNorm === 'Receita' || categoryTypeNorm === 'Repasse');

  const monthTransactions = AppState.transactions.filter(t => {
    const matchCat = t.categoryId ? (t.categoryId === activeCategory.id) : (t.categoryName.trim().toLowerCase() === activeCategory.name.trim().toLowerCase());
    return matchCat && Number(t.monthIndex) === currentMonth && Number(t.year) === currentYear;
  });

  // Filtro Dinâmico de Tipo de Compra:
  // - "unicas": parcela vazia, indefinida, nula ou estritamente igual a "-"
  // - "parceladas": parcela contém o caracter "/"
  // - "todos": todos os lançamentos
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
  DOM.transCountLabel.textContent = `${filteredTransactions.length} ${filteredTransactions.length === 1 ? 'lançamento' : 'lançamentos'} em ${MONTH_NAMES[currentMonth]} de ${currentYear}`;

  const tableWrapper = DOM.transactionTable 
    ? DOM.transactionTable.closest('.table-responsive') 
    : (DOM.transactionTableBody ? DOM.transactionTableBody.closest('.table-responsive') : null);

  if (filteredTransactions.length === 0) {
    // Não exibe a tabela vazia (oculta wrapper/cabeçalhos)
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
    DOM.transTotalValue.textContent = formatCurrency(0);
    return;
  }

  // Restaura exibição da tabela com dados
  if (tableWrapper) tableWrapper.style.display = 'block';
  if (DOM.emptyTransState) DOM.emptyTransState.style.display = 'none';
  DOM.transactionTableFoot.style.display = 'table-footer-group';

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
      <td class="desc-cell">${escapeHTML(t.description)}</td>
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
            if (propagateInline) {
              const res = updateTransactionCascade(
                AppState.transactions,
                t.id,
                { description: t.description, value: newVal, installment: t.installment },
                true
              );
              AppState.transactions = res.transactions;
            } else {
              t.value = newVal;
            }
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

  DOM.transTotalValue.textContent = formatCurrency(totalSum);
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

/**
 * Exclusão Inteligente de Lançamentos considerando Transição de Anos
 */
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

  // Se o item deletado estava em edição, cancela edição
  if (AppState.editingTransactionId === id) {
    cancelEditingTransaction();
  }

  saveTransactions(AppState.transactions);
  triggerCloudSync();
  renderTransactionsTable();
  renderDashboard();
}

/**
 * Submissão de Lançamento com Suporte Completo à Edição (Update) e Criação
 */
function handleTransactionSubmit(e) {
  e.preventDefault();

  DOM.transDescError.textContent = '';
  DOM.transInstallmentError.textContent = '';
  DOM.transValueError.textContent = '';
  DOM.transDescriptionInput.style.borderColor = '';
  DOM.transInstallmentInput.style.borderColor = '';
  DOM.transValueInput.style.borderColor = '';

  const activeCategory = AppState.categories.find(c => c.id === AppState.activeCategoryId);
  if (!activeCategory) return;

  const descVal = DOM.transDescriptionInput.value.trim();
  const installmentRaw = DOM.transInstallmentInput.value.trim();
  const valVal = DOM.transValueInput.value.trim();
  const valNum = parseCurrencyToFloat(valVal);
  let hasError = false;

  if (!descVal) {
    DOM.transDescError.textContent = 'Informe a descrição do lançamento.';
    DOM.transDescriptionInput.style.borderColor = 'var(--danger)';
    hasError = true;
  }

  if (!valVal || isNaN(valNum) || valNum === 0) {
    DOM.transValueError.textContent = 'Informe um valor válido diferente de zero.';
    DOM.transValueInput.style.borderColor = 'var(--danger)';
    hasError = true;
  }

  if (hasError) return;

  // ===========================================================================
  // MODO DE EDIÇÃO: Salva alterações no lançamento existente
  // ===========================================================================
  if (AppState.editingTransactionId) {
    const existingIndex = AppState.transactions.findIndex(item => item.id === AppState.editingTransactionId);

    if (existingIndex !== -1) {
      const existing = AppState.transactions[existingIndex];
      const hasGroupId = Boolean(existing.groupId);
      let propagateToFuture = false;

      if (hasGroupId) {
        propagateToFuture = window.confirm(
          "Deseja aplicar essa alteração (Valor/Descrição) também para os meses seguintes?"
        );
      }

      const result = updateTransactionCascade(
        AppState.transactions,
        AppState.editingTransactionId,
        { description: descVal, value: valNum, installment: installmentRaw || '-' },
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

  // ===========================================================================
  // MODO DE CRIAÇÃO: Novo Lançamento
  // ===========================================================================
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
    const generated = generateTransactionsMultiYear({
      description: descVal,
      value: valNum,
      installment: installmentRaw,
      monthIndex: currentMonth,
      year: currentYear,
      categoryId: activeCategory.id,
      categoryName: activeCategory.name,
      categoryType: activeCategory.type,
      isPaid: false,
      shouldPropagate: propagar
    });

    AppState.transactions.push(...generated);
    saveTransactions(AppState.transactions);
    triggerCloudSync();

    DOM.transDescriptionInput.value = '';
    DOM.transInstallmentInput.value = '';
    DOM.transValueInput.value = '';
    DOM.transDescriptionInput.focus();

    renderTransactionsTable();
    renderDashboard();

    if (generated.length > 1) {
      showToast(`Lançamento projetado com sucesso para os ${generated.length} meses seguintes!`);
    } else {
      showToast('Lançamento salvo com sucesso para o mês selecionado!');
    }
  } catch (err) {
    DOM.transInstallmentError.textContent = err.message || 'Erro no parcelamento.';
    DOM.transInstallmentInput.style.borderColor = 'var(--danger)';
  }
}

// =============================================================================
// 14. REGISTRO DE EVENTOS & INICIALIZAÇÃO
// =============================================================================

function setupEventListeners() {
  DOM.categoryForm.addEventListener('submit', handleCategorySubmit);
  DOM.transactionForm.addEventListener('submit', handleTransactionSubmit);

  // Botão Cancelar Edição
  if (DOM.btnCancelEdit) {
    DOM.btnCancelEdit.addEventListener('click', cancelEditingTransaction);
  }

  // Filtro Dinâmico de Tipo de Compra (Únicas vs Parceladas)
  if (DOM.filtroTipoCompra) {
    DOM.filtroTipoCompra.addEventListener('change', () => {
      renderTransactionsTable();
    });
  }

  // Seletor de Ano no Header (< 2026 >)
  if (DOM.btnPrevYear) {
    DOM.btnPrevYear.addEventListener('click', () => changeYear(-1));
  }
  if (DOM.btnNextYear) {
    DOM.btnNextYear.addEventListener('click', () => changeYear(1));
  }

  // Sistema de Abas de Meses (Jan a Dez) na Tela de Categoria
  if (DOM.monthTabsBar) {
    DOM.monthTabsBar.querySelectorAll('.month-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const month = parseInt(tab.getAttribute('data-month'), 10);
        setActiveMonth(month);
      });
    });
  }

  // Sistema de Abas de Meses (Jan a Dez) no Dashboard
  if (DOM.dashMonthTabsBar) {
    DOM.dashMonthTabsBar.querySelectorAll('.month-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const month = parseInt(tab.getAttribute('data-month'), 10);
        setActiveMonth(month);
      });
    });
  }

  // Menu Lateral (Drawer) de Filtros Avançados
  if (DOM.btnAbrirFiltros) {
    DOM.btnAbrirFiltros.addEventListener('click', openFiltersDrawer);
  }
  if (DOM.btnFecharFiltros) {
    DOM.btnFecharFiltros.addEventListener('click', closeFiltersDrawer);
  }
  if (DOM.btnConcluidoFiltros) {
    DOM.btnConcluidoFiltros.addEventListener('click', closeFiltersDrawer);
  }
  if (DOM.overlayFiltros) {
    DOM.overlayFiltros.addEventListener('click', closeFiltersDrawer);
  }
  if (DOM.btnLimparFiltros) {
    DOM.btnLimparFiltros.addEventListener('click', clearTypeFilters);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.drawerFiltros && DOM.drawerFiltros.classList.contains('open')) {
      closeFiltersDrawer();
    }
  });

  DOM.fixedNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      const route = link.getAttribute('data-route');
      navigateTo(route);
    });
  });

  if (DOM.btnGoToConfig) {
    DOM.btnGoToConfig.addEventListener('click', () => {
      navigateTo('configuracoes');
    });
  }

  if (DOM.btnExportBackup) {
    DOM.btnExportBackup.addEventListener('click', exportBackup);
  }

  if (DOM.importBackupInput) {
    DOM.importBackupInput.addEventListener('change', importBackup);
  }

  // Sincronização na Nuvem (JSONBin)
  if (DOM.btnSaveCloudCreds) {
    DOM.btnSaveCloudCreds.addEventListener('click', saveCloudCredentials);
  }
  if (DOM.btnSyncToCloud) {
    DOM.btnSyncToCloud.addEventListener('click', syncToCloud);
  }
  if (DOM.btnSyncFromCloud) {
    DOM.btnSyncFromCloud.addEventListener('click', syncFromCloud);
  }

  const toggleBtn = DOM.btnMenuToggle || DOM.mobileToggle;
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      DOM.sidebar.classList.toggle('sidebar-open');
      if (DOM.sidebarOverlay) {
        DOM.sidebarOverlay.classList.toggle('active');
      }
    });
  }

  if (DOM.sidebarOverlay) {
    DOM.sidebarOverlay.addEventListener('click', () => {
      DOM.sidebar.classList.remove('sidebar-open');
      DOM.sidebarOverlay.classList.remove('active');
    });
  }

  DOM.categoryNameInput.addEventListener('input', () => {
    DOM.nameError.textContent = '';
    DOM.categoryNameInput.style.borderColor = '';
  });

  DOM.categoryTypeSelect.addEventListener('change', () => {
    DOM.typeError.textContent = '';
    DOM.categoryTypeSelect.style.borderColor = '';
  });

  DOM.transDescriptionInput.addEventListener('input', () => {
    DOM.transDescError.textContent = '';
    DOM.transDescriptionInput.style.borderColor = '';
  });

  DOM.transInstallmentInput.addEventListener('input', () => {
    DOM.transInstallmentError.textContent = '';
    DOM.transInstallmentInput.style.borderColor = '';
  });

  DOM.transValueInput.addEventListener('input', (e) => {
    DOM.transValueError.textContent = '';
    DOM.transValueInput.style.borderColor = '';
    handleCurrencyInput(e);
  });

  // Botão Zona de Perigo - Apagar Todos os Dados
  if (DOM.btnClearAllData) {
    DOM.btnClearAllData.addEventListener('click', clearAllLocalData);
  }

  // Usabilidade de Teclado: Tecla ESC global para fechar formulários, cancelar edição e fechar menus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
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
  });
}

function init() {
  setupEventListeners();

  updateYearDisplay();
  loadCloudCredentials();

  if (DOM.storageStatusBadge) {
    if (StorageEngine.isAvailable) {
      DOM.storageStatusBadge.innerHTML = `<span class="status-dot"></span><span>Storage Ativo</span>`;
    } else {
      DOM.storageStatusBadge.style.color = 'var(--warning)';
      DOM.storageStatusBadge.innerHTML = `<span class="status-dot" style="background: var(--warning)"></span><span>Modo Sessão</span>`;
    }
  }

  rebuildSidebar();
  navigateTo('dashboard');
}

window.Financas = {
  STORAGE_KEYS,
  CATEGORY_TYPES,
  MONTH_NAMES,
  MONTH_SHORT,
  StorageEngine,
  normalizeCategoryType,
  normalizeCategory,
  normalizeTransaction,
  loadCategories,
  saveCategories,
  loadTransactions,
  saveTransactions,
  generateTransactionsMultiYear,
  deleteTransactionCascade,
  updateTransactionCascade,
  calculateTotalsByMonthAndYear,
  AppState,
  rebuildSidebar,
  navigateTo,
  setActiveMonth,
  changeYear,
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
  triggerCloudSync,
  handleCurrencyInput,
  parseCurrencyToFloat,
  showToast
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.Financas;
}

document.addEventListener('DOMContentLoaded', init);
