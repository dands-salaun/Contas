/**
 * =============================================================================
 * SISTEMA FINANCEIRO - VISUALIZAÇÃO GRÁFICA (MENSAL E ANUAL)
 * Gráficos em SVG puro (Donut Chart, Ranking de Barras e Evolução dos 12 Meses)
 * 100% nativo, zero dependências externas, compatível com file:/// e offline.
 * =============================================================================
 */

import { DOM } from './dom.js';
import { AppState } from './state.js';
import { CATEGORY_TYPES, MONTH_NAMES, MONTH_SHORT } from './constants.js';
import { formatCurrency, escapeHTML } from './utils.js';
import { normalizeCategoryType } from './normalization.js';

export const CHART_PALETTE = [
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
export function createCategoryResolver(categories = []) {
  const catIdMap = new Map();
  const catCompositeMap = new Map();
  const catNameMap = new Map();

  (categories || []).forEach(c => {
    if (c.id) catIdMap.set(String(c.id), c);
    if (c.name) {
      const nameKey = String(c.name).trim().toLowerCase();
      const typeKey = normalizeCategoryType(c.type).toLowerCase();
      catCompositeMap.set(`${nameKey}__${typeKey}`, c);
      if (!catNameMap.has(nameKey)) {
        catNameMap.set(nameKey, c);
      }
    }
  });

  return (t) => {
    if (t.categoryId && catIdMap.has(String(t.categoryId))) {
      return catIdMap.get(String(t.categoryId));
    }
    if (t.categoryName) {
      const nameKey = String(t.categoryName).trim().toLowerCase();
      if (t.categoryType) {
        const typeKey = normalizeCategoryType(t.categoryType).toLowerCase();
        const comp = catCompositeMap.get(`${nameKey}__${typeKey}`);
        if (comp) return comp;
      }
      return catNameMap.get(nameKey) || null;
    }
    return null;
  };
}

export function calculateExpensesChartData(transactions, categories, {
  periodMode = 'month',
  groupMode = 'category',
  monthIndex = AppState.selectedMonthIndex,
  year = AppState.selectedYear
} = {}) {
  const targetYear = Number(year);
  const targetMonth = Number(monthIndex);
  const resolveCategory = createCategoryResolver(categories);

  // Filtra transações do ano e (opcionalmente) do mês selecionado
  const filtered = (transactions || []).filter(t => {
    if (Number(t.year) !== targetYear) return false;
    if (periodMode === 'month' && Number(t.monthIndex) !== targetMonth) return false;

    const val = Number(t.value) || 0;
    if (val === 0) return false;

    const cat = resolveCategory(t);
    const rawType = cat ? cat.type : t.categoryType;
    const normType = rawType ? normalizeCategoryType(rawType) : null;
    const typeConfig = normType ? CATEGORY_TYPES.find(ct => ct.id === normType) : null;
    const isRev = typeConfig 
      ? Boolean(typeConfig.isRevenue) 
      : Boolean(t.isRevenue === true || normType === 'Receita' || normType === 'Repasse');

    if (isRev) return false;
    return true;
  });

  // Agrupamento por Categoria, Tipo de Conta ou Tag
  const groups = new Map();

  filtered.forEach(t => {
    const val = Number(t.value) || 0;
    const cat = resolveCategory(t);

    let key = '';
    let label = '';

    if (groupMode === 'category') {
      key = cat ? String(cat.id) : (t.categoryName ? String(t.categoryName).trim() : 'Outros');
      label = cat ? cat.name : (t.categoryName ? String(t.categoryName).trim() : 'Outros');
    } else if (groupMode === 'type') {
      const rawType = cat ? cat.type : t.categoryType;
      const normType = rawType ? normalizeCategoryType(rawType) : 'Outras Despesas';
      key = normType;
      label = normType;
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

  // Arredonda os totais dos grupos a 2 casas decimais
  groups.forEach(g => {
    g.total = Math.round(g.total * 100) / 100;
  });

  // Total líquido de todas as despesas computadas (incluindo estornos e saldos negativos)
  const allGroupsRawTotal = Array.from(groups.values()).reduce((acc, curr) => acc + curr.total, 0);
  const totalExpenses = Math.max(Math.round(allGroupsRawTotal * 100) / 100, 0);

  // Converte para lista ordenada por maior valor positivo (itens com saldo <= 0 não ocupam fatia positiva no Donut)
  const items = Array.from(groups.values())
    .filter(g => g.total > 0)
    .sort((a, b) => b.total - a.total);

  // Base para distribuição das fatias da rosca e barras de progresso (soma das despesas positivas)
  const positiveGrossTotal = items.reduce((acc, curr) => acc + curr.total, 0);
  const baseForDistribution = positiveGrossTotal > 0 ? positiveGrossTotal : totalExpenses;

  // Calcula percentuais e cores garantindo limite de 100%
  items.forEach((item, idx) => {
    item.percentage = baseForDistribution > 0 ? Math.min((item.total / baseForDistribution) * 100, 100) : 0;
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
export function calculateMonthlyEvolutionData(transactions, categories, year = AppState.selectedYear) {
  const targetYear = Number(year);
  const resolveCategory = createCategoryResolver(categories);

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
    if (val === 0) return;

    const cat = resolveCategory(t);
    const rawType = cat ? cat.type : t.categoryType;
    const normType = rawType ? normalizeCategoryType(rawType) : null;
    const typeConfig = normType ? CATEGORY_TYPES.find(ct => ct.id === normType) : null;
    const isRev = typeConfig 
      ? Boolean(typeConfig.isRevenue) 
      : Boolean(t.isRevenue === true || normType === 'Receita' || normType === 'Repasse');

    if (isRev) {
      monthlyTotals[m].revenues += val;
    } else {
      monthlyTotals[m].expenses += val;
    }
  });

  monthlyTotals.forEach(m => {
    m.expenses = Math.round(Math.max(m.expenses, 0) * 100) / 100;
    m.revenues = Math.round(Math.max(m.revenues, 0) * 100) / 100;
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
export function renderDonutChartSVG(items, totalExpenses) {
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
  const positiveGrossTotal = items.reduce((acc, curr) => acc + curr.total, 0);
  const baseForSlices = positiveGrossTotal > 0 ? positiveGrossTotal : totalExpenses;

  const slices = items.map((item, idx) => {
    const dashLength = baseForSlices > 0 ? (item.total / baseForSlices) * circumference : 0;
    const offset = -accumulatedDash;
    accumulatedDash += dashLength;
    const remainingDash = Math.max(circumference - dashLength, 0);

    return `
      <circle 
        cx="${cx}" 
        cy="${cy}" 
        r="${radius}" 
        fill="none" 
        stroke="${item.color}" 
        stroke-width="${strokeWidth}" 
        stroke-dasharray="${dashLength.toFixed(2)} ${remainingDash.toFixed(2)}" 
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
export function renderRankingListHTML(items, totalExpenses) {
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
            <div class="ranking-bar-fill" style="width: ${Math.min(Math.max(item.percentage, 0), 100).toFixed(1)}%; background: ${item.color};"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Gera o gráfico de barras dos 12 meses (Evolução Anual)
 */
export function renderAnnualEvolutionHTML(evolutionData) {
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
export function renderChartsModal() {
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
export function openChartsModal() {
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
export function closeChartsModal() {
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
export function setChartPeriodMode(mode) {
  if (mode !== 'month' && mode !== 'year') return;
  currentPeriodMode = mode;
  renderChartsModal();
}

/**
 * Trata a mudança de mês via dropdown no modal
 * Sincroniza o estado global e o Dashboard em segundo plano
 */
export function onChartMonthChange(newMonthIndex) {
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

  // Se houver edição em andamento, cancela para não salvar no mês incorreto
  if (AppState.editingTransactionId) {
    if (typeof window !== 'undefined' && typeof window.Financas?.cancelEditingTransaction === 'function') {
      window.Financas.cancelEditingTransaction();
    }
  }

  // Atualiza os dados do Dashboard em segundo plano
  if (typeof window !== 'undefined' && window.Financas && typeof window.Financas.renderDashboard === 'function') {
    window.Financas.renderDashboard();
  }

  // Se o usuário estiver na tela de categoria, atualiza também a tabela de lançamentos
  if (AppState.currentRoute === 'category' && typeof window !== 'undefined' && window.Financas && typeof window.Financas.renderTransactionsTable === 'function') {
    window.Financas.renderTransactionsTable();
  }

  // Re-renderiza o gráfico com o novo mês selecionado
  renderChartsModal();
}

/**
 * Altera o agrupamento (categoria vs tipo vs tag)
 */
export function setChartGroupMode(group) {
  if (group !== 'category' && group !== 'type' && group !== 'tag') return;
  currentGroupMode = group;
  renderChartsModal();
}

