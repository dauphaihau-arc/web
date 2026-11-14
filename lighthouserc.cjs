/**
 * Lighthouse CI for the deployed storefront. Run nightly and on demand, not on
 * every PR: production pages sit behind ISR and a real API, so a PR-time score
 * would compare cached and uncached renders and jitter on hosted runners.
 *
 * Override the measured pages with `LHCI_URLS` (comma-separated). Only
 * server-rendered pages are meaningful here; `/checkout`, `/cart`, `/account`,
 * `/orders`, and `/guest-orders` are `ssr: false` shells.
 */
const defaultUrl = 'https://arc.hau.sarl/';
const urls = (process.env.LHCI_URLS?.trim() || defaultUrl)
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

module.exports = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 3,
    },
    assert: {
      // The default is `optimistic`, which reports the best run for max*
      // assertions. Median keeps the nightly number comparable across days.
      aggregationMethod: 'median',
      assertions: {
        // Field-stable signals: layout stability and page weight.
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-byte-weight': ['error', { maxNumericValue: 1700000 }],
        // Lab timing on shared runners; report, don't block the nightly run.
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
