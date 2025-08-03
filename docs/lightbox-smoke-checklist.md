# Lightbox Manual Smoke Test Checklist

This checklist validates critical lightbox behavior against current markup and data attributes. Use for quick regression checks after changes to markup, CSS, or JS.

Related files:
- [src/assets/scripts/lightbox.js](src/assets/scripts/lightbox.js:1)
- [src/index.html](src/index.html:1)

Supported selectors summary (see component docs for full details):
- Root: [data-lightbox] | [data-lightbox-root]
- Dialog: [data-lightbox-dialog] | [data-js="lightbox-dialog"]
- Buttons: close [data-lightbox-close] | [data-close], prev [data-lightbox-prev] | [data-prev], next [data-lightbox-next] | [data-next]
- Backdrop: .lightbox__backdrop | [data-backdrop]
- Items: [data-gallery-item] | .gallery__item
- Update UI sources: data-full | img[data-full] | link href, caption from data-caption | .card__caption

---

## Environment
- Load site via filesystem or dev server (no build required).
- Use a screen reader for announcements validation (optional but recommended).

---

## Basic Open/Close
- [ ] Click a gallery item to open lightbox.
- [ ] Lightbox opens centered; backdrop visible.
- [ ] Focus moves to dialog or the first interactive control.
- [ ] Live region announces "Lightbox opened" (or equivalent).
- [ ] Press Escape closes lightbox.
- [ ] Close button click closes lightbox with preventDefault.
- [ ] Backdrop click closes lightbox; clicking inside dialog does not close.
- [ ] Focus returns to the original opener element after close.
- [ ] Live region announces "Lightbox closed".

## Navigation
- [ ] Next button advances to next image, wrapping at end (if wrap intended by implementation).
- [ ] Prev button goes to previous image, wrapping at start (if wrap intended by implementation).
- [ ] ArrowRight key advances to next image.
- [ ] ArrowLeft key goes to previous image.
- [ ] Buttons and key interactions use preventDefault where applicable (no page scroll/change).

## Content Update
For the currently selected gallery item:
- [ ] Image source updates from one of: data-full, img[data-full], or link href.
- [ ] Caption updates from data-caption or .card__caption.
- [ ] UI reflects current index (e.g., "Image X of Y" announced).
- [ ] Live region announces on every image change: "Image X of Y, <Caption>".

## Focus Management
- [ ] Focus is trapped within the dialog while open (Tab/Shift+Tab loops).
- [ ] No interactive elements outside the dialog are reachable while open.

## Background Accessibility
- [ ] Background containers are aria-hidden while the dialog is open.
- [ ] aria-hidden is restored correctly on close.

## Backdrop Behavior
- [ ] Clicking backdrop closes.
- [ ] Clicking within dialog area does not close.
- [ ] Backdrop is not focusable; dialog retains focus.

## Edge Cases
- [ ] First image: Prev wraps or disables appropriately per design.
- [ ] Last image: Next wraps or disables appropriately per design.
- [ ] Missing caption gracefully handled (announcement omits caption but retains index).
- [ ] Missing data-full falls back to img[data-full] or href; if none found, dialog does not crash and indicates error state gracefully (e.g., keeps previous image or shows placeholder).
- [ ] Rapid next/prev clicks do not break state; announcements keep up without duplicates.
- [ ] Multiple lightbox roots on page (if present): interactions are scoped to the opened instance.

---

## Quick Troubleshooting
- Nothing happens on open:
  - Verify root selector [data-lightbox] or [data-lightbox-root] is present.
  - Ensure items use [data-gallery-item] or .gallery__item.
- Image doesn’t update:
  - Confirm item has data-full, an img[data-full], or a link with href pointing to the full image.
- Caption doesn’t update:
  - Provide data-caption or a .card__caption element within the item.
- Focus not trapped:
  - Ensure dialog has [data-lightbox-dialog] or [data-js="lightbox-dialog"] and is programmatically focused on open.
- Backdrop click not closing:
  - Verify backdrop element exists as .lightbox__backdrop or [data-backdrop] and is outside the dialog container.