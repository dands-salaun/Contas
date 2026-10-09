/**
 * =============================================================================
 * SISTEMA FINANCEIRO - ROTEADOR SPA (SINGLE PAGE APPLICATION)
 * =============================================================================
 */

import { DOM } from './dom.js';
import { AppState } from './state.js';

export function closeMobileSidebar() {
  if (DOM.sidebar) {
    DOM.sidebar.classList.remove('sidebar-open');
    DOM.sidebar.classList.remove('open');
  }
  if (DOM.sidebarOverlay) {
    DOM.sidebarOverlay.classList.remove('active');
  }
}

export function resetAllForms() {
  if (typeof window !== 'undefined' && typeof window.Financas?.cancelEditingTransaction === 'function') {
    window.Financas.cancelEditingTransaction();
  }

  if (DOM.categoryForm) DOM.categoryForm.reset();
  if (DOM.transactionForm) DOM.transactionForm.reset();

  if (DOM.nameError) DOM.nameError.textContent = '';
  if (DOM.typeError) DOM.typeError.textContent = '';
  if (DOM.categoryNameInput) DOM.categoryNameInput.style.borderColor = '';
  if (DOM.categoryTypeSelect) DOM.categoryTypeSelect.style.borderColor = '';

  if (DOM.transDescError) DOM.transDescError.textContent = '';
  if (DOM.transInstallmentError) DOM.transInstallmentError.textContent = '';
  if (DOM.transValueError) DOM.transValueError.textContent = '';
  if (DOM.transDescriptionInput) DOM.transDescriptionInput.style.borderColor = '';
  if (DOM.transInstallmentInput) DOM.transInstallmentInput.style.borderColor = '';
  if (DOM.transValueInput) DOM.transValueInput.style.borderColor = '';
}

export function navigateTo(route, categoryId = null) {
  closeMobileSidebar();
  resetAllForms();
  AppState.currentRoute = route;
  AppState.activeCategoryId = categoryId;

  DOM.fixedNavLinks.forEach(link => {
    if (link.getAttribute('data-route') === route) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  document.querySelectorAll('.category-item-link').forEach(link => {
    if (route === 'category' && link.getAttribute('data-category-id') === categoryId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  if (DOM.viewDashboard) DOM.viewDashboard.classList.remove('active');
  if (DOM.viewConfiguracoes) DOM.viewConfiguracoes.classList.remove('active');
  if (DOM.viewCategoryDetail) DOM.viewCategoryDetail.classList.remove('active');

  if (route === 'dashboard') {
    if (DOM.headerTitle) DOM.headerTitle.textContent = 'Dashboard';
    if (DOM.viewDashboard) DOM.viewDashboard.classList.add('active');
    if (typeof window !== 'undefined' && typeof window.Financas?.renderDashboard === 'function') {
      window.Financas.renderDashboard();
    }
  } else if (route === 'configuracoes') {
    if (DOM.headerTitle) DOM.headerTitle.textContent = 'Configurações';
    if (DOM.viewConfiguracoes) DOM.viewConfiguracoes.classList.add('active');
    if (typeof window !== 'undefined' && typeof window.Financas?.renderCategoryTable === 'function') {
      window.Financas.renderCategoryTable();
    }
    if (typeof window !== 'undefined' && typeof window.Financas?.loadCloudCredentials === 'function') {
      window.Financas.loadCloudCredentials();
    }
  } else if (route === 'category' && categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (category) {
      if (DOM.headerTitle) DOM.headerTitle.textContent = category.name;
      if (DOM.viewCategoryDetail) DOM.viewCategoryDetail.classList.add('active');
      if (typeof window !== 'undefined' && typeof window.Financas?.setupCategoryDetailView === 'function') {
        window.Financas.setupCategoryDetailView(category);
      }
    } else {
      navigateTo('configuracoes');
    }
  }

  if (window.innerWidth <= 768 && DOM.sidebar) {
    DOM.sidebar.classList.remove('open');
  }
}
