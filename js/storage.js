/**
 * =============================================================================
 * SISTEMA FINANCEIRO - MOTOR DE ARMAZENAMENTO SEGURO & PERSISTÊNCIA
 * =============================================================================
 */

import { STORAGE_KEYS } from './constants.js';
import { normalizeCategory, normalizeTransaction } from './normalization.js';
import { DOM } from './dom.js';

let cloudSyncHook = null;
let toastHook = null;

export function setCloudSyncHook(fn) {
  cloudSyncHook = fn;
}

export function setToastHook(fn) {
  toastHook = fn;
}

function notifyCloudSync() {
  if (typeof cloudSyncHook === 'function') {
    cloudSyncHook();
  } else if (typeof window !== 'undefined' && typeof window.Financas?.triggerCloudSync === 'function') {
    window.Financas.triggerCloudSync();
  }
}

function notifyToast(message, type) {
  if (typeof toastHook === 'function') {
    toastHook(message, type);
  } else if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
    window.showToast(message, type);
  }
}

export const StorageEngine = {
  isAvailable: false,

  init() {
    try {
      const testKey = '__financas_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      this.isAvailable = true;
    } catch (e) {
      console.warn('localStorage inacessível. Usando sessionStorage como fallback seguro:', e);
      this.isAvailable = false;
    }
  },

  set(key, data) {
    const serialized = JSON.stringify(data);
    let success = false;

    try {
      localStorage.setItem(key, serialized);
      const verify = localStorage.getItem(key);
      if (verify === serialized) success = true;
    } catch (err) {
      console.error(`Erro ao salvar no localStorage para [${key}]:`, err);
    }

    try {
      sessionStorage.setItem(key, serialized);
    } catch (e) {}

    return success;
  },

  get(key) {
    try {
      const fromLocal = localStorage.getItem(key);
      if (fromLocal) return JSON.parse(fromLocal);
    } catch (e) {
      console.warn(`Falha na leitura do localStorage [${key}]:`, e);
    }

    try {
      const fromSession = sessionStorage.getItem(key);
      if (fromSession) return JSON.parse(fromSession);
    } catch (e) {}

    return null;
  }
};

StorageEngine.init();

export function loadLastUpdated() {
  const data = StorageEngine.get(STORAGE_KEYS.LAST_UPDATED);
  if (data && typeof data === 'number') return data;
  if (data && !isNaN(Number(data))) return Number(data);
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
    if (raw && !isNaN(Number(raw))) return Number(raw);
  } catch (e) {}
  return 0;
}

export function formatTimestamp(ts) {
  if (!ts || isNaN(Number(ts)) || Number(ts) <= 0) return 'Nunca';
  try {
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return 'Nunca';
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return 'Nunca';
  }
}

export function updateLastUpdatedUI(customTs) {
  if (DOM.cloudLastUpdatedText) {
    const ts = customTs !== undefined ? customTs : loadLastUpdated();
    const formatted = formatTimestamp(ts);
    DOM.cloudLastUpdatedText.textContent = `Última modificação local: ${formatted}`;
  }
}

export function touchLastUpdated(ts = Date.now()) {
  const numTs = Number(ts) || Date.now();
  if (typeof window !== 'undefined' && window.Financas?.AppState) {
    window.Financas.AppState.lastUpdated = numTs;
  }
  StorageEngine.set(STORAGE_KEYS.LAST_UPDATED, numTs);
  updateLastUpdatedUI(numTs);
  return numTs;
}

export function loadCategories() {
  const data = StorageEngine.get(STORAGE_KEYS.CATEGORIES);
  if (Array.isArray(data) && data.length > 0) {
    return data.map((c, idx) => normalizeCategory(c, idx)).filter(c => c.name.length > 0);
  }
  return [];
}

export function saveCategories(categories, skipTouch = false) {
  const saved = StorageEngine.set(STORAGE_KEYS.CATEGORIES, categories);
  if (!skipTouch) {
    touchLastUpdated();
    notifyCloudSync();
  }
  if (!saved) {
    notifyToast('Atenção: verifique se o navegador bloqueia dados locais.', 'error');
  }
  return saved;
}

export function loadTransactions() {
  const data = StorageEngine.get(STORAGE_KEYS.TRANSACTIONS);
  if (Array.isArray(data) && data.length > 0) {
    return data.map((t, idx) => normalizeTransaction(t, idx)).filter(t => t.categoryName.length > 0);
  }
  return [];
}

export function saveTransactions(transactions, skipTouch = false) {
  const saved = StorageEngine.set(STORAGE_KEYS.TRANSACTIONS, transactions);
  if (!skipTouch) {
    touchLastUpdated();
    notifyCloudSync();
  }
  if (!saved) {
    notifyToast('Atenção: verifique se o navegador bloqueia dados locais.', 'error');
  }
  return saved;
}

export function loadTags() {
  let data = StorageEngine.get(STORAGE_KEYS.TAGS);
  if (!data) {
    data = StorageEngine.get('financas_tags');
  }
  if (Array.isArray(data)) {
    return data.map(t => String(t).trim()).filter(Boolean);
  }
  saveTags([], true);
  return [];
}

export function saveTags(tags, skipTouch = false) {
  const list = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [];
  const saved = StorageEngine.set(STORAGE_KEYS.TAGS, list);
  StorageEngine.set('financas_tags', list);
  if (!skipTouch) {
    touchLastUpdated();
    notifyCloudSync();
  }
  return saved;
}
