# Project Documentation

This repository contains the website source, assets, scripts, and component documentation.

## Components

### Lightbox

- Component Guide: [docs/lightbox-component.md](docs/lightbox-component.md)
- Smoke Test Checklist: [docs/lightbox-smoke-checklist.md](docs/lightbox-smoke-checklist.md)

The component guide covers:
- Supported selectors and attribute sources
- Recommended markup patterns
- Behavior lifecycle and accessibility
- Integration guidelines and extension points
- Troubleshooting and maintenance notes
- References to implementation in [src/assets/scripts/lightbox.js](src/assets/scripts/lightbox.js) and usage in [src/index.html](src/index.html)

The smoke checklist provides a concise manual regression list including:
- Open/close behavior, navigation, content updates
- Focus trapping, background aria-hidden, and backdrop behavior
- Edge cases and troubleshooting tied to current selectors

## Development

- Source HTML: [src/index.html](src/index.html)
- Scripts:
  - Utilities: [src/assets/scripts/utils.js](src/assets/scripts/utils.js)
  - Accessibility helpers: [src/assets/scripts/a11y.js](src/assets/scripts/a11y.js)
  - Gallery logic: [src/assets/scripts/gallery.js](src/assets/scripts/gallery.js)
  - Lightbox component: [src/assets/scripts/lightbox.js](src/assets/scripts/lightbox.js)
- Styles:
  - Variables: [src/assets/styles/variables.css](src/assets/styles/variables.css)
  - Base: [src/assets/styles/base.css](src/assets/styles/base.css)
  - Layout: [src/assets/styles/layout.css](src/assets/styles/layout.css)
  - Components: [src/assets/styles/components.css](src/assets/styles/components.css)
  - Reset: [src/assets/styles/reset.css](src/assets/styles/reset.css)
  - Utilities: [src/assets/styles/utilities.css](src/assets/styles/utilities.css)

## Images

- Thumbnails: [src/assets/images/thumbnails/](src/assets/images/thumbnails/)
- Full-size: [src/assets/images/full/](src/assets/images/full/)
- Icons: [src/assets/images/icons/](src/assets/images/icons/)
- Hero: [src/assets/images/hero/](src/assets/images/hero/)
- Avatars: [src/assets/images/avatars/](src/assets/images/avatars/)

## Tooling

- Image optimization script: [scripts/img-optimize.mjs](scripts/img-optimize.mjs)
- Manifest: [src/site.webmanifest](src/site.webmanifest)
- Robots: [src/robots.txt](src/robots.txt)

## Maintenance Notes

- Keep selector names and ARIA attributes consistent across implementation and documentation.
- When making changes to the lightbox behavior or markup:
  1. Update the implementation in [src/assets/scripts/lightbox.js](src/assets/scripts/lightbox.js)
  2. Review and update [docs/lightbox-component.md](docs/lightbox-component.md)
  3. Re-run the smoke tests from [docs/lightbox-smoke-checklist.md](docs/lightbox-smoke-checklist.md)