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
 * Determina com precisão se uma transação pertence ao fluxo de 'Repasse',
 * diferenciando-a categoricamente de receitas legítimas (Salário, Investimentos, etc.).
 * 
 * @param {Object} tx Lançamento a verificar
 * @param {Array<Object>} transactions Lista de lançamentos para consulta de vínculos
 * @returns {boolean}
 */
export function isRepasseTransaction(tx, transactions = []) {
  if (!tx) return false;
  const normType = tx.categoryType ? normalizeCategoryType(tx.categoryType) : null;
  if (normType === 'Repasse') return true;
  if (normType === 'Receita') return false;

  if (typeof AppState !== 'undefined' && Array.isArray(AppState.categories)) {
    const cat = AppState.categories.find(c => {
      if (tx.categoryId) return c.id === tx.categoryId;
      return c.name && (c.name.toLowerCase() === (tx.categoryName || '').toLowerCase());
    });
    if (cat && cat.type) {
      const cType = normalizeCategoryType(cat.type);
      if (cType === 'Repasse') return true;
      if (cType === 'Receita') return false;
    }
  }

  // Fallback: se possuir linkedId e a transação espelhada for do Cartão de Crédito
  if (tx.linkedId && Array.isArray(transactions)) {
    const other = transactions.find(o => o.linkedId === tx.linkedId && o.id !== tx.id);
    if (other) {
      const otherType = other.categoryType ? normalizeCategoryType(other.categoryType) : null;
      if (otherType === 'Cartão de Crédito') return true;
    }
  }

  return false;
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
      const cat = AppState.categories.find(c => {
        if (target.categoryId) return c.id === target.categoryId;
        const matchName = c.name.toLowerCase() === (target.categoryName || '').toLowerCase();
        if (!matchName) return false;
        if (target.categoryType) return normalizeCategoryType(c.type) === normalizeCategoryType(target.categoryType);
        return true;
      });
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

  const isTargetRepasse = isRepasseTransaction(target, transactions);

  let targetCleanBase = '';
  let targetSuffix = '';
  let targetFinalDesc = undefined;

  if (description !== undefined) {
    const rawDesc = String(description).trim();
    if (isTargetRepasse) {
      const suffixMatch = rawDesc.match(/\s*\(\s*[^)]+\s*\)$/);
      if (suffixMatch) {
        targetCleanBase = rawDesc.slice(0, rawDesc.length - suffixMatch[0].length).trim();
        targetSuffix = suffixMatch[0];
      } else {
        targetCleanBase = rawDesc;
        const oldMatch = (target.description || '').match(/\s*\(\s*[^)]+\s*\)$/);
        targetSuffix = oldMatch ? oldMatch[0] : '';
      }
      targetFinalDesc = targetSuffix ? `${targetCleanBase}${targetSuffix}` : targetCleanBase;
    } else {
      targetCleanBase = rawDesc;
      targetFinalDesc = rawDesc;
    }
  }

  const newFractionMatch = installment !== undefined ? String(installment).trim().match(/^(\d+)\s*\/\s*(\d+)$/) : null;
  const newP = newFractionMatch ? parseInt(newFractionMatch[1], 10) : null;
  const newTotal = newFractionMatch ? parseInt(newFractionMatch[2], 10) : null;

  if (newFractionMatch) {
    if (newP <= 0 || newTotal <= 0) {
      throw new Error('Os números da parcela devem ser maiores que zero.');
    }
    if (newP > newTotal) {
      throw new Error('A parcela atual não pode ser maior que o total.');
    }
  }

  // Se for uma conta avulsa sendo editada para parcelada com propagação
  if (shouldPropagateToFuture && newFractionMatch && !target.groupId) {
    target.groupId = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  }

  const pruneIds = new Set();
  const newTransactionsToAdd = [];

  if (shouldPropagateToFuture && newFractionMatch && target.groupId) {
    let maxExistingP = newP;
    transactions.forEach(t => {
      if (t.groupId === target.groupId) {
        const m = String(t.installment || '').match(/^(\d+)\s*\/\s*(\d+)$/);
        if (m) {
          const p = parseInt(m[1], 10);
          if (p > maxExistingP) maxExistingP = p;
          if (p > newTotal) {
            pruneIds.add(t.id);
            if (t.linkedId) {
              const linkedMirror = transactions.find(mItem => mItem.linkedId === t.linkedId && mItem.id !== t.id);
              if (linkedMirror) pruneIds.add(linkedMirror.id);
            }
          }
        }
      }
    });

    if (newTotal > maxExistingP) {
      const targetMirror = target.linkedId ? transactions.find(t => t.linkedId === target.linkedId && t.id !== target.id) : null;
      for (let p = maxExistingP + 1; p <= newTotal; p++) {
        const offset = p - newP;
        const itemMonth = (targetMonth + offset) % 12;
        const itemYear = targetYear + Math.floor((targetMonth + offset) / 12);
        const newLinkedId = targetMirror ? ('link_' + Date.now() + '_' + p + '_' + Math.random().toString(36).substring(2, 7)) : null;

        const newTx = {
          id: 'lanc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) + '_' + p,
          groupId: target.groupId,
          linkedId: newLinkedId,
          categoryId: target.categoryId || null,
          categoryName: target.categoryName,
          categoryType: target.categoryType,
          year: itemYear,
          monthIndex: itemMonth,
          description: targetFinalDesc !== undefined ? targetFinalDesc : (description !== undefined ? description : target.description),
          installment: `${p}/${newTotal}`,
          value: value !== undefined ? Number(value) : target.value,
          isPaid: false,
          tag: tag !== undefined ? tag : target.tag,
          ...(target.isRevenue !== undefined ? { isRevenue: target.isRevenue } : {})
        };
        newTransactionsToAdd.push(newTx);

        if (targetMirror) {
          let mirrorSuffix = targetSuffix;
          if (!mirrorSuffix && targetMirror.description) {
            const m = targetMirror.description.match(/\s*\(\s*[^)]+\s*\)$/);
            if (m) mirrorSuffix = m[0];
          }

          const mirrorDesc = isTargetRepasse
            ? targetCleanBase
            : (mirrorSuffix ? `${targetCleanBase}${mirrorSuffix}` : (description !== undefined ? description : (targetMirror.description || newTx.description)));

          const newMirrorTx = {
            id: 'lanc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) + '_mir_' + p,
            groupId: targetMirror.groupId || target.groupId,
            linkedId: newLinkedId,
            categoryId: targetMirror.categoryId || null,
            categoryName: targetMirror.categoryName,
            categoryType: targetMirror.categoryType,
            year: itemYear,
            monthIndex: itemMonth,
            description: mirrorDesc,
            installment: `${p}/${newTotal}`,
            value: value !== undefined ? Number(value) : target.value,
            isPaid: false,
            tag: tag !== undefined ? tag : target.tag,
            ...(targetMirror.isRevenue !== undefined ? { isRevenue: targetMirror.isRevenue } : {})
          };
          newTransactionsToAdd.push(newMirrorTx);
        }
      }
    }
  }

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

    if (shouldUpdate && !pruneIds.has(item.id)) {
      primaryIdsToUpdate.add(item.id);

      let itemInstallmentToUse = item.installment;
      if (item.id === target.id) {
        itemInstallmentToUse = installment !== undefined ? installment : item.installment;
      } else if (shouldPropagateToFuture && newFractionMatch) {
        const itemFracMatch = String(item.installment || '').match(/^(\d+)\s*\/\s*(\d+)$/);
        if (itemFracMatch) {
          itemInstallmentToUse = `${itemFracMatch[1]}/${newTotal}`;
        }
      }

      if (item.linkedId) {
        linkedUpdatesMap.set(item.linkedId, {
          sourceId: item.id,
          value: value !== undefined ? Number(value) : item.value,
          installment: itemInstallmentToUse,
          tag: tag !== undefined ? tag : item.tag,
          sourceIsRepasse: isTargetRepasse,
          cleanBaseDescription: targetCleanBase,
          targetSuffix: targetSuffix,
          newDescription: targetFinalDesc !== undefined ? targetFinalDesc : item.description
        });
      }
    }
  });

  let updatedCount = 0;
  const updatedTransactions = [];

  transactions.forEach(item => {
    if (pruneIds.has(item.id)) {
      return;
    }

    if (primaryIdsToUpdate.has(item.id)) {
      updatedCount++;
      let itemInstallment = item.installment;
      if (item.id === target.id) {
        itemInstallment = installment !== undefined ? installment : item.installment;
      } else if (shouldPropagateToFuture && newFractionMatch) {
        const itemFracMatch = String(item.installment || '').match(/^(\d+)\s*\/\s*(\d+)$/);
        if (itemFracMatch) {
          itemInstallment = `${itemFracMatch[1]}/${newTotal}`;
        }
      }

      updatedTransactions.push({
        ...item,
        groupId: target.groupId || item.groupId,
        description: targetFinalDesc !== undefined ? targetFinalDesc : (description !== undefined ? description : item.description),
        value: value !== undefined ? Number(value) : item.value,
        installment: itemInstallment,
        tag: tag !== undefined ? tag : item.tag
      });
      return;
    }

    if (item.linkedId && linkedUpdatesMap.has(item.linkedId)) {
      const updateData = linkedUpdatesMap.get(item.linkedId);
      if (item.id !== updateData.sourceId) {
        updatedCount++;
        let newDesc = item.description;
        if (description !== undefined) {
          const isItemRepasse = isRepasseTransaction(item, transactions);

          if (isItemRepasse) {
            let suffix = updateData.targetSuffix;
            if (!suffix) {
              const oldMatch = (item.description || '').match(/\s*\(\s*[^)]+\s*\)$/);
              suffix = oldMatch ? oldMatch[0] : '';
            }
            newDesc = suffix ? `${updateData.cleanBaseDescription}${suffix}` : updateData.cleanBaseDescription;
          } else {
            newDesc = updateData.cleanBaseDescription;
          }
        }
        updatedTransactions.push({
          ...item,
          description: newDesc,
          value: updateData.value,
          installment: updateData.installment !== undefined ? updateData.installment : item.installment,
          tag: updateData.tag
        });
        return;
      }
    }

    // Se pertence ao mesmo grupo de parcelamento mas ocorreu antes do mês editado, alinha o total de parcelas (denominador)
    if (shouldPropagateToFuture && newFractionMatch && target.groupId && item.groupId === target.groupId) {
      const pastFracMatch = String(item.installment || '').match(/^(\d+)\s*\/\s*(\d+)$/);
      if (pastFracMatch && parseInt(pastFracMatch[2], 10) !== newTotal) {
        updatedCount++;
        const alignedInstallment = `${pastFracMatch[1]}/${newTotal}`;
        updatedTransactions.push({
          ...item,
          installment: alignedInstallment
        });

        // Se tiver espelho vinculado no repasse, alinha também o denominador do espelho
        if (item.linkedId) {
          const mirror = transactions.find(m => m.linkedId === item.linkedId && m.id !== item.id);
          if (mirror) {
            const mFrac = String(mirror.installment || '').match(/^(\d+)\s*\/\s*(\d+)$/);
            if (mFrac && parseInt(mFrac[2], 10) !== newTotal) {
              // Será atualizado quando o loop alcançar o mirror
            }
          }
        }
        return;
      }
    }

    // Se é um espelho de um item anterior cujo denominador precisa ser alinhado
    if (shouldPropagateToFuture && newFractionMatch && item.linkedId) {
      const mainTx = transactions.find(m => m.linkedId === item.linkedId && m.id !== item.id && target.groupId && m.groupId === target.groupId);
      if (mainTx) {
        const mFrac = String(item.installment || '').match(/^(\d+)\s*\/\s*(\d+)$/);
        if (mFrac && parseInt(mFrac[2], 10) !== newTotal) {
          updatedCount++;
          updatedTransactions.push({
            ...item,
            installment: `${mFrac[1]}/${newTotal}`
          });
          return;
        }
      }
    }

    updatedTransactions.push(item);
  });

  if (newTransactionsToAdd.length > 0) {
    updatedTransactions.push(...newTransactionsToAdd);
    updatedCount += newTransactionsToAdd.length;
  }

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
  const categoryCompositeTypeMap = new Map();
  const categoryIdTypeMap = new Map();
  const validCategoryNames = new Set();
  const validCategoryIds = new Set();
  const hasCategoriesFilter = Array.isArray(categories) && categories.length > 0;

  if (hasCategoriesFilter) {
    categories.forEach(c => {
      if (c && c.name) {
        const norm = normalizeCategoryType(c.type);
        const nameLower = c.name.trim().toLowerCase();
        categoryTypeMap.set(nameLower, norm);
        categoryCompositeTypeMap.set(`${nameLower}__${norm.toLowerCase()}`, norm);
        validCategoryNames.add(nameLower);
        if (c.id) {
          categoryIdTypeMap.set(c.id, norm);
          validCategoryIds.add(c.id);
        }
      }
    });
  }

  if (Array.isArray(transactions)) {
    transactions.forEach(t => {
      if (Number(t.monthIndex) === targetMonth && Number(t.year) === targetYear) {
        const catNameKey = (t.categoryName || '').trim().toLowerCase();
        const hasValidCategory = (t.categoryId && validCategoryIds.has(t.categoryId)) || validCategoryNames.has(catNameKey);

        // Se uma lista de categorias foi fornecida, ignora lançamentos órfãos de categorias inexistentes
        if (hasCategoriesFilter && !hasValidCategory) {
          return;
        }

        totalLancamentos++;
        const normTxType = t.categoryType ? normalizeCategoryType(t.categoryType) : null;
        const compKey = normTxType ? `${catNameKey}__${normTxType.toLowerCase()}` : '';
        const type = normTxType 
          || (t.categoryId ? categoryIdTypeMap.get(t.categoryId) : null)
          || (compKey ? categoryCompositeTypeMap.get(compKey) : null)
          || categoryTypeMap.get(catNameKey) 
          || 'Conta Fixa';
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
