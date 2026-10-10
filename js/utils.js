/**
 * =============================================================================
 * SISTEMA FINANCEIRO - FEEDBACK VISUAL & UTILITÁRIOS
 * =============================================================================
 */

import { DOM } from './dom.js';
import { setToastHook } from './storage.js';

export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Exibe notificação flutuante (Toast) adaptada ao Dark Mode.
 * @param {string} message Texto da notificação
 * @param {'success'|'error'|'info'} type Tipo do alerta
 */
export function showToast(message, type = 'success') {
  const container = DOM.toastContainer;
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  toast.innerHTML = `${icon}<span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, 3000);
}

// Vincula ao storage e global
setToastHook(showToast);
if (typeof window !== 'undefined') {
  window.showToast = showToast;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

/**
 * Aplica máscara dinâmica de moeda (BRL) em tempo real no evento input.
 * Permite valores negativos para estornos sem travar ao apagar dígitos.
 * @param {Event} e - Evento input
 */
export function handleCurrencyInput(e) {
  const input = e.target;
  let rawValue = input.value;

  if (!rawValue || rawValue.trim() === '' || rawValue.trim() === '-') {
    return;
  }

  const isNegative = rawValue.includes('-');
  const digits = rawValue.replace(/\D/g, '');

  if (!digits || digits === '0') {
    input.value = isNegative ? '-R$ 0,00' : 'R$ 0,00';
    return;
  }

  const valor = parseFloat(digits) / 100;
  let valorFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);

  if (isNegative) {
    valorFormatado = '-' + valorFormatado.replace(/^-/, '');
  }

  input.value = valorFormatado;
}

/**
 * Desmascara string de moeda BRL para float para persistência e cálculos.
 * @param {string|number} valorFormatado - Ex: "1.500,00", "R$ 1.500,00", "-R$ 50,00"
 * @returns {number} Valor numérico float
 */
export function parseCurrencyToFloat(valorFormatado) {
  if (typeof valorFormatado === 'number') {
    return isNaN(valorFormatado) ? 0 : valorFormatado;
  }
  if (!valorFormatado || typeof valorFormatado !== 'string') {
    return 0;
  }

  const isNegative = valorFormatado.includes('-');
  let limpo = valorFormatado
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '');

  limpo = limpo.replace(',', '.');
  let valorFloat = parseFloat(limpo);

  if (isNaN(valorFloat)) {
    return 0;
  }

  if (isNegative && valorFloat > 0) {
    valorFloat = -valorFloat;
  }

  return valorFloat;
}

/**
 * Debounce para evitar sobrecarga de requisições
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 3000) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  const debounced = function(...args) {
    lastArgs = args;
    lastThis = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(lastThis, lastArgs);
    }, delay);
  };

  debounced.flush = function() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      return fn.apply(lastThis, lastArgs);
    }
  };

  debounced.pending = function() {
    return Boolean(timer);
  };

  return debounced;
}

/**
 * Atualiza o indicador #cloudStatus no cabeçalho
 */
export function setCloudStatus(state, customText) {
  if (!DOM.cloudStatus) return;

  DOM.cloudStatus.classList.remove('syncing', 'synced', 'error', 'disconnected', 'pending');

  if (state === 'syncing') {
    DOM.cloudStatus.classList.add('syncing');
    DOM.cloudStatus.textContent = customText || '🔄 A sincronizar...';
    DOM.cloudStatus.style.color = '#f59e0b';
    DOM.cloudStatus.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    DOM.cloudStatus.style.backgroundColor = 'rgba(245, 158, 11, 0.12)';
  } else if (state === 'synced') {
    DOM.cloudStatus.classList.add('synced');
    DOM.cloudStatus.textContent = customText || '☁️ Nuvem Atualizada';
    DOM.cloudStatus.style.color = '#10b981';
    DOM.cloudStatus.style.borderColor = 'rgba(16, 185, 129, 0.35)';
    DOM.cloudStatus.style.backgroundColor = 'rgba(16, 185, 129, 0.12)';
  } else if (state === 'pending') {
    DOM.cloudStatus.classList.add('pending');
    DOM.cloudStatus.textContent = customText || '🔑 Chave Salva';
    DOM.cloudStatus.style.color = '#3b82f6';
    DOM.cloudStatus.style.borderColor = 'rgba(59, 130, 246, 0.4)';
    DOM.cloudStatus.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
  } else if (state === 'error') {
    DOM.cloudStatus.classList.add('error');
    DOM.cloudStatus.textContent = customText || '⚠️ Erro na Nuvem';
    DOM.cloudStatus.style.color = '#ef4444';
    DOM.cloudStatus.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    DOM.cloudStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
  } else {
    DOM.cloudStatus.classList.add('disconnected');
    DOM.cloudStatus.textContent = customText || '☁️ Nuvem Desconectada';
    DOM.cloudStatus.style.color = '';
    DOM.cloudStatus.style.borderColor = '';
    DOM.cloudStatus.style.backgroundColor = '';
  }
}
