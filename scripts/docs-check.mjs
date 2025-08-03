#!/usr/bin/env node

/**
 * docs-check.mjs
 * Verifies:
 * 1) Internal markdown links resolve (README.md, docs/*.md)
 * 2) Documented lightbox selectors exist in src/assets/scripts/lightbox.js and src/index.html
 * 3) Basic anchor/section presence in docs
 *
 * Exit codes:
 * 0 = OK
 * 1 = Issues found
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// Utility helpers
const readText = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);
const listFiles = (dir) => fs.readdirSync(dir).map(f => path.join(dir, f));
const isMarkdown = (p) => p.toLowerCase().endsWith('.md');

function fail(msg, arr = []) {
  const lines = Array.isArray(arr) ? arr : [arr];
  const out = [msg, ...lines.map(s => ` - ${s}`)];
  return out.join('\n');
}

// 1) Markdown links verification (relative links only)
const mdFiles = [
  path.join(repoRoot, 'README.md'),
  ...(
    exists(path.join(repoRoot, 'docs'))
      ? listFiles(path.join(repoRoot, 'docs')).filter(isMarkdown)
      : []
  )
].filter(exists);

const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g; // [text](href)
const issues = [];

for (const file of mdFiles) {
  const content = readText(file);
  const dir = path.dirname(file);

  // find all links
  let m;
  while ((m = linkRegex.exec(content)) !== null) {
    const href = m[2].trim();

    // Skip external (http/https/mailto) and in-page only anchors (#id)
    if (/^(?:https?:|mailto:|tel:)/i.test(href)) continue;

    // Handle anchors in same file or other file e.g. docs/file.md#section
    const [rawPath, rawHash] = href.split('#');
    const targetPath = rawPath === '' || rawPath === undefined ? file : path.resolve(dir, rawPath);

    if (!exists(targetPath)) {
      issues.push(fail(`Broken link in ${path.relative(repoRoot, file)}:`, [`target not found: ${href}`]));
      continue;
    }

    if (rawHash) {
      // Basic anchor presence check: look for heading slug match
      // Convert hash to case-insensitive match against heading text slug
      const targetContent = readText(targetPath);
      const headings = Array.from(targetContent.matchAll(/^(#{1,6})\s+(.+)\s*$/gmi)).map(h => h[2]);
      const slug = (s) => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      const hasAnchor = headings.some(h => slug(h) === rawHash.toLowerCase());
      if (!hasAnchor) {
        issues.push(fail(`Missing anchor in ${path.relative(repoRoot, targetPath)} referenced by ${path.relative(repoRoot, file)}:`, [`#${rawHash}`]));
      }
    }
  }
}

// 2) Selector drift checks between docs and source
// Define canonical selectors used by implementation/docs
const SELECTORS = {
  // Lightbox root and internals
  root: ['[data-lightbox]', '[data-lightbox-root]'],
  dialog: ['[data-lightbox-dialog]', '[data-js="lightbox-dialog"]'],
  close: ['[data-lightbox-close]', '[data-close]'],
  img: ['[data-lightbox-image]'],
  caption: ['[data-lightbox-caption]'],
  counter: ['[data-lightbox-counter]'],
  prev: ['[data-lightbox-prev]', '[data-prev]'],
  next: ['[data-lightbox-next]', '[data-next]'],
  backdrop: ['.lightbox__backdrop', '[data-backdrop]'],

  // Gallery
  grid: ['[data-gallery-grid]'],
  item: ['[data-gallery-item]', '.gallery__item'],

  // Triggers
  trigger: ['[data-lightbox]'] // present on anchors within gallery
};

function fileContainsAll(p, selectors) {
  const content = readText(p);
  const missing = [];
  for (const groupName of Object.keys(selectors)) {
    const group = selectors[groupName];
    const present = group.some(sel => content.includes(sel));
    if (!present) {
      missing.push(`${groupName}: one of ${group.join(' | ')}`);
    }
  }
  return missing;
}

// Check JS implementation file
const jsPath = path.join(repoRoot, 'src', 'assets', 'scripts', 'lightbox.js');
if (exists(jsPath)) {
  const jsMissing = fileContainsAll(jsPath, {
    root: SELECTORS.root,
    dialog: SELECTORS.dialog,
    close: SELECTORS.close,
    img: SELECTORS.img,
    caption: SELECTORS.caption,
    counter: SELECTORS.counter,
    prev: SELECTORS.prev,
    next: SELECTORS.next,
    backdrop: SELECTORS.backdrop,
    grid: SELECTORS.grid,
    item: SELECTORS.item
  });
  if (jsMissing.length) {
    issues.push(fail(`Selector references missing in ${path.relative(repoRoot, jsPath)}:`, jsMissing));
  }
} else {
  issues.push(`Missing file: ${path.relative(repoRoot, jsPath)}`);
}

// Check HTML usage file
const htmlPath = path.join(repoRoot, 'src', 'index.html');
if (exists(htmlPath)) {
  const htmlMissing = fileContainsAll(htmlPath, {
    root: SELECTORS.root,
    dialog: SELECTORS.dialog,
    close: SELECTORS.close,
    img: SELECTORS.img,
    caption: SELECTORS.caption,
    counter: SELECTORS.counter,
    prev: SELECTORS.prev,
    next: SELECTORS.next,
    backdrop: SELECTORS.backdrop,
    grid: SELECTORS.grid,
    item: SELECTORS.item,
    trigger: SELECTORS.trigger
  });
  if (htmlMissing.length) {
    issues.push(fail(`Selector usage missing in ${path.relative(repoRoot, htmlPath)}:`, htmlMissing));
  }
} else {
  issues.push(`Missing file: ${path.relative(repoRoot, htmlPath)}`);
}

// 3) Basic docs section presence
const componentDoc = path.join(repoRoot, 'docs', 'lightbox-component.md');
if (exists(componentDoc)) {
  const content = readText(componentDoc).toLowerCase();
  const requiredSections = [
    'supported selectors',
    'recommended markup',
    'behavior',
    'accessibility',
    'integration',
    'troubleshooting',
    'maintenance'
  ];
  const missingSections = requiredSections.filter(sec => !content.includes(sec));
  if (missingSections.length) {
    issues.push(fail(`Sections missing in docs/lightbox-component.md:`, missingSections));
  }
} else {
  issues.push('Missing docs/lightbox-component.md');
}

const checklistDoc = path.join(repoRoot, 'docs', 'lightbox-smoke-checklist.md');
if (exists(checklistDoc)) {
  const content = readText(checklistDoc).toLowerCase();
  const requiredItems = [
    'open/close',
    'navigation',
    'content updates',
    'focus',
    'aria-hidden',
    'backdrop',
    'edge cases',
    'troubleshooting'
  ];
  const missing = requiredItems.filter(k => !content.includes(k));
  if (missing.length) {
    issues.push(fail(`Items missing in docs/lightbox-smoke-checklist.md:`, missing));
  }
} else {
  issues.push('Missing docs/lightbox-smoke-checklist.md');
}

// Report
if (issues.length) {
  console.error('Docs check found issues:\n');
  for (const msg of issues) {
    console.error(`- ${msg}\n`);
  }
  process.exit(1);
} else {
  console.log('Docs check passed: all links and selectors validated.');
  process.exit(0);
}