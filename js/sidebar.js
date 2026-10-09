/**
 * =============================================================================
 * SISTEMA FINANCEIRO - SIDEBAR DINÂMICA
 * =============================================================================
 */

import { DOM } from './dom.js';
import { AppState } from './state.js';
import { CATEGORY_TYPES } from './constants.js';
import { normalizeCategoryType } from './normalization.js';
import { escapeHTML } from './utils.js';
import { navigateTo } from './router.js';

export function rebuildSidebar() {
  if (!DOM.dynamicCategorySections) return;
  DOM.dynamicCategorySections.innerHTML = '';
  const matchedCategoryIds = new Set();

  CATEGORY_TYPES.forEach(typeObj => {
    const categoriesOfType = AppState.categories.filter(c => {
      const match = normalizeCategoryType(c.type) === typeObj.id;
      if (match) matchedCategoryIds.add(c.id);
      return match;
    });

    const groupContainer = document.createElement('div');
    groupContainer.className = 'nav-section';

    const groupHeader = document.createElement('div');
    groupHeader.className = 'type-group-header';
    groupHeader.innerHTML = `
      <span>${escapeHTML(typeObj.label)}</span>
      <span class="type-badge-count">${categoriesOfType.length}</span>
    `;
    groupContainer.appendChild(groupHeader);

    if (categoriesOfType.length === 0) {
      const emptyHint = document.createElement('div');
      emptyHint.className = 'type-empty-hint';
      emptyHint.textContent = 'Nenhuma cadastrada';
      groupContainer.appendChild(emptyHint);
    } else {
      const list = document.createElement('ul');
      list.className = 'nav-list';

      categoriesOfType.forEach(cat => {
        const li = document.createElement('li');
        const isActive = (AppState.currentRoute === 'category' && AppState.activeCategoryId === cat.id);

        li.innerHTML = `
          <button class="category-item-link ${isActive ? 'active' : ''}" data-category-id="${escapeHTML(cat.id)}" title="${escapeHTML(cat.name)}">
            <span class="category-bullet"></span>
            <span>${escapeHTML(cat.name)}</span>
          </button>
        `;

        li.querySelector('button').addEventListener('click', () => {
          navigateTo('category', cat.id);
        });

        list.appendChild(li);
      });

      groupContainer.appendChild(list);
    }

    DOM.dynamicCategorySections.appendChild(groupContainer);
  });

  const remainingCategories = AppState.categories.filter(c => !matchedCategoryIds.has(c.id));
  if (remainingCategories.length > 0) {
    const extraGroup = document.createElement('div');
    extraGroup.className = 'nav-section';

    const extraHeader = document.createElement('div');
    extraHeader.className = 'type-group-header';
    extraHeader.innerHTML = `
      <span>Outras Categorias</span>
      <span class="type-badge-count">${remainingCategories.length}</span>
    `;
    extraGroup.appendChild(extraHeader);

    const extraList = document.createElement('ul');
    extraList.className = 'nav-list';

    remainingCategories.forEach(cat => {
      const li = document.createElement('li');
      const isActive = (AppState.currentRoute === 'category' && AppState.activeCategoryId === cat.id);

      li.innerHTML = `
        <button class="category-item-link ${isActive ? 'active' : ''}" data-category-id="${escapeHTML(cat.id)}" title="${escapeHTML(cat.name)}">
          <span class="category-bullet"></span>
          <span>${escapeHTML(cat.name)}</span>
        </button>
      `;

      li.querySelector('button').addEventListener('click', () => {
        navigateTo('category', cat.id);
      });

      extraList.appendChild(li);
    });

    extraGroup.appendChild(extraList);
    DOM.dynamicCategorySections.appendChild(extraGroup);
  }
}
