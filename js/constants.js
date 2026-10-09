/**
 * =============================================================================
 * SISTEMA FINANCEIRO - CONSTANTES & CONFIGURAÇÕES GLOBAIS
 * =============================================================================
 */

export const STORAGE_KEYS = {
  CATEGORIES: 'financas_categorias',
  TRANSACTIONS: 'financas_lancamentos',
  TAGS: 'finance_tags',
  JSONBIN_KEY: 'financas_jsonbin_key',
  JSONBIN_BIN_ID: 'financas_jsonbin_bin_id',
  LAST_UPDATED: 'financas_last_updated'
};

export const DEFAULT_TAGS = [];

export const CATEGORY_TYPES = [
  { id: 'Receita', label: 'Receitas', badgeClass: 'badge-receita', isRevenue: true },
  { id: 'Conta Fixa', label: 'Contas Fixas', badgeClass: 'badge-fixa', isRevenue: false },
  { id: 'Cartão de Crédito', label: 'Cartões de Crédito', badgeClass: 'badge-cartao', isRevenue: false },
  { id: 'Variável Prevista', label: 'Variáveis Previstas', badgeClass: 'badge-variavel', isRevenue: false },
  { id: 'Repasse', label: 'Repasses', badgeClass: 'badge-repasse', isRevenue: true }
];

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];
