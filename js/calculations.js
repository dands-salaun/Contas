/**
 * =============================================================================
 * SISTEMA FINANCEIRO - CAMADA DE CÁLCULO E REGRAS DE NEGÓCIO PURAS
 * Isolada do DOM - Altamente testável via testes unitários
 * =============================================================================
 */

import { normalizeCategoryType } from './normalization.js';
import { AppState } from './state.js';

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
export function generateTransactionsMultiYear({
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
export function createExpenseWithRepasseMirror({
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
export function deleteTransactionCascade(transactions = [], transactionId, shouldDeleteSubsequent = false) {
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
export function updateTransactionCascade(transactions = [], transactionId, { description, value, installment, tag } = {}, shouldPropagateToFuture = false) {
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
export function calculateTotalsByMonthAndYear(transactions = [], categories = [], monthIndex = 0, year = new Date().getFullYear()) {
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
