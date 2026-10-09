/**
 * =============================================================================
 * SISTEMA FINANCEIRO - SINCRONIZAÇÃO NA NUVEM (JSONBIN.IO REST API)
 * Inclui auto-save debounced e travas de segurança contra sobrescrita
 * =============================================================================
 */

import { STORAGE_KEYS } from './constants.js';
import { DOM } from './dom.js';
import { AppState } from './state.js';
import { setCloudStatus, showToast, debounce } from './utils.js';
import { touchLastUpdated, saveCategories, saveTransactions, saveTags, updateLastUpdatedUI, setCloudSyncHook } from './storage.js';
import { normalizeCategory, normalizeTransaction } from './normalization.js';

export function loadCloudCredentials() {
  const apiKey = (localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  if (DOM.jsonbinApiKey && !DOM.jsonbinApiKey.value) {
    DOM.jsonbinApiKey.value = apiKey;
  }
  if (DOM.jsonbinBinId && !DOM.jsonbinBinId.value) {
    DOM.jsonbinBinId.value = binId;
  }

  if (apiKey && binId) {
    setCloudStatus('synced', '☁️ Nuvem Atualizada');
  } else {
    setCloudStatus('disconnected', '☁️ Nuvem Atualizada');
  }

  updateLastUpdatedUI();
}

export function saveCloudCredentials() {
  const apiKey = (DOM.jsonbinApiKey ? DOM.jsonbinApiKey.value : '').trim();
  const binId = (DOM.jsonbinBinId ? DOM.jsonbinBinId.value : '').trim();

  localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, apiKey);
  localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, binId);

  if (apiKey && binId) {
    setCloudStatus('synced', '☁️ Nuvem Atualizada');
    triggerCloudSync();
  } else {
    setCloudStatus('disconnected', '☁️ Nuvem Atualizada');
  }

  updateLastUpdatedUI();
  showToast('Credenciais da nuvem guardadas com sucesso!', 'success');
}

export async function syncToCloud() {
  let apiKey = (DOM.jsonbinApiKey ? DOM.jsonbinApiKey.value : '').trim();
  let binId = (DOM.jsonbinBinId ? DOM.jsonbinBinId.value : '').trim();

  if (!apiKey) {
    apiKey = localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '';
    if (DOM.jsonbinApiKey && apiKey) DOM.jsonbinApiKey.value = apiKey;
  }
  if (!binId) {
    binId = localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '';
    if (DOM.jsonbinBinId && binId) DOM.jsonbinBinId.value = binId;
  }

  if (!apiKey) {
    showToast('Erro: É necessário introduzir a sua API Key (X-Master-Key) para enviar para a nuvem.', 'error');
    DOM.jsonbinApiKey?.focus();
    return;
  }

  if (DOM.btnSyncToCloud) {
    DOM.btnSyncToCloud.disabled = true;
    DOM.btnSyncToCloud.style.opacity = '0.7';
  }
  setCloudStatus('syncing', '🔄 A sincronizar...');

  try {
    if (binId) {
      try {
        const checkRes = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}/latest`, {
          method: 'GET',
          headers: {
            'X-Master-Key': apiKey
          }
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          const cloudRecord = checkData?.record || checkData;
          const cloudLastUpdated = Number(cloudRecord?.lastUpdated) || 0;
          const localLastUpdated = Number(AppState.lastUpdated) || 0;

          if (cloudLastUpdated > localLastUpdated) {
            const forceUpload = window.confirm(
              'Atenção: Os dados na nuvem são mais recentes que os seus dados locais. Se continuar, você vai sobrescrever dados mais novos. Deseja forçar o upload?'
            );
            if (!forceUpload) {
              setCloudStatus('synced', '☁️ Nuvem Atualizada');
              return;
            }
          }
        }
      } catch (checkErr) {
        console.warn('Não foi possível verificar a versão da nuvem previamente:', checkErr);
      }
    }

    const uploadTs = Date.now();
    const payload = {
      lastUpdated: uploadTs,
      categorias: AppState.categories,
      lancamentos: AppState.transactions,
      tags: AppState.tags || []
    };

    if (!binId) {
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey,
          'X-Bin-Name': 'FinancasPro_Backup'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status} ao criar Bin no JSONBin.io`);
      }

      const data = await response.json();
      const newBinId = data?.metadata?.id;

      if (!newBinId) {
        throw new Error('A resposta do JSONBin.io não contém o ID do Bin criado.');
      }

      if (DOM.jsonbinBinId) DOM.jsonbinBinId.value = newBinId;
      localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, apiKey);
      localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, newBinId);

      touchLastUpdated(uploadTs);
      setCloudStatus('synced', '☁️ Nuvem Atualizada');
      showToast(`Backup enviado para a nuvem! Novo Bin ID: ${newBinId}`, 'success');
    } else {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status} ao atualizar Bin no JSONBin.io`);
      }

      localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, apiKey);
      localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, binId);

      touchLastUpdated(uploadTs);
      setCloudStatus('synced', '☁️ Nuvem Atualizada');
      showToast(`Backup atualizado na nuvem com sucesso! (Bin: ${binId})`, 'success');
    }
  } catch (err) {
    console.error('Falha ao enviar backup para o JSONBin:', err);
    setCloudStatus('error', '⚠️ Erro na Nuvem');
    showToast(`Falha ao enviar backup para a nuvem: ${err.message || err}`, 'error');
  } finally {
    if (DOM.btnSyncToCloud) {
      DOM.btnSyncToCloud.disabled = false;
      DOM.btnSyncToCloud.style.opacity = '';
    }
  }
}

export async function syncFromCloud() {
  let apiKey = (DOM.jsonbinApiKey ? DOM.jsonbinApiKey.value : '').trim();
  let binId = (DOM.jsonbinBinId ? DOM.jsonbinBinId.value : '').trim();

  if (!apiKey) {
    apiKey = localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '';
    if (DOM.jsonbinApiKey && apiKey) DOM.jsonbinApiKey.value = apiKey;
  }
  if (!binId) {
    binId = localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '';
    if (DOM.jsonbinBinId && binId) DOM.jsonbinBinId.value = binId;
  }

  if (!apiKey) {
    showToast('Erro: É necessário introduzir a sua API Key (X-Master-Key) para restaurar da nuvem.', 'error');
    DOM.jsonbinApiKey?.focus();
    return;
  }

  if (!binId) {
    showToast('Erro: É necessário indicar o Bin ID para restaurar os dados da nuvem.', 'error');
    DOM.jsonbinBinId?.focus();
    return;
  }

  if (DOM.btnSyncFromCloud) {
    DOM.btnSyncFromCloud.disabled = true;
    DOM.btnSyncFromCloud.style.opacity = '0.7';
  }
  setCloudStatus('syncing', '🔄 A sincronizar...');

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: Bin ID ou API Key inválidos.`);
    }

    const data = await response.json();
    const record = data?.record || data;

    const incomingCats = record.categorias || record.categories || [];
    const incomingTrans = record.lancamentos || record.transactions || [];
    const incomingTags = record.tags || record.finance_tags || [];

    if (!Array.isArray(incomingCats)) {
      throw new Error('A estrutura dos dados na nuvem é inválida (categorias ausentes ou formato incorreto).');
    }

    const cloudLastUpdated = Number(record.lastUpdated) || 0;
    const localLastUpdated = Number(AppState.lastUpdated) || 0;

    if (localLastUpdated > cloudLastUpdated) {
      const forceDownload = window.confirm(
        'Atenção: Você tem alterações locais que ainda não foram enviadas para a nuvem. Baixar os dados agora vai apagar o seu trabalho não salvo. Deseja forçar o download?'
      );
      if (!forceDownload) {
        setCloudStatus('synced', '☁️ Nuvem Atualizada');
        return;
      }
    }

    AppState.categories = incomingCats.map((c, i) => normalizeCategory(c, i));
    AppState.transactions = incomingTrans.map((t, i) => normalizeTransaction(t, i));
    if (Array.isArray(incomingTags)) {
      AppState.tags = incomingTags.map(t => String(t).trim()).filter(Boolean);
      saveTags(AppState.tags, true);
      if (typeof window !== 'undefined' && typeof window.Financas?.renderTagSelectOptions === 'function') {
        window.Financas.renderTagSelectOptions();
      }
      if (typeof window !== 'undefined' && typeof window.Financas?.renderManageTagsList === 'function') {
        window.Financas.renderManageTagsList();
      }
    }

    saveCategories(AppState.categories, true);
    saveTransactions(AppState.transactions, true);

    touchLastUpdated(cloudLastUpdated || Date.now());

    localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, apiKey);
    localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, binId);

    if (typeof window !== 'undefined' && window.Financas) {
      if (typeof window.Financas.rebuildSidebar === 'function') window.Financas.rebuildSidebar();
      if (typeof window.Financas.renderCategoryTable === 'function') window.Financas.renderCategoryTable();
      if (typeof window.Financas.renderDashboard === 'function') window.Financas.renderDashboard();
    }

    setCloudStatus('synced', '☁️ Nuvem Atualizada');
    showToast(
      `Dados restaurados da nuvem! ${AppState.categories.length} categorias e ${AppState.transactions.length} lançamentos recuperados.`,
      'success'
    );
  } catch (err) {
    console.error('Falha ao restaurar dados do JSONBin:', err);
    setCloudStatus('error', '⚠️ Erro na Nuvem');
    showToast(`Falha ao restaurar dados da nuvem: ${err.message || err}`, 'error');
  } finally {
    if (DOM.btnSyncFromCloud) {
      DOM.btnSyncFromCloud.disabled = false;
      DOM.btnSyncFromCloud.style.opacity = '';
    }
  }
}

export async function executeAutoCloudSync() {
  const apiKey = (localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  if (!apiKey || !binId) {
    return;
  }

  try {
    const checkRes = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey
      }
    });

    if (checkRes.ok) {
      const checkData = await checkRes.json();
      const cloudRecord = checkData?.record || checkData;
      const cloudLastUpdated = Number(cloudRecord?.lastUpdated) || 0;
      const localLastUpdated = Number(AppState.lastUpdated) || 0;

      if (cloudLastUpdated > localLastUpdated) {
        console.warn('[AutoSync Abortado] Nuvem possui dados mais recentes que a sessão local. Auto-save abortado para evitar perda de dados.');
        setCloudStatus('error', '⚠️ Conflito: Nuvem mais recente');
        return;
      }
    }

    setCloudStatus('syncing', '🔄 A sincronizar...');

    const uploadTs = Date.now();
    const payload = {
      lastUpdated: uploadTs,
      categorias: AppState.categories,
      lancamentos: AppState.transactions,
      tags: AppState.tags || []
    };

    const response = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status} na API`);
    }

    touchLastUpdated(uploadTs);
    setCloudStatus('synced', '☁️ Nuvem Atualizada');
    console.log('[AutoSync] Dados sincronizados na nuvem com sucesso.');
  } catch (err) {
    console.error('[AutoSync] Falha na sincronização em segundo plano:', err);
    setCloudStatus('error', '⚠️ Erro na Nuvem');
  }
}

export const debouncedAutoCloudSync = debounce(executeAutoCloudSync, 3000);

export function triggerCloudSync() {
  const apiKey = (localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  if (!apiKey || !binId) {
    return;
  }

  setCloudStatus('syncing', '🔄 A sincronizar...');
  debouncedAutoCloudSync();
}

// Vincula o triggerCloudSync como hook padrão para persistência no storage
setCloudSyncHook(triggerCloudSync);
