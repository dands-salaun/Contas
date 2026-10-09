/**
 * =============================================================================
 * SISTEMA FINANCEIRO - GERENCIAMENTO DE CATEGORIAS, BACKUPS & ZONA DE PERIGO
 * =============================================================================
 */

import { DOM } from './dom.js';
import { AppState } from './state.js';
import { CATEGORY_TYPES, STORAGE_KEYS } from './constants.js';
import { normalizeCategoryType, normalizeCategory, normalizeTransaction } from './normalization.js';
import { saveCategories, saveTransactions, saveTags, touchLastUpdated } from './storage.js';
import { showToast, escapeHTML, setCloudStatus } from './utils.js';
import { triggerCloudSync } from './cloud.js';
import { rebuildSidebar } from './sidebar.js';
import { renderDashboard } from './dashboard.js';
import { navigateTo } from './router.js';

export let isResettingData = false;

export function renderCategoryTable() {
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

export function addCategory(name, type) {
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

export function deleteCategory(id) {
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

export function handleCategorySubmit(e) {
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

export function exportBackup() {
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

export function importBackup(e) {
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

export function clearAllLocalData(options = {}) {
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

