/**
 * =============================================================================
 * SISTEMA FINANCEIRO - NORMALIZAÇÃO ROBUSTA DE DADOS
 * =============================================================================
 */

export function normalizeCategoryType(rawType) {
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

export function normalizeCategory(item, idx = 0) {
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

export function normalizeTransaction(item, idx = 0) {
  const id = item.id ? String(item.id) : ('lanc_' + Date.now() + '_' + idx);
  const groupId = item.groupId ? String(item.groupId) : null;
  const linkedId = item.linkedId ? String(item.linkedId) : null;
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
  const isRevenue = item.isRevenue !== undefined ? Boolean(item.isRevenue) : undefined;
  const categoryType = item.categoryType ? normalizeCategoryType(item.categoryType) : undefined;
  const tag = (item.tag || item.classificacao || item.classification || '').toString().trim();

  return { id, groupId, linkedId, categoryId, categoryName, categoryType, year, monthIndex, description, installment, value, isPaid, isRevenue, tag };
}
