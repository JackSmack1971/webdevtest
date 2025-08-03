// utils.js - generic utilities (ESM)
// Token- and a11y-aware helpers for the project

/**
 * noOp - a no-operation function placeholder
 * Useful for default callbacks.
 */
export function noOp() {}

/**
 * on - addEventListener shorthand with passive default
 * Default passive: true for scroll/touch/wheel; can override via options.
 * @param {Element|Window|Document} target
 * @param {string} type
 * @param {EventListenerOrEventListenerObject} handler
 * @param {AddEventListenerOptions|boolean} [options]
 */
export function on(target, type, handler, options = { passive: true }) {
  target.addEventListener(type, handler, options);
}

/**
 * qs - querySelector shorthand
 * @template {Element} T
 * @param {ParentNode} root
 * @param {string} sel
 * @returns {T|null}
 */
export function qs(root, sel) {
  return root.querySelector(sel);
}

/**
 * qsa - querySelectorAll shorthand to array
 * @template {Element} T
 * @param {ParentNode} root
 * @param {string} sel
 * @returns {T[]}
 */
export function qsa(root, sel) {
  return Array.from(root.querySelectorAll(sel));
}

/**
 * delegate - event delegation
 * @param {Element|Document} root
 * @param {string} type
 * @param {string} selector
 * @param {(ev: Event, matched: Element) => void} handler
 * @param {AddEventListenerOptions|boolean} [options]
 */
export function delegate(root, type, selector, handler, options = { passive: true }) {
  const listener = (ev) => {
    const target = /** @type {Element} */ (ev.target);
    const matched = target && (target.matches?.(selector) ? target : target.closest?.(selector));
    if (matched) handler(ev, matched);
  };
  root.addEventListener(type, listener, options);
  return () => root.removeEventListener(type, listener, options);
}

/**
 * debounce - delay invocation until idle for ms
 * @template T extends (...args: any[]) => any
 * @param {T} fn
 * @param {number} ms
 * @param {boolean} immediate
 * @returns {T}
 */
export function debounce(fn, ms = 200, immediate = false) {
  /** @type {number|undefined} */
  let t;
  return /** @type {any} */ (function (...args) {
    const callNow = immediate && !t;
    clearTimeout(t);
    t = window.setTimeout(() => {
      t = undefined;
      if (!immediate) fn.apply(this, args);
    }, ms);
    if (callNow) fn.apply(this, args);
  });
}

/**
 * throttle - ensure fn runs at most once per ms
 * @template T extends (...args: any[]) => any
 * @param {T} fn
 * @param {number} ms
 * @returns {T}
 */
export function throttle(fn, ms = 200) {
  let last = 0;
  /** @type {number|undefined} */
  let timer;
  return /** @type {any} */ (function (...args) {
    const now = Date.now();
    const remaining = ms - (now - last);
    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = window.setTimeout(() => {
        last = Date.now();
        timer = undefined;
        fn.apply(this, args);
      }, remaining);
    }
  });
}

/**
 * prefersReducedMotion - cached media query check
 */
let _prm;
export function prefersReducedMotion() {
  if (_prm == null) {
    _prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return _prm;
}

/**
 * isHighContrast - forced-colors detection
 */
export function isHighContrast() {
  return window.matchMedia('(forced-colors: active)').matches;
}

/**
 * focusable and tabbable helpers
 */
const focusableSelectors = [
  'a[href]', 'area[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', 'iframe', 'object', 'embed',
  '[contenteditable]', '[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * getTabbables - list tabbable elements inside root
 * @param {HTMLElement|Document} root
 * @returns {HTMLElement[]}
 */
export function getTabbables(root) {
  return qsa(root, focusableSelectors)
    .filter((el) => el instanceof HTMLElement && el.offsetParent !== null);
}

/**
 * trapFocus - trap focus within container; returns cleanup function
 * @param {HTMLElement} container
 * @param {HTMLElement} [initial]
 */
export function trapFocus(container, initial) {
  const handleKeydown = (e) => {
    if (e.key !== 'Tab') return;
    const tabbables = getTabbables(container);
    if (!tabbables.length) return;
    const first = tabbables[0];
    const last = tabbables[tabbables.length - 1];
    const active = /** @type {HTMLElement} */ (document.activeElement);
    if (e.shiftKey) {
      if (active === first || !container.contains(active)) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (active === last || !container.contains(active)) {
        first.focus();
        e.preventDefault();
      }
    }
  };
  const prevActive = /** @type {HTMLElement|null} */ (document.activeElement);
  on(document, 'keydown', handleKeydown, false);
  queueMicrotask(() => {
    (initial || getTabbables(container)[0] || container).focus?.();
  });
  return () => {
    document.removeEventListener('keydown', handleKeydown, false);
    prevActive?.focus?.();
  };
}

/**
 * liveRegion - announce message to AT
 * @param {string} message
 * @param {'polite'|'assertive'} [politeness='polite']
 */
let _liveNode;
export function liveRegion(message, politeness = 'polite') {
  if (!_liveNode) {
    _liveNode = document.createElement('div');
    _liveNode.setAttribute('role', 'status');
    _liveNode.setAttribute('aria-live', 'polite');
    _liveNode.setAttribute('aria-atomic', 'true');
    _liveNode.className = 'visually-hidden';
    document.body.appendChild(_liveNode);
  }
  if (politeness !== _liveNode.getAttribute('aria-live')) {
    _liveNode.setAttribute('aria-live', politeness);
  }
  // Clear then set to ensure announcement
  _liveNode.textContent = '';
  // small delay to force text change announcement in some AT
  setTimeout(() => {
    _liveNode.textContent = message;
  }, 10);
}

/**
 * nextIndex / prevIndex - circular index helpers
 */
export function nextIndex(i, len) {
  return (i + 1) % len;
}
export function prevIndex(i, len) {
  return (i - 1 + len) % len;
}

/**
 * getHashParam / setHashParam - simple hash param utilities
 */
export function getHashParam(key) {
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  return params.get(key);
}
export function setHashParam(key, value) {
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  if (value == null) params.delete(key);
  else params.set(key, value);
  const newHash = params.toString();
  if (newHash) window.location.hash = newHash;
  else history.replaceState(null, '', window.location.pathname + window.location.search);
}

/**
 * togglePressed - sync aria-pressed and data-active
 */
export function togglePressed(el, state) {
  const next = state ?? el.getAttribute('aria-pressed') !== 'true';
  el.setAttribute('aria-pressed', String(next));
  el.toggleAttribute('data-active', next);
  return next;
}

/**
 * clamp - numeric clamp
 */
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

// END utils
// utils.js - generic utilities (ESM)
// TODO: Add helpers (debounce, throttle, qs, qsa, clamp, etc.)

/**
 * noOp - a no-operation function placeholder
 * Useful for default callbacks.
 */
export function noOp() {}

/**
 * on - addEventListener shorthand with passive default
 * @param {Element|Window|Document} target
 * @param {string} type
 * @param {EventListenerOrEventListenerObject} handler
 * @param {AddEventListenerOptions|boolean} [options]
 */
export function on(target, type, handler, options = { passive: true }) {
  target.addEventListener(type, handler, options);
}

// TODO: export other utilities as they are needed
