/**
 * =============================================================================
 * SISTEMA FINANCEIRO - DETALHE DA CATEGORIA, LANÇAMENTOS (CRUD) & TAGS
 * =============================================================================
 */

import { DOM } from './dom.js';
import { AppState } from './state.js';
import { CATEGORY_TYPES, MONTH_NAMES } from './constants.js';
import { normalizeCategoryType } from './normalization.js';
import { saveTransactions, saveTags } from './storage.js';
import { escapeHTML, formatCurrency, parseCurrencyToFloat, showToast } from './utils.js';
import { generateTransactionsMultiYear, createExpenseWithRepasseMirror, deleteTransactionCascade, updateTransactionCascade } from './calculations.js';
import { triggerCloudSync } from './cloud.js';
import { renderDashboard } from './dashboard.js';

export function changeYear(delta) {
  if (AppState.editingTransactionId) {
    cancelEditingTransaction();
  }
  AppState.selectedYear = Number(AppState.selectedYear) + delta;
  updateYearDisplay();
  renderTransactionsTable();
  renderDashboard();
  if (DOM.modalChartsOverlay && DOM.modalChartsOverlay.classList.contains('active')) {
    if (typeof window !== 'undefined' && typeof window.Financas?.renderChartsModal === 'function') {
      window.Financas.renderChartsModal();
    }
  }
  showToast(`Ano selecionado: ${AppState.selectedYear}`);
}

export function updateYearDisplay() {
  if (DOM.yearDisplay) {
    DOM.yearDisplay.textContent = AppState.selectedYear;
  }
}

export function setActiveMonth(monthIndex) {
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

export function setupCategoryDetailView(category) {
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

export function updateTransRepasseVisibility(category) {
  if (!DOM.transRepasseGroup || !DOM.transRepasseSelect) return;

  const isCreditCard = category && normalizeCategoryType(category.type) === 'Cartão de Crédito';
  const showRepasse = Boolean(isCreditCard && !AppState.editingTransactionId);

  if (DOM.transactionForm) {
    DOM.transactionForm.classList.toggle('has-repasse', showRepasse);
  }

  if (showRepasse) {
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

export const isParcelada = (installment) => {
  if (!installment) return false;
  const clean = String(installment).trim();
  return /^\d+\s*\/\s*\d+$/.test(clean);
};

export function updateMonthTotal() {
  const activeCategory = AppState.categories.find(c => c.id === AppState.activeCategoryId);
  if (!activeCategory || !DOM.transTotalValue) return;

  const currentMonth = Number(AppState.selectedMonthIndex);
  const currentYear = Number(AppState.selectedYear);

  let filtered = AppState.transactions.filter(t => {
    const matchCat = t.categoryId 
      ? (t.categoryId === activeCategory.id) 
      : (t.categoryName.trim().toLowerCase() === activeCategory.name.trim().toLowerCase() &&
         (t.categoryType ? normalizeCategoryType(t.categoryType) === normalizeCategoryType(activeCategory.type) : true));
    return matchCat && Number(t.monthIndex) === currentMonth && Number(t.year) === currentYear;
  });

  const filtroTipo = DOM.filtroTipoCompra ? DOM.filtroTipoCompra.value : 'todos';
  if (filtroTipo === 'unicas') {
    filtered = filtered.filter(t => !isParcelada(t.installment));
  } else if (filtroTipo === 'parceladas') {
    filtered = filtered.filter(t => isParcelada(t.installment));
  }

  const totalSum = filtered.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  DOM.transTotalValue.textContent = formatCurrency(totalSum);
}

export function startEditingTransaction(id) {
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

  DOM.transactionForm?.classList.remove('has-repasse');
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

export function cancelEditingTransaction() {
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

export function renderTransactionsTable() {
  const activeCategory = AppState.categories.find(c => c.id === AppState.activeCategoryId);
  if (!activeCategory || !DOM.transactionTableBody) return;

  const currentMonth = Number(AppState.selectedMonthIndex);
  const currentYear = Number(AppState.selectedYear);
  const categoryTypeNorm = normalizeCategoryType(activeCategory.type);
  const isFixedOrVariable = (categoryTypeNorm === 'Conta Fixa' || categoryTypeNorm === 'Variável Prevista' || categoryTypeNorm === 'Receita' || categoryTypeNorm === 'Repasse');

  const monthTransactions = AppState.transactions.filter(t => {
    const matchCat = t.categoryId 
      ? (t.categoryId === activeCategory.id) 
      : ((t.categoryName || '').trim().toLowerCase() === (activeCategory.name || '').trim().toLowerCase() &&
         (t.categoryType ? normalizeCategoryType(t.categoryType) === normalizeCategoryType(activeCategory.type) : true));
    return matchCat && Number(t.monthIndex) === currentMonth && Number(t.year) === currentYear;
  });

  const filtroTipo = DOM.filtroTipoCompra ? DOM.filtroTipoCompra.value : 'todos';

  let filteredTransactions = monthTransactions;
  if (filtroTipo === 'unicas') {
    filteredTransactions = monthTransactions.filter(t => !isParcelada(t.installment));
  } else if (filtroTipo === 'parceladas') {
    filteredTransactions = monthTransactions.filter(t => isParcelada(t.installment));
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
            if (newVal === 0) {
              showToast('O valor deve ser diferente de zero.', 'error');
              inlineInput.value = Number(t.value).toFixed(2);
              return;
            }
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

export function toggleTransactionPaid(id, isPaid) {
  const transaction = AppState.transactions.find(t => t.id === id);
  if (!transaction) return;

  transaction.isPaid = isPaid;
  saveTransactions(AppState.transactions);
  triggerCloudSync();
  renderTransactionsTable();
  showToast(isPaid ? 'Marcado como pago' : 'Marcado como pendente');
}

export function deleteTransaction(id) {
  const transaction = AppState.transactions.find(t => t.id === id);
  if (!transaction) return;

  const hasGroupOccurrences = transaction.groupId && AppState.transactions.some(
    other => other.id !== transaction.id && other.groupId === transaction.groupId
  );
  const isFraction = Boolean(
    (transaction.installment && transaction.installment.includes('/')) ||
    isParcelada(transaction.installment)
  );

  let confirmMsg = `Deseja realmente excluir o lançamento "${transaction.description}"?`;

  const linkedMirror = transaction.linkedId
    ? AppState.transactions.find(o => o.linkedId === transaction.linkedId && o.id !== transaction.id)
    : null;

  if (linkedMirror) {
    const mirrorCatName = linkedMirror.categoryName || 'outra categoria';
    confirmMsg += `\n\nATENÇÃO: Este lançamento possui um vínculo com a categoria "${mirrorCatName}". Ao confirmar, o lançamento correspondente lá também será excluído.`;
  }

  if (!window.confirm(confirmMsg)) {
    return;
  }

  let deleteSubsequent = false;
  if (hasGroupOccurrences || isFraction) {
    deleteSubsequent = window.confirm(
      "Deseja excluir também as parcelas/ocorrências dos meses seguintes?\n\n[OK] = Excluir este mês e os seguintes\n[Cancelar] = Excluir apenas a ocorrência deste mês"
    );
  }

  const result = deleteTransactionCascade(AppState.transactions, id, deleteSubsequent);
  AppState.transactions = result.transactions;
  showToast(deleteSubsequent ? "Lançamento e ocorrências seguintes excluídos com sucesso." : "Apenas o lançamento deste mês foi excluído.");

  if (AppState.editingTransactionId === id) {
    cancelEditingTransaction();
  }

  saveTransactions(AppState.transactions);
  triggerCloudSync();
  renderTransactionsTable();
  renderDashboard();
}

export function handleTransactionSubmit(e) {
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
      const isFraction = Boolean(
        isParcelada(existing.installment) ||
        (existing.installment && existing.installment.includes('/')) ||
        isParcelada(installmentRaw) ||
        (installmentRaw && installmentRaw.includes('/'))
      );
      const hasGroupId = Boolean(existing.groupId);
      let propagateToFuture = false;

      if (hasGroupId || isFraction) {
        propagateToFuture = window.confirm(
          "Deseja aplicar essa alteração (Valor/Descrição/Classificação/Parcelas) também para os meses seguintes?"
        );
      }

      try {
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
      } catch (err) {
        if (DOM.transInstallmentError) DOM.transInstallmentError.textContent = err.message || 'Erro no parcelamento.';
        if (DOM.transInstallmentInput) {
          DOM.transInstallmentInput.style.borderColor = 'var(--danger)';
          DOM.transInstallmentInput.focus();
        }
        return;
      }
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

export function renderTagSelectOptions(selectedTag) {
  if (!DOM.itemTag) return;
  const current = (selectedTag !== undefined && selectedTag !== null) 
    ? String(selectedTag).trim() 
    : (DOM.itemTag.value || '').trim();
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

export function openManageTagsModal() {
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

export function closeManageTagsModal() {
  if (!DOM.modalManageTagsOverlay) return;
  document.body.style.overflow = '';
  DOM.modalManageTagsOverlay.classList.remove('active');
  setTimeout(() => {
    DOM.modalManageTagsOverlay.style.display = 'none';
  }, 250);
  renderTagSelectOptions();
}

export function addTagFromModal() {
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

export function deleteTagFromModal(tagName) {
  if (!tagName) return;
  const confirmed = window.confirm(`Deseja remover a classificação "${tagName}" da lista de opções?\n\nLançamentos já criados com esta classificação manterão a tag intacta.`);
  if (!confirmed) return;

  AppState.tags = AppState.tags.filter(t => t.toLowerCase() !== tagName.toLowerCase());
  saveTags(AppState.tags);

  if (DOM.itemTag && DOM.itemTag.value.toLowerCase() === tagName.toLowerCase()) {
    DOM.itemTag.value = '';
  }

  renderManageTagsList();
  renderTagSelectOptions(DOM.itemTag ? DOM.itemTag.value : '');
  showToast(`Classificação "${tagName}" removida da lista.`, 'info');
}

export function renderManageTagsList() {
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
