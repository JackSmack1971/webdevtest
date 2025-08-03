// lightbox.js - accessible lightbox controller (ESM)
// Docs: see docs/lightbox-component.md and docs/lightbox-smoke-checklist.md for selector and behavior references

import { on, qsa, getTabbables, trapFocus, nextIndex, prevIndex, liveRegion } from './utils.js';
import { rememberFocus, restoreFocus, announce } from './a11y.js';

let refs = {
  root: null,
  dialog: null,
  closeBtn: null,
  img: null,
  caption: null,
  counter: null,
  prevBtn: null,
  nextBtn: null,
  backdrop: null
};

let state = {
  items: [],
  index: 0,
  releaseFocusFn: null
};

function initRefs(rootSelector = '[data-lightbox], [data-lightbox-root]') {
  // Support either [data-lightbox] (JS expectation) or [data-lightbox-root] (current HTML) — keep in sync with docs/lightbox-component.md
  refs.root = document.querySelector(rootSelector);
  if (!refs.root) return false;
  refs.dialog = refs.root.querySelector('[data-lightbox-dialog], [data-js="lightbox-dialog"]'); // dialog container
  refs.closeBtn = refs.root.querySelector('[data-lightbox-close], [data-close]'); // close button selector
  refs.img = refs.root.querySelector('[data-lightbox-image]'); // active image target
  refs.caption = refs.root.querySelector('[data-lightbox-caption]'); // caption region
  refs.counter = refs.root.querySelector('[data-lightbox-counter]'); // pagination text
  refs.prevBtn = refs.root.querySelector('[data-lightbox-prev], [data-prev]'); // previous control
  refs.nextBtn = refs.root.querySelector('[data-lightbox-next], [data-next]'); // next control
  refs.backdrop = refs.root.querySelector('.lightbox__backdrop, [data-backdrop]'); // backdrop element
  return true;
}

function hydrateItems() {
  // Collect gallery items from the main grid — selectors must match docs/lightbox-component.md "Recommended markup"
  const grid = document.querySelector('[data-gallery-grid]'); // gallery grid container
  state.items = grid ? qsa(grid, '[data-gallery-item], .gallery__item') : []; // individual cards
}

function setAriaHiddenForBackground(hidden) {
  // Hide main content from AT while dialog is open — see A11y notes in docs/lightbox-component.md
  const main = document.querySelector('main');
  if (main) main.setAttribute('aria-hidden', hidden ? 'true' : 'false');
}

function updateUI() {
  const card = state.items[state.index];
  if (!card) return;
  const imgEl = card.querySelector('img');
  const src = card.getAttribute('data-full') || imgEl?.getAttribute('data-full') || imgEl?.getAttribute('src') || card.querySelector('a')?.getAttribute('href');
  const alt = imgEl?.getAttribute('alt') || '';
  const caption = card.getAttribute('data-caption') || card.querySelector('.card__caption')?.textContent || '';

  if (refs.img && src) {
    refs.img.src = src;
    refs.img.alt = alt;
  }
  if (refs.caption) {
    refs.caption.textContent = caption;
  }
  if (refs.counter) {
    refs.counter.textContent = `${state.index + 1} / ${state.items.length}`;
  }
  // Announce the change for AT
  announce(`Image ${state.index + 1} of ${state.items.length}${caption ? `, ${caption}` : ''}`, 'polite');
}

function preloadNeighbors() {
  // Preload adjacent images to reduce navigation latency
  if (!state.items.length) return;
  const next = state.items[nextIndex(state.index, state.items.length)];
  const prev = state.items[prevIndex(state.index, state.items.length)];
  [next, prev].forEach((card) => {
    const preloadSrc = card?.getAttribute('data-full') || card?.querySelector('img')?.getAttribute('data-full') || card?.querySelector('a')?.getAttribute('href'); // keep attr names synced with docs
    if (preloadSrc) {
      const img = new Image();
      img.src = preloadSrc;
    }
  });
}

function open(index = 0) {
  if (!refs.root) return;
  if (!state.items.length) hydrateItems();
  if (!state.items.length) return;

  rememberFocus();
  state.index = index;

  refs.root.removeAttribute('hidden'); // ensure lightbox root visible
  refs.root.setAttribute('data-open', 'true'); // matches docs "open state"
  refs.root.setAttribute('aria-modal', 'true'); // modal semantics
  refs.dialog?.setAttribute('role', 'dialog'); // role on dialog node

  updateUI();
  preloadNeighbors();

  setAriaHiddenForBackground(true);
  // trap focus inside dialog — see focus trapping guidance in docs/lightbox-component.md
  state.releaseFocusFn = trapFocus(refs.dialog || refs.root, refs.closeBtn || refs.dialog);

  // Announce opening
  announce('Image viewer opened', 'polite');
}

function close() {
  if (!refs.root) return;
  refs.root.setAttribute('hidden', '');
  refs.root.removeAttribute('data-open');
  refs.root.removeAttribute('aria-modal');
  setAriaHiddenForBackground(false);
  if (state.releaseFocusFn) state.releaseFocusFn();
  state.releaseFocusFn = null;
  restoreFocus();
  announce('Image viewer closed', 'polite');
}

function next() {
  if (!state.items.length) return;
  state.index = nextIndex(state.index, state.items.length);
  updateUI();
  preloadNeighbors();
}

function prev() {
  if (!state.items.length) return;
  state.index = prevIndex(state.index, state.items.length);
  updateUI();
  preloadNeighbors();
}

function onKeydown(e) {
  if (!refs.root?.hasAttribute('data-open')) return;
  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      close();
      break;
    case 'ArrowRight':
      e.preventDefault();
      next();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      prev();
      break;
  }
}

function onBackdropClick(e) {
  // Close when clicking explicit backdrop or root background (outside dialog) — ensure event target matches selectors listed in docs
  if (e.target === refs.root || e.target === refs.backdrop) {
    close();
  }
}

export function initLightbox(rootSelector) {
  if (!initRefs(rootSelector)) return;

  // Respond to custom open events from gallery (dispatched by gallery.js) — event name documented in docs
  on(document, 'lightbox:open', (e) => {
    const detail = e.detail || {};
    open(detail.index || 0);
  }, false);

  if (refs.closeBtn) {
    on(refs.closeBtn, 'click', (e) => {
      e.preventDefault();
      close();
    }, false);
  }
  if (refs.prevBtn) {
    on(refs.prevBtn, 'click', (e) => {
      e.preventDefault();
      prev();
    }, false);
  }
  if (refs.nextBtn) {
    on(refs.nextBtn, 'click', (e) => {
      e.preventDefault();
      next();
    }, false);
  }

  // Keyboard navigation
  on(document, 'keydown', onKeydown, false);

  // Close on backdrop click
  on(refs.root, 'click', onBackdropClick, false);
}

// Auto-init after DOM is ready if markup present
on(document, 'DOMContentLoaded', () => {
  // Support either selector variant present in HTML — keep selector list aligned with docs "Supported selectors"
  initLightbox('[data-lightbox], [data-lightbox-root]');
});

export const LightboxAPI = { open, close, next, prev };