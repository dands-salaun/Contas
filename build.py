"""
=============================================================================
SISTEMA FINANCEIRO - SCRIPT DE COMPILAÇÃO / BUNDLER
=============================================================================
Compila os módulos independentes da pasta js/ em um único app.js autossuficiente,
permitindo abrir o index.html com duplo clique no Windows sem precisar de servidor.

Como usar:
    python build.py
=============================================================================
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JS_DIR = os.path.join(BASE_DIR, "js")
OUTPUT_FILE = os.path.join(BASE_DIR, "app.js")

MODULES_ORDER = [
    "constants.js",
    "dom.js",
    "normalization.js",
    "storage.js",
    "state.js",
    "utils.js",
    "calculations.js",
    "cloud.js",
    "router.js",
    "sidebar.js",
    "dashboard.js",
    "charts.js",
    "categories.js",
    "transactions.js",
]

def clean_module_code(content: str, filename: str) -> str:
    # Remove all ES6 imports (including multiline and side-effect imports)
    content = re.sub(r'import\s+(?:(?:\*\s+as\s+[\w$]+)|(?:\{[^}]*\}|[\w$]+))\s+from\s+[\'"][^\'"]+[\'"]\s*;?', '', content, flags=re.DOTALL)
    content = re.sub(r'import\s+[\'"][^\'"]+[\'"]\s*;?', '', content)
    # Remove named exports isolados (single ou multiline): export { ... };
    content = re.sub(r'export\s*\{[^}]*\}\s*;?', '', content, flags=re.DOTALL)

    lines = content.splitlines()
    cleaned = []
    
    for line in lines:
        stripped = line.strip()
        # Fallback para imports residuais de linha única
        if stripped.startswith("import ") and " from " in stripped:
            continue
        # Remove export default
        if stripped.startswith("export default "):
            line = line.replace("export default ", "")
        # Remove export const / export function / export let / export async function / export class
        line = re.sub(r"^export\s+(const|let|var|function|async\s+function|class)\s+", r"\1 ", line)
            
        cleaned.append(line)
        
    header = f"\n// --- MÓDULO: js/{filename} ---\n"
    return header + "\n".join(cleaned) + "\n"

def build():
    print("Compilando módulos de js/ para app.js...")
    bundled_parts = [
        "/**\n * SISTEMA FINANCEIRO - BUNDLE CONSOLIDADO\n * Gerado automaticamente a partir dos módulos em js/\n */\n(function() {\n'use strict';\n"
    ]
    
    for mod_name in MODULES_ORDER:
        path = os.path.join(JS_DIR, mod_name)
        if not os.path.exists(path):
            print(f"Aviso: Módulo {mod_name} não encontrado!")
            continue
        with open(path, "r", encoding="utf-8") as f:
            code = f.read()
        bundled_parts.append(clean_module_code(code, mod_name))
        
    # Adiciona a inicialização e os listeners
    init_code = """
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

  if (DOM.btnCancelEditCategory) {
    DOM.btnCancelEditCategory.addEventListener('click', cancelEditingCategory);
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
  if (DOM.modalChartsOverlay) {
    DOM.modalChartsOverlay.addEventListener('click', (e) => {
      if (e.target === DOM.modalChartsOverlay) closeChartsModal();
    });
  }
  if (DOM.chartMonthSelect) {
    DOM.chartMonthSelect.addEventListener('change', (e) => {
      onChartMonthChange(e.target.value);
    });
    DOM.chartMonthSelect.addEventListener('click', () => {
      if (DOM.chartMonthSelect.classList.contains('active') === false) {
        onChartMonthChange(DOM.chartMonthSelect.value);
      }
    });
  }
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
      cancelEditingCategory();
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
  importBackup,
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
  updateMonthTotal,
  isParcelada,
  renderCategoryTable,
  addCategory,
  deleteCategory,
  startEditingCategory,
  cancelEditingCategory,
  updateCategory,
  handleCategorySubmit,
  renderDashboard,
  renderDashboardMetrics,
  getFilteredCategoriesForDashboard,
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
"""
    bundled_parts.append(init_code)
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("".join(bundled_parts))
        
    print(f"Sucesso! {OUTPUT_FILE} gerado.")

if __name__ == "__main__":
    build()
