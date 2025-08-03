// gallery.js - portfolio gallery interactions (ESM)
// Implements: filters, count announcements, and lightbox bindings (hooks)

import { on, delegate, qsa, togglePressed, liveRegion, prefersReducedMotion, getHashParam, setHashParam } from './utils.js';

const state = {
  items: [],
  activeFilter: 'all',
  page: 1,
  pageSize: 12
};

let refs = {
  grid: null,
  filters: null,
  countNode: null
};

function initRefs() {
  refs.grid = document.querySelector('[data-gallery-grid]');
  refs.filters = document.querySelector('[data-gallery-filters]');
  refs.countNode = document.querySelector('[data-gallery-count]');
}

function hydrateItems() {
  if (!refs.grid) return;
  state.items = qsa(refs.grid, '[data-gallery-item]');
}

/**
 * matchFilter - returns true if item matches active filter
 * Item tags are read from data-tags as space or comma separated list
 */
function matchFilter(item, filter) {
  if (filter === 'all') return true;
  const tagsAttr = item.getAttribute('data-tags') || '';
  const tags = tagsAttr.split(/[,\\s]+/).filter(Boolean).map(t => t.toLowerCase());
  return tags.includes(filter.toLowerCase());
}

/**
 * applyFilter - toggle visibility class only (CSS controls animation)
 */
export function applyFilter(value = 'all', announce = true) {
  state.activeFilter = value;

  // Update pressed states for buttons
  if (refs.filters) {
    const buttons = qsa(refs.filters, '[data-filter]');
    buttons.forEach(btn => {
      const v = btn.getAttribute('data-filter') || 'all';
      const isActive = v === value;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.toggleAttribute('data-active', isActive);
    });
  }

  // Show/hide items by class to leverage CSS tokens
  let visibleCount = 0;
  state.items.forEach(item => {
    const show = matchFilter(item, value);
    item.toggleAttribute('data-hidden', !show);
    if (show) visibleCount++;
  });

  // Update count node and announce
  if (refs.countNode) {
    refs.countNode.textContent = String(visibleCount);
  }
  if (announce) {
    liveRegion(`${visibleCount} items ${value === 'all' ? '' : `matching ${value}`} shown`, 'polite');
  }
}

/**
 * Sync filter to/from URL hash (#filter=tag)
 */
function applyFromHash() {
  const f = getHashParam('filter') || 'all';
  applyFilter(f, false);
}
function pushFilterToHash(value) {
  if (value === 'all') {
    setHashParam('filter', null);
  } else {
    setHashParam('filter', value);
  }
}

/**
 * initFilters - click/keyboard operable filter controls
 */
function initFilters() {
  if (!refs.filters) return;

  // Use event delegation for robustness
  delegate(refs.filters, 'click', '[data-filter]', (e, btn) => {
    e.preventDefault();
    const value = btn.getAttribute('data-filter') || 'all';
    applyFilter(value);
    pushFilterToHash(value);
  });

  // Keyboard support for Enter/Space if needed
  delegate(refs.filters, 'keydown', '[data-filter]', (e, btn) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const value = btn.getAttribute('data-filter') || 'all';
      applyFilter(value);
      pushFilterToHash(value);
    }
  }, false);
}

/**
 * initLightboxBindings - delegate to open lightbox from gallery cards
 * Actual lightbox implementation resides in lightbox.js; we dispatch a custom event
 */
function initLightboxBindings() {
  if (!refs.grid) return;
  delegate(refs.grid, 'click', '[data-gallery-item] a, [data-gallery-item] button, [data-gallery-item] [data-lightbox-trigger]', (e, target) => {
    const card = target.closest('[data-gallery-item]');
    if (!card) return;
    const index = state.items.indexOf(card);
    if (index >= 0) {
      e.preventDefault();
      const ev = new CustomEvent('lightbox:open', { bubbles: true, detail: { index } });
      card.dispatchEvent(ev);
    }
  });

  // Keyboard open via Enter when card is focused (if card itself is interactive)
  delegate(refs.grid, 'keydown', '[data-gallery-item]', (e, card) => {
    if (e.key === 'Enter') {
      const index = state.items.indexOf(card);
      if (index >= 0) {
        e.preventDefault();
        const ev = new CustomEvent('lightbox:open', { bubbles: true, detail: { index } });
        card.dispatchEvent(ev);
      }
    }
  }, false);
}

/**
 * updateInitialState - hydrate, set initial filter from hash or defaults
 */
function updateInitialState() {
  hydrateItems();
  applyFromHash();
}

/**
 * observeHashChanges - keep UI in sync with back/forward
 */
function observeHashChanges() {
  on(window, 'hashchange', () => {
    applyFromHash();
  }, false);
}

export function initGallery() {
  initRefs();
  if (!refs.grid) return; // Progressive enhancement guard

  updateInitialState();
  initFilters();
  initLightboxBindings();
  observeHashChanges();
}

// Auto-init on DOM ready
on(document, 'DOMContentLoaded', initGallery, { passive: true });
