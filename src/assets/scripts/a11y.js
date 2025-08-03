// a11y.js - accessibility helpers (ESM)
// Foundation utilities aligned with tokens and base CSS

import { on, liveRegion as announceViaUtils, getTabbables, trapFocus, prefersReducedMotion as prm } from './utils.js';

// Track last focused element for restore on close, etc.
let lastFocused = null;

/**
 * rememberFocus - capture the current active element
 */
export function rememberFocus() {
  lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

/**
 * restoreFocus - restore focus to the last remembered element
 */
export function restoreFocus() {
  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus();
  }
}

/**
 * focusFirst - move focus to first tabbable within container
 * @param {HTMLElement} el
 */
export function focusFirst(el) {
  if (!el) return;
  const tabbables = getTabbables(el);
  (tabbables[0] || el).focus?.();
}

/**
 * setAriaPressed - sync aria-pressed and data-active
 * @param {HTMLElement} el
 * @param {boolean} state
 */
export function setAriaPressed(el, state) {
  el.setAttribute('aria-pressed', String(state));
  el.toggleAttribute('data-active', state);
}

/**
 * announce - proxy to shared live region utility
 * @param {string} message
 * @param {'polite'|'assertive'} politeness
 */
export function announce(message = '', politeness = 'polite') {
  announceViaUtils(message, politeness);
}

/**
 * prefersReducedMotion - shared detection
 */
export function prefersReducedMotion() {
  return prm();
}

/**
 * initFocusVisible - ensure :focus-visible behavior baseline if needed
 * Lightweight guard: only adds a helper class on keyboard interaction
 */
export function initFocusVisible(root = document.documentElement) {
  let hadKeyboardEvent = false;

  const addClass = () => root.classList.add('js-focus-visible');
  const removeClass = () => root.classList.remove('js-focus-visible');

  on(window, 'keydown', (e) => {
    // Ignore if modifier only
    if (e.metaKey || e.altKey || e.ctrlKey) return;
    hadKeyboardEvent = true;
    addClass();
  }, { passive: true });

  on(window, 'mousedown', () => {
    hadKeyboardEvent = false;
    removeClass();
  }, { passive: true });

  // If focus occurs without keyboard, remove helper
  on(window, 'focus', () => {
    if (!hadKeyboardEvent) removeClass();
  }, true);
}

/**
 * manageTabbables - expose focus utilities for dialogs, menus, etc.
 */
export { getTabbables, trapFocus };

// Auto-setup minimal baseline after DOM ready
on(document, 'DOMContentLoaded', () => {
  initFocusVisible();
});
// (removed duplicate legacy block)

export function announce(message = '') {
  const region = ensureLiveRegion();
  // Clear first to ensure repetition is announced
  region.textContent = '';
  // Slight delay to trigger screen reader change
  requestAnimationFrame(() => { region.textContent = message; });
}

// Reduced motion utility
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Auto-setup live region after DOM ready
on(document, 'DOMContentLoaded', () => { ensureLiveRegion(); });
