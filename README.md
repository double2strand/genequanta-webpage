# GeneQuanta website

Static site, no build step. GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.

## Live news feed
- Runs in the visitor's browser: `assets/js/news.js` queries **Europe PMC** (journals + preprints, incl. PubMed/bioRxiv/medRxiv records) and **ClinicalTrials.gov v2** directly (both send CORS headers). Results are cached in `localStorage` for 3 hours.
- Topic queries live in `assets/js/news-config.js`; edit there to tune.
- If live APIs fail, the page falls back to `data/news.json` (a bundled snapshot).
- Optional: `.github/workflows/refresh-news.yml` regenerates `data/news.json` daily (also adds Nature epigenetics RSS + GEN, which can't be fetched from a browser). The site works without it.
- Manual refresh of the snapshot: `node scripts/refresh_news.mjs` (Node 18+).
