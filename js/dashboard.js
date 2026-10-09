/**
 * =============================================================================
 * SISTEMA FINANCEIRO - DASHBOARD CONSOLIDADO & DRAWER DE FILTROS
 * =============================================================================
 */

import { DOM } from './dom.js';
import { AppState } from './state.js';
import { CATEGORY_TYPES, MONTH_NAMES } from './constants.js';
import { normalizeCategoryType } from './normalization.js';
import { calculateTotalsByMonthAndYear } from './calculations.js';
import { formatCurrency, escapeHTML, showToast } from './utils.js';
import { saveTransactions } from './storage.js';
import { triggerCloudSync } from './cloud.js';
import { navigateTo } from './router.js';

export function renderDashboard() {
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
export function renderDashboardTables(currentMonth, currentYear) {
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
export function renderSpreadsheetBlock(typeId, groupTitle, categories, isRevenue, currentMonth, currentYear) {
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
export function renderDrawerTypeFilters() {
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
export function applyTypeFilters() {
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
export function clearTypeFilters() {
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
export function openFiltersDrawer() {
  renderDrawerTypeFilters();
  if (DOM.overlayFiltros) DOM.overlayFiltros.classList.add('open');
  if (DOM.drawerFiltros) DOM.drawerFiltros.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * Fecha o Menu Lateral (Drawer) de Filtros
 */
export function closeFiltersDrawer() {
  if (DOM.overlayFiltros) DOM.overlayFiltros.classList.remove('open');
  if (DOM.drawerFiltros) DOM.drawerFiltros.classList.remove('open');
  document.body.style.overflow = '';
}
