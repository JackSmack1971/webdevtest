// Image optimization script placeholder (ESM)
// TODO: Implement using sharp or squoosh to generate responsive images and thumbnails.
// Suggested steps:
// 1) Read from src/assets/images/full
// 2) Output optimized sizes to src/assets/images/thumbnails and hero
// 3) Create WebP/AVIF variants and preserve originals
// 4) Write a JSON manifest that maps originals to variants for the gallery

export async function optimizeImages() {
  console.log('[img-optimize] TODO: implement optimization pipeline');
}

// Allow running via `node ./scripts/img-optimize.mjs`
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizeImages().catch((err) => {
    console.error('[img-optimize] Failed:', err);
    process.exit(1);
  });
}
