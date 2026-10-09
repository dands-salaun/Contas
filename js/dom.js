/**
 * =============================================================================
 * SISTEMA FINANCEIRO - CACHE & ACESSO A ELEMENTOS DO DOM
 * Getters dinâmicos para garantir resiliência e integridade das referências
 * =============================================================================
 */

const get = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);
const getAll = (sel) => (typeof document !== 'undefined' ? document.querySelectorAll(sel) : []);

export const DOM = {
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

