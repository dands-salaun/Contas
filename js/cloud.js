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

export function getStoredString(key) {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
  } catch (e) {}
  try {
    const val = sessionStorage.getItem(key);
    if (val !== null) return val;
  } catch (e) {}
  return '';
}

export function setStoredString(key, val) {
  const str = String(val || '');
  try {
    localStorage.setItem(key, str);
  } catch (e) {}
  try {
    sessionStorage.setItem(key, str);
  } catch (e) {}
}

function getFetchSignal(timeoutMs = 15000) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }
  return undefined;
}

export function loadCloudCredentials() {
  const apiKey = (getStoredString(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (getStoredString(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  if (DOM.jsonbinApiKey && !DOM.jsonbinApiKey.value) {
    DOM.jsonbinApiKey.value = apiKey;
  }
  if (DOM.jsonbinBinId && !DOM.jsonbinBinId.value) {
    DOM.jsonbinBinId.value = binId;
  }

  if (apiKey && binId) {
    setCloudStatus('syncing', '☁️ Conectando...');
  } else {
    setCloudStatus('disconnected', '☁️ Nuvem Desconectada');
  }

  updateLastUpdatedUI();
}

export function saveCloudCredentials() {
  const apiKey = (DOM.jsonbinApiKey ? DOM.jsonbinApiKey.value : '').trim();
  const binId = (DOM.jsonbinBinId ? DOM.jsonbinBinId.value : '').trim();

  setStoredString(STORAGE_KEYS.JSONBIN_KEY, apiKey);
  setStoredString(STORAGE_KEYS.JSONBIN_BIN_ID, binId);

  if (apiKey && binId) {
    setCloudStatus('syncing', '☁️ Conectando...');
    const isLocalEmpty = AppState.categories.length === 0 && AppState.transactions.length === 0;
    if (isLocalEmpty) {
      const wantDownload = window.confirm(
        'Credenciais salvas com sucesso! Notamos que o seu aplicativo ainda está vazio localmente. Deseja baixar e restaurar seus dados da nuvem agora?'
      );
      if (wantDownload) {
        syncFromCloud();
        return;
      }
    } else {
      showToast('Credenciais da nuvem guardadas com sucesso!', 'success');
    }
    checkAndSyncCloudOnStartup({ showNotification: true, force: true });
  } else {
    setCloudStatus('disconnected', '☁️ Nuvem Desconectada');
    showToast('Credenciais da nuvem guardadas com sucesso!', 'success');
  }

  updateLastUpdatedUI();
}

export async function syncToCloud() {
  let apiKey = (DOM.jsonbinApiKey ? DOM.jsonbinApiKey.value : '').trim();
  let binId = (DOM.jsonbinBinId ? DOM.jsonbinBinId.value : '').trim();

  if (!apiKey) {
    apiKey = getStoredString(STORAGE_KEYS.JSONBIN_KEY) || '';
    if (DOM.jsonbinApiKey && apiKey) DOM.jsonbinApiKey.value = apiKey;
  }
  if (!binId) {
    binId = getStoredString(STORAGE_KEYS.JSONBIN_BIN_ID) || '';
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

  // Trava de segurança anti-sobrescrita acidental se a lista local estiver vazia
  if (AppState.categories.length === 0 && AppState.transactions.length === 0) {
    const confirmWipe = window.confirm(
      'Atenção: A sua lista local de categorias e lançamentos está vazia. Enviar agora vai apagar tudo o que está guardado na nuvem. Deseja realmente sobrescrever a nuvem com dados vazios?'
    );
    if (!confirmWipe) {
      setCloudStatus('synced', '☁️ Nuvem Atualizada');
      if (DOM.btnSyncToCloud) {
        DOM.btnSyncToCloud.disabled = false;
        DOM.btnSyncToCloud.style.opacity = '';
      }
      return;
    }
  }

  try {
    if (binId) {
      try {
        const checkRes = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}/latest`, {
          method: 'GET',
          headers: {
            'X-Master-Key': apiKey
          },
          signal: getFetchSignal()
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          const cloudRecord = checkData?.record || checkData;
          const cloudLastUpdated = Number(cloudRecord?.lastUpdated) || 0;
          const localLastUpdated = Number(AppState.lastUpdated) || 0;

          const cloudCats = cloudRecord?.categorias || cloudRecord?.categories || [];
          const cloudTrans = cloudRecord?.lancamentos || cloudRecord?.transactions || [];
          const cloudHasData = (Array.isArray(cloudCats) && cloudCats.length > 0) || (Array.isArray(cloudTrans) && cloudTrans.length > 0);
          const isLocalEmpty = AppState.categories.length === 0 && AppState.transactions.length === 0;

          if (isLocalEmpty && cloudHasData) {
            alert('Ação bloqueada por segurança: Seus dados locais estão vazios, mas a sua nuvem possui categorias e lançamentos salvos. Para evitar perda de dados, o upload foi cancelado. Se deseja carregar seus dados na tela, use o botão "Restaurar da Nuvem".');
            setCloudStatus('synced', '☁️ Nuvem Atualizada');
            return;
          }

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
        body: JSON.stringify(payload),
        signal: getFetchSignal()
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
      setStoredString(STORAGE_KEYS.JSONBIN_KEY, apiKey);
      setStoredString(STORAGE_KEYS.JSONBIN_BIN_ID, newBinId);

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
        body: JSON.stringify(payload),
        signal: getFetchSignal()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status} ao atualizar Bin no JSONBin.io`);
      }

      setStoredString(STORAGE_KEYS.JSONBIN_KEY, apiKey);
      setStoredString(STORAGE_KEYS.JSONBIN_BIN_ID, binId);

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
    apiKey = getStoredString(STORAGE_KEYS.JSONBIN_KEY) || '';
    if (DOM.jsonbinApiKey && apiKey) DOM.jsonbinApiKey.value = apiKey;
  }
  if (!binId) {
    binId = getStoredString(STORAGE_KEYS.JSONBIN_BIN_ID) || '';
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
      },
      signal: getFetchSignal()
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

    refreshUI();

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

/**
 * Re-renderiza todos os componentes visuais dependentes dos dados do AppState
 */
export function refreshUI() {
  if (typeof window !== 'undefined' && window.Financas) {
    if (typeof window.Financas.renderTagSelectOptions === 'function') {
      window.Financas.renderTagSelectOptions();
    }
    if (typeof window.Financas.renderManageTagsList === 'function') {
      window.Financas.renderManageTagsList();
    }
    if (typeof window.Financas.rebuildSidebar === 'function') {
      window.Financas.rebuildSidebar();
    }
    if (typeof window.Financas.renderCategoryTable === 'function') {
      window.Financas.renderCategoryTable();
    }
    if (typeof window.Financas.renderDashboard === 'function') {
      window.Financas.renderDashboard();
    }
    if (AppState.currentRoute === 'category' && typeof window.Financas.renderTransactionsTable === 'function') {
      window.Financas.renderTransactionsTable();
      if (typeof window.Financas.updateMonthTotal === 'function') {
        window.Financas.updateMonthTotal();
      }
    }
  }
}

/**
 * Comparador de Estado / Fingerprint (inspirado em areMovieListsEqual do Multiverso)
 * Detecta se categorias, lançamentos e tags locais e remotos são idênticos em conteúdo.
 */
export function areStatesEqual(localState, remoteRecord) {
  if (!remoteRecord || typeof remoteRecord !== 'object') return false;

  const remoteCats = Array.isArray(remoteRecord.categorias)
    ? remoteRecord.categorias
    : (Array.isArray(remoteRecord.categories) ? remoteRecord.categories : []);
  const remoteTrans = Array.isArray(remoteRecord.lancamentos)
    ? remoteRecord.lancamentos
    : (Array.isArray(remoteRecord.transactions) ? remoteRecord.transactions : []);
  const remoteTags = Array.isArray(remoteRecord.tags)
    ? remoteRecord.tags
    : (Array.isArray(remoteRecord.finance_tags) ? remoteRecord.finance_tags : []);

  const localCats = Array.isArray(localState.categories) ? localState.categories : [];
  const localTrans = Array.isArray(localState.transactions) ? localState.transactions : [];
  const localTags = Array.isArray(localState.tags) ? localState.tags : [];

  if (localCats.length !== remoteCats.length ||
      localTrans.length !== remoteTrans.length ||
      localTags.length !== remoteTags.length) {
    return false;
  }

  // Fingerprint das categorias
  const catFingerprint = (list) => list.map(c => 
    `${String(c.id || '')}|${String(c.name || '').trim().toLowerCase()}|${String(c.type || '').trim().toLowerCase()}`
  ).sort().join(';;');
  if (catFingerprint(localCats) !== catFingerprint(remoteCats)) return false;

  // Fingerprint das tags
  const tagFingerprint = (list) => list.map(t => String(t || '').trim().toLowerCase()).sort().join(';;');
  if (tagFingerprint(localTags) !== tagFingerprint(remoteTags)) return false;

  // Fingerprint dos lançamentos
  const transFingerprint = (list) => list.map(t => 
    `${String(t.id || '')}|${Number(t.value || 0)}|${Number(t.monthIndex || 0)}|${Number(t.year || 0)}|${String(t.description || '').trim()}|${String(t.installment || '').trim()}|${Boolean(t.isPaid)}|${String(t.tag || '').trim()}|${String(t.groupId || '')}|${String(t.linkedId || '')}|${String(t.categoryId || '')}|${String(t.categoryName || '').trim().toLowerCase()}|${String(t.categoryType || '').trim().toLowerCase()}|${Boolean(t.isRevenue)}`
  ).sort().join(';;');

  return transFingerprint(localTrans) === transFingerprint(remoteTrans);
}

let isCheckingStartupCloud = false;

export function resetStartupSyncLock() {
  isCheckingStartupCloud = false;
}

/**
 * Verificação e Sincronização Inteligente de Inicialização
 * Executada sempre ao abrir o SPA e ao retornar o foco à aba.
 */
export async function checkAndSyncCloudOnStartup({ silent = true, showNotification = true, force = false } = {}) {
  const apiKey = (getStoredString(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (getStoredString(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  if (!apiKey || !binId) {
    setCloudStatus('disconnected', '☁️ Nuvem Desconectada');
    return { status: 'disconnected' };
  }

  if (force) {
    isCheckingStartupCloud = false;
  }

  if (isCheckingStartupCloud) {
    return { status: 'busy' };
  }
  isCheckingStartupCloud = true;

  setCloudStatus('syncing', '🔄 Verificando nuvem...');

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey
      },
      signal: getFetchSignal()
    });

    if (!response.ok) {
      console.warn(`[Cloud Startup Check] Status retornado: ${response.status}`);
      setCloudStatus('error', '⚠️ Erro ao verificar nuvem');
      return { status: 'error', code: response.status };
    }

    const data = await response.json();
    const record = data?.record || data;

    const incomingCats = record.categorias || record.categories || [];
    const incomingTrans = record.lancamentos || record.transactions || [];
    const incomingTags = record.tags || record.finance_tags || [];

    if (!Array.isArray(incomingCats)) {
      setCloudStatus('error', '⚠️ Formato de nuvem inválido');
      return { status: 'invalid_format' };
    }

    const cloudLastUpdated = Number(record.lastUpdated) || 0;
    const localLastUpdated = Number(AppState.lastUpdated) || 0;

    const areEqual = areStatesEqual(AppState, record);

    // 1. Conteúdo 100% igual: alinha timestamp se necessário e finaliza
    if (areEqual) {
      if (cloudLastUpdated > localLastUpdated) {
        touchLastUpdated(cloudLastUpdated);
      }
      setCloudStatus('synced', '☁️ Nuvem Atualizada');
      return { status: 'up_to_date' };
    }

    const localIsEmpty = AppState.categories.length === 0 && AppState.transactions.length === 0;
    const remoteHasData = incomingCats.length > 0 || incomingTrans.length > 0;

    // 2. Nuvem é mais recente OU local está vazio com nuvem preenchida
    if (cloudLastUpdated > localLastUpdated || (localIsEmpty && remoteHasData)) {
      console.log('[Cloud Startup Check] Versão mais recente encontrada na nuvem. Sincronizando...');

      AppState.categories = incomingCats.map((c, i) => normalizeCategory(c, i));
      AppState.transactions = incomingTrans.map((t, i) => normalizeTransaction(t, i));
      if (Array.isArray(incomingTags)) {
        AppState.tags = incomingTags.map(t => String(t).trim()).filter(Boolean);
        saveTags(AppState.tags, true);
      }

      saveCategories(AppState.categories, true);
      saveTransactions(AppState.transactions, true);

      touchLastUpdated(cloudLastUpdated || Date.now());

      refreshUI();

      setCloudStatus('synced', '☁️ Nuvem Atualizada');

      if (showNotification) {
        showToast('☁️ Nuvem: dados atualizados com sua versão mais recente!', 'success');
      }

      return { status: 'updated_from_cloud', cloudLastUpdated };
    }

    // 3. Local é mais recente que a nuvem (alterações locais pendentes)
    if (localLastUpdated > cloudLastUpdated) {
      console.log('[Cloud Startup Check] Local mais recente que a nuvem. Disparando envio...');
      setCloudStatus('syncing', '🔄 A sincronizar...');
      triggerCloudSync();
      return { status: 'sync_to_cloud_triggered' };
    }

    // 4. Timestamps iguais mas dados diferentes: adota versão da nuvem por segurança
    AppState.categories = incomingCats.map((c, i) => normalizeCategory(c, i));
    AppState.transactions = incomingTrans.map((t, i) => normalizeTransaction(t, i));
    if (Array.isArray(incomingTags)) {
      AppState.tags = incomingTags.map(t => String(t).trim()).filter(Boolean);
      saveTags(AppState.tags, true);
    }
    saveCategories(AppState.categories, true);
    saveTransactions(AppState.transactions, true);
    touchLastUpdated(cloudLastUpdated || Date.now());
    refreshUI();
    setCloudStatus('synced', '☁️ Nuvem Atualizada');
    return { status: 'aligned_with_cloud' };

  } catch (err) {
    console.warn('[Cloud Startup Check] Modo offline ou erro de rede:', err);
    setCloudStatus('error', '☁️ Modo Offline');
    return { status: 'offline', error: err };
  } finally {
    isCheckingStartupCloud = false;
  }
}

let lastFocusCheckTs = 0;

/**
 * Escuta eventos de visibilidade da página e foco para verificar atualizações
 * quando o usuário retorna à aba (com throttle de 30 segundos).
 */
export function setupCloudFocusListener() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const handleFocusCheck = () => {
    if (document.visibilityState === 'visible') {
      const now = Date.now();
      if (now - lastFocusCheckTs >= 30000) {
        lastFocusCheckTs = now;
        checkAndSyncCloudOnStartup({ silent: true, showNotification: true });
      }
    }
  };

  window.addEventListener('focus', handleFocusCheck);
  document.addEventListener('visibilitychange', handleFocusCheck);
}

export async function executeAutoCloudSync() {
  const apiKey = (getStoredString(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (getStoredString(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  if (!apiKey || !binId) {
    return;
  }

  // Trava de segurança anti-sobrescrita: se o app local estiver vazio, NUNCA enviar automaticamente para a nuvem
  if (AppState.categories.length === 0 && AppState.transactions.length === 0) {
    console.warn('[AutoSync Abortado] Sessão local está vazia. Auto-save cancelado para proteger os dados da nuvem.');
    return;
  }

  try {
    const checkRes = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey
      },
      signal: getFetchSignal()
    });

    if (checkRes.ok) {
      const checkData = await checkRes.json();
      const cloudRecord = checkData?.record || checkData;
      const cloudLastUpdated = Number(cloudRecord?.lastUpdated) || 0;
      const localLastUpdated = Number(AppState.lastUpdated) || 0;

      const cloudCats = cloudRecord?.categorias || cloudRecord?.categories || [];
      const cloudTrans = cloudRecord?.lancamentos || cloudRecord?.transactions || [];
      const cloudHasData = (Array.isArray(cloudCats) && cloudCats.length > 0) || (Array.isArray(cloudTrans) && cloudTrans.length > 0);
      const isLocalEmpty = AppState.categories.length === 0 && AppState.transactions.length === 0;

      if (isLocalEmpty && cloudHasData) {
        console.warn('[AutoSync Bloqueado] Nuvem possui dados e a sessão local está vazia. Auto-save cancelado para proteger a nuvem.');
        setCloudStatus('synced', '☁️ Nuvem Atualizada');
        return;
      }

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
      body: JSON.stringify(payload),
      signal: getFetchSignal()
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
  const apiKey = (getStoredString(STORAGE_KEYS.JSONBIN_KEY) || '').trim();
  const binId = (getStoredString(STORAGE_KEYS.JSONBIN_BIN_ID) || '').trim();

  if (!apiKey || !binId) {
    return;
  }

  setCloudStatus('syncing', '🔄 A sincronizar...');
  debouncedAutoCloudSync();
}

// Vincula o triggerCloudSync como hook padrão para persistência no storage
setCloudSyncHook(triggerCloudSync);
