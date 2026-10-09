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
    if (AppState.editingCategoryId === cat.id) {
      tr.classList.add('row-editing');
    }
    const typeConfig = CATEGORY_TYPES.find(t => t.id === cat.type) || { badgeClass: 'badge-variavel' };

    tr.innerHTML = `
      <td><strong>${escapeHTML(cat.name)}</strong></td>
      <td>
        <span class="badge ${typeConfig.badgeClass}">${escapeHTML(cat.type)}</span>
      </td>
      <td class="text-right">
        <div style="display: inline-flex; gap: 6px; justify-content: flex-end;">
          <button class="btn-edit" data-edit-category-id="${escapeHTML(cat.id)}" aria-label="Editar categoria ${escapeHTML(cat.name)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Editar</span>
          </button>
          <button class="btn-delete" data-delete-id="${escapeHTML(cat.id)}" aria-label="Excluir categoria ${escapeHTML(cat.name)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Excluir</span>
          </button>
        </div>
      </td>
    `;

    tr.querySelector?.('.btn-edit')?.addEventListener('click', () => {
      startEditingCategory(cat.id);
    });

    tr.querySelector?.('.btn-delete')?.addEventListener('click', () => {
      deleteCategory(cat.id);
    });

    DOM.categoryTableBody.appendChild(tr);
  });
}

export function startEditingCategory(id) {
  const cat = AppState.categories.find(c => c.id === id);
  if (!cat) return;

  AppState.editingCategoryId = cat.id;

  if (DOM.categoryNameInput) DOM.categoryNameInput.value = cat.name;
  if (DOM.categoryTypeSelect) DOM.categoryTypeSelect.value = cat.type;

  if (DOM.btnSubmitCategoryText) {
    DOM.btnSubmitCategoryText.textContent = 'Salvar';
  }
  if (DOM.btnSubmitCategoryIcon) {
    DOM.btnSubmitCategoryIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
  }
  if (DOM.btnCancelEditCategory) {
    DOM.btnCancelEditCategory.style.display = 'inline-flex';
  }

  if (DOM.categoryTableBody && typeof DOM.categoryTableBody.querySelectorAll === 'function') {
    DOM.categoryTableBody.querySelectorAll('tr').forEach(row => {
      row.classList?.remove('row-editing');
    });
    const targetRow = DOM.categoryTableBody.querySelector?.(`[data-edit-category-id="${cat.id}"]`)?.closest?.('tr');
    if (targetRow) targetRow.classList?.add('row-editing');
  }

  DOM.categoryNameInput?.focus?.();
  DOM.categoryForm?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  showToast(`Editando categoria "${cat.name}"...`);
}

export function cancelEditingCategory() {
  AppState.editingCategoryId = null;

  if (DOM.categoryNameInput) DOM.categoryNameInput.value = '';
  if (DOM.categoryTypeSelect) DOM.categoryTypeSelect.selectedIndex = 0;

  if (DOM.btnSubmitCategoryText) {
    DOM.btnSubmitCategoryText.textContent = 'Adicionar';
  }
  if (DOM.btnSubmitCategoryIcon) {
    DOM.btnSubmitCategoryIcon.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
  }
  if (DOM.btnCancelEditCategory) {
    DOM.btnCancelEditCategory.style.display = 'none';
  }

  if (DOM.nameError) DOM.nameError.textContent = '';
  if (DOM.typeError) DOM.typeError.textContent = '';
  if (DOM.categoryNameInput) DOM.categoryNameInput.style.borderColor = '';
  if (DOM.categoryTypeSelect) DOM.categoryTypeSelect.style.borderColor = '';

  if (DOM.categoryTableBody && typeof DOM.categoryTableBody.querySelectorAll === 'function') {
    DOM.categoryTableBody.querySelectorAll('tr').forEach(row => {
      row.classList?.remove('row-editing');
    });
  }
}

export function updateCategory(id, newName, newType) {
  const cat = AppState.categories.find(c => c.id === id);
  if (!cat) return;

  const oldName = cat.name;
  const oldType = cat.type;
  const normOldType = normalizeCategoryType(oldType);

  const cleanNewName = newName.trim();
  const cleanNewType = normalizeCategoryType(newType.trim());

  cat.name = cleanNewName;
  cat.type = cleanNewType;

  // Atualiza em cascata os lançamentos vinculados a essa categoria
  AppState.transactions.forEach(t => {
    const matchesId = t.categoryId ? (t.categoryId === id) : false;
    const matchesNameAndType = !t.categoryId &&
      (t.categoryName || '').trim().toLowerCase() === oldName.trim().toLowerCase() &&
      (t.categoryType ? normalizeCategoryType(t.categoryType) === normOldType : true);

    if (matchesId || matchesNameAndType) {
      t.categoryId = id;
      t.categoryName = cleanNewName;
      t.categoryType = cleanNewType;

      if (cleanNewType === 'Receita' || cleanNewType === 'Repasse') {
        t.isRevenue = true;
      } else {
        t.isRevenue = false;
      }
    }

    // Se essa categoria for um Cartão de Crédito que tinha lançamentos de Repasse espelhados
    // atualiza a anotação na descrição da receita do repasse: "Descrição ( Antigo )" -> "Descrição ( Novo )"
    if (normOldType === 'Cartão de Crédito' && t.linkedId && t.description) {
      const oldSuffix = `( ${oldName} )`;
      const newSuffix = `( ${cleanNewName} )`;
      if (t.description.endsWith(oldSuffix)) {
        t.description = t.description.slice(0, t.description.length - oldSuffix.length) + newSuffix;
      }
    }
  });

  saveCategories(AppState.categories);
  saveTransactions(AppState.transactions);
  triggerCloudSync();

  cancelEditingCategory();
  renderCategoryTable();
  rebuildSidebar();
  renderDashboard();

  if (AppState.currentRoute === 'category' && AppState.activeCategoryId === id) {
    if (typeof window !== 'undefined' && typeof window.Financas?.setupCategoryDetailView === 'function') {
      window.Financas.setupCategoryDetailView(cat);
    }
  }

  showToast(`Categoria "${cleanNewName}" atualizada com sucesso!`);
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

  const targetCategoryType = normalizeCategoryType(cat.type);
  const targetCategoryName = (cat.name || '').toLowerCase();

  const directTransactionIdsToDelete = new Set();
  const linkedIdsToDelete = new Set();

  AppState.transactions.forEach(t => {
    const matchesId = t.categoryId ? (t.categoryId === id) : false;
    const matchesNameAndType = !t.categoryId && 
      (t.categoryName || '').toLowerCase() === targetCategoryName &&
      (t.categoryType ? normalizeCategoryType(t.categoryType) === targetCategoryType : true);

    if (matchesId || matchesNameAndType) {
      directTransactionIdsToDelete.add(t.id);
      if (t.linkedId) {
        linkedIdsToDelete.add(t.linkedId);
      }
    }
  });

  let otherLinkedCount = 0;
  if (linkedIdsToDelete.size > 0) {
    AppState.transactions.forEach(t => {
      if (!directTransactionIdsToDelete.has(t.id) && t.linkedId && linkedIdsToDelete.has(t.linkedId)) {
        otherLinkedCount++;
      }
    });
  }

  const isDeletingRepasse = targetCategoryType === 'Repasse';

  let confirmMsg = `Deseja realmente excluir a categoria "${cat.name}" e seus lançamentos?`;
  if (isDeletingRepasse && otherLinkedCount > 0) {
    confirmMsg += `\n\nOBSERVAÇÃO: Existem ${otherLinkedCount} despesa(s) no Cartão de Crédito vinculada(s) que serão mantidas e desvinculadas automaticamente.`;
  } else if (otherLinkedCount > 0) {
    confirmMsg += `\n\nATENÇÃO: Existem ${otherLinkedCount} lançamento(s) vinculado(s) em outras categorias (ex: Cartão de Crédito ou Repasse) que também serão excluídos.`;
  }

  if (!confirm(confirmMsg)) {
    return;
  }

  AppState.categories = AppState.categories.filter(c => c.id !== id);
  saveCategories(AppState.categories);

  if (isDeletingRepasse) {
    AppState.transactions = AppState.transactions
      .filter(t => !directTransactionIdsToDelete.has(t.id))
      .map(t => {
        if (t.linkedId && linkedIdsToDelete.has(t.linkedId)) {
          return { ...t, linkedId: null };
        }
        return t;
      });
  } else {
    AppState.transactions = AppState.transactions.filter(t => {
      if (directTransactionIdsToDelete.has(t.id)) return false;
      if (t.linkedId && linkedIdsToDelete.has(t.linkedId)) return false;
      return true;
    });
  }

  if (AppState.editingTransactionId && (directTransactionIdsToDelete.has(AppState.editingTransactionId) || !AppState.transactions.some(t => t.id === AppState.editingTransactionId))) {
    if (typeof window !== 'undefined' && typeof window.Financas?.cancelEditingTransaction === 'function') {
      window.Financas.cancelEditingTransaction();
    }
  }

  if (AppState.editingCategoryId === id) {
    cancelEditingCategory();
  }

  saveTransactions(AppState.transactions);
  triggerCloudSync();

  if (AppState.currentRoute === 'category') {
    if (AppState.activeCategoryId === id) {
      navigateTo('configuracoes');
    } else if (typeof window !== 'undefined' && typeof window.Financas?.renderTransactionsTable === 'function') {
      window.Financas.renderTransactionsTable();
      if (typeof window.Financas?.updateMonthTotal === 'function') {
        window.Financas.updateMonthTotal();
      }
    }
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
      c => c.id !== AppState.editingCategoryId &&
           c.name.toLowerCase() === nameVal.toLowerCase() &&
           normalizeCategoryType(c.type).toLowerCase() === normType.toLowerCase()
    );
    if (isDuplicate) {
      if (DOM.nameError) DOM.nameError.textContent = `A categoria "${nameVal}" já existe para o tipo "${normType}".`;
      if (DOM.categoryNameInput) DOM.categoryNameInput.style.borderColor = 'var(--danger)';
      hasError = true;
    }
  }

  if (hasError) return;

  if (AppState.editingCategoryId) {
    updateCategory(AppState.editingCategoryId, nameVal, typeVal);
  } else {
    addCategory(nameVal, typeVal);
    if (DOM.categoryNameInput) DOM.categoryNameInput.value = '';
    if (DOM.categoryTypeSelect) DOM.categoryTypeSelect.selectedIndex = 0;
    if (DOM.categoryNameInput) DOM.categoryNameInput.focus();
  }
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

  setTimeout(() => {
    if (a.parentNode) {
      document.body.removeChild(a);
    }
    if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(url);
    }
  }, 1000);

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

      const nowTs = touchLastUpdated(Date.now());
      saveCategories(AppState.categories, true);
      saveTransactions(AppState.transactions, true);
      if (Array.isArray(incomingTags) && incomingTags.length > 0) {
        saveTags(AppState.tags, true);
      }
      touchLastUpdated(nowTs);
      triggerCloudSync();

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
      setCloudStatus('disconnected', '☁️ Nuvem Desconectada');
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

