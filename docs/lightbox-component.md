# Lightbox Component Documentation

Authoritative reference for the lightbox behavior, supported data attributes, and markup integration patterns currently implemented in:
- [src/assets/scripts/lightbox.js](src/assets/scripts/lightbox.js:1)
- Verified against [src/index.html](src/index.html:1)

This document is the source of truth for maintainers and designers when updating markup or styles that interact with the lightbox.

---

## Overview

The lightbox provides modal viewing of gallery items with keyboard navigation, click controls, focus management, backdrop closing, and live announcements for screen readers. It auto-initializes for matching roots on page load.

Key capabilities:
- Keyboard navigation: ArrowLeft/ArrowRight to navigate, Escape to close
- Click controls: Previous, Next, Close with preventDefault
- Backdrop click to close (clicks inside dialog do not close)
- Focus trapping while open, focus restoration to opener on close
- Background aria-hidden toggling while open
- Live polite announcements on open/close and image changes (index + caption)

---

## Supported Selectors and Data Attributes

To support legacy and current markup variants, the component binds to any of the following:

Roots:
- [data-lightbox] | [data-lightbox-root]

Dialog container (focus target, trap scope):
- [data-lightbox-dialog] | [data-js="lightbox-dialog"]

Controls:
- Close: [data-lightbox-close] | [data-close]
- Previous: [data-lightbox-prev] | [data-prev]
- Next: [data-lightbox-next] | [data-next]

Backdrop:
- .lightbox__backdrop | [data-backdrop]

Gallery items (hydratable sources for image + caption):
- [data-gallery-item] | .gallery__item

Image update sources (priority order used by the script):
1) data-full on the item itself (e.g., <div data-full="/images/large.jpg">)
2) img[data-full] nested within the item
3) First anchor/link within the item with an href pointing to the full image

Caption sources (priority order):
1) data-caption on the item (e.g., <div data-caption="Alt text">)
2) .card__caption element within the item

Announcements:
- The component emits live region messages like: "Image X of Y, Caption"
- On open/close announcements indicate state change

Auto init:
- The component auto-initializes any matching roots: [data-lightbox], [data-lightbox-root]

---

## Recommended Markup Patterns

Minimal viable structure:

```html
<div data-lightbox-root>
  <div class="lightbox__backdrop" data-backdrop></div>

  <div class="lightbox__dialog" data-lightbox-dialog role="dialog" aria-modal="true" aria-label="Image viewer">
    <button type="button" data-lightbox-close aria-label="Close">&times;</button>

    <figure class="lightbox__figure">
      <img class="lightbox__image" alt="">
      <figcaption class="lightbox__caption"></figcaption>
    </figure>

    <nav class="lightbox__controls">
      <a href="#" data-lightbox-prev aria-label="Previous">Prev</a>
      <a href="#" data-lightbox-next aria-label="Next">Next</a>
    </nav>
  </div>
</div>
```

Gallery item patterns (any of these work):

Pattern A: data-full + data-caption on the item
```html
<div class="gallery__item" data-full="/assets/images/full/cat.jpg" data-caption="Cat on a bench">
  <img src="/assets/images/thumbnails/cat.jpg" alt="Cat on a bench">
</div>
```

Pattern B: nested img[data-full] + .card__caption
```html
<div class="gallery__item">
  <img src="/assets/images/thumbnails/dog.jpg" data-full="/assets/images/full/dog.jpg" alt="Dog in park">
  <div class="card__caption">Dog in park</div>
</div>
```

Pattern C: anchor href to full image + .card__caption
```html
<a class="gallery__item" href="/assets/images/full/bird.jpg">
  <img src="/assets/images/thumbnails/bird.jpg" alt="Bird in flight">
  <span class="card__caption">Bird in flight</span>
</a>
```

Note: Items may use [data-gallery-item] instead of .gallery__item.

---

## Behavior Details

Initialization:
- On DOMContentLoaded (or module import execution), bind to all roots matching [data-lightbox] or [data-lightbox-root].
- Within each root, wire controls, dialog, and backdrop.
- Discover gallery items in the associated gallery scope to compute total count and initial index.

Opening:
- Triggered by clicking a gallery item (preventDefault when anchor).
- Lightbox dialog becomes visible; backdrop shown.
- Background containers are set aria-hidden="true" as implemented by [src/assets/scripts/lightbox.js](src/assets/scripts/lightbox.js:1).
- Focus is moved to the dialog or first interactive element within it.
- Live region announces "Lightbox opened".

Closing:
- Triggered by:
  - Escape key
  - Close button
  - Backdrop click (clicks inside dialog do not close)
- Background aria-hidden restored to previous state.
- Focus restored to the originally opened trigger.
- Live region announces "Lightbox closed".

Navigation:
- Next/Prev via buttons and ArrowRight/ArrowLeft keys.
- preventDefault applied to anchor buttons.
- Update UI runs: resolve image URL (data-full → img[data-full] → link href), caption (data-caption → .card__caption).
- Announce "Image X of Y, Caption".
- Wrapping: If the implementation currently wraps at boundaries, the UI cycles; otherwise, controls may disable. Verify actual behavior in [src/assets/scripts/lightbox.js](src/assets/scripts/lightbox.js:1).

Focus management:
- Tab/Shift+Tab constrained within [data-lightbox-dialog] while open.
- No interactive elements outside dialog should receive focus.

Backdrop interactions:
- Clicks on backdrop close; clicks inside dialog do not close.
- Backdrop is non-focusable, ensures dialog focus retention.

Accessibility:
- role="dialog" and aria-modal="true" on dialog container recommended.
- aria-label or aria-labelledby to name the dialog.
- Live region (polite) used for announcements (implemented in JS).
- Background aria-hidden toggled while open and restored on close.

---

## Integration Guidelines

Do:
- Keep dialog and backdrop as siblings so outside clicks are reliably detected.
- Provide either data-full, img[data-full], or an anchor href to full image for every gallery item.
- Provide data-caption or a .card__caption for meaningful announcements.
- Ensure only one open lightbox instance at a time within a root.

Avoid:
- Nesting the dialog within clickable elements that also act as gallery items.
- Removing required selectors without updating the script.

---

## Extension Points

- Multiple roots: The script scopes event handlers per root. You can have multiple lightbox instances on a page.
- Custom captions: Add additional caption sources by extending the source resolution sequence in [src/assets/scripts/lightbox.js](src/assets/scripts/lightbox.js:1).
- Control states: If desired, disable prev/next at boundaries instead of wrapping; adjust logic in navigation handlers.
- Transitions: Add CSS transitions for dialog/backdrop; ensure focus and aria attributes update synchronously.

---

## Troubleshooting

- Lightbox does not open:
  - Ensure root selector present: [data-lightbox] or [data-lightbox-root].
  - Check that at least one gallery item exists with a valid full-image source.
- Image doesn’t change:
  - Verify the item provides data-full or img[data-full] or a link href.
  - Confirm the URL is reachable in the current environment.
- No caption announced:
  - Provide data-caption or .card__caption within the item.
- Focus escapes the dialog:
  - Ensure the dialog element has [data-lightbox-dialog] or [data-js="lightbox-dialog"] and is visible when open.
- Backdrop click does not close:
  - Ensure backdrop is .lightbox__backdrop or [data-backdrop] and is not a child of the dialog.

---

## Maintenance

When updating markup:
- Keep selectors consistent with the supported list above.
- If changing class names or data attributes, update [src/assets/scripts/lightbox.js](src/assets/scripts/lightbox.js:1) and this document.
- After changes, run the manual checklist: [docs/lightbox-smoke-checklist.md](docs/lightbox-smoke-checklist.md:1)

When updating behavior:
- Validate keyboard support, focus handling, and announcements.
- Confirm aria-hidden is set and restored for background content.
- Update documentation and checklist accordingly.
