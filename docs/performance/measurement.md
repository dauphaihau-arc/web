# Measurement

Four layers, deliberately different in strictness. Mechanism and commands are in
`docs/test-strategy.md` §Performance gates; this file records what each layer can
and cannot tell you.

| Layer | What runs | Strength |
|---|---|---|
| PR | `scripts/check-bundle-budget.mjs` per app | blocking, deterministic |
| Nightly | `.github/workflows/perf.yml` → `lhci autorun`, 3 runs, median | diagnostic against the deployed storefront |
| Deploy | `apps/storefront/scripts/assert-isr.mjs`, `.github/workflows/isr-probe.yml`, `.github/workflows/isr-monitor.yml` | proves caching matches config |
| Field | none | no RUM collector in this stack |

## Nightly Lighthouse

`lighthouserc.cjs` gates on stable signals only: CLS (≤ 0.1) and total page weight
(≤ 1.7 MB) are errors; LCP (≤ 2500 ms) and TBT (≤ 300 ms) are warnings.
Assertions aggregate by median, because LHCI's default `optimistic` reports the
best run for `max*` thresholds and makes day-to-day comparison meaningless.

PR-time Lighthouse is deliberately absent: a PR run would compare cached and
uncached ISR renders and jitter on shared runners. Only server-rendered routes are
meaningful — checkout, cart, account, orders, and guest orders are `ssr: false`
shells.

## Deploy Probes

`isr` only works on the Netlify preset and degrades silently if a route is
prerendered or the preset regresses, so the built artifact is asserted rather than
the config source. `apps/storefront/scripts/assert-isr.mjs` runs after
`NITRO_PRESET=netlify pnpm build:storefront` and checks the preset, `/` = 3600 s,
`/**` = 300 s, no `isr` combined with `cache: false` / `ssr: false` / `prerender`,
and `/` not prerendered. `.github/workflows/isr-probe.yml` probes deploy previews;
`.github/workflows/isr-monitor.yml` probes production every 15 minutes. See
`apps/storefront/README.md` §ISR verification.

## Field Data

Field data is the source of truth for whether the site is fast, and there is no
destination for it yet: the API's observability is backend-only (Prometheus, Loki,
OTEL, Sentry), so browser vitals have nowhere to go. Until a collector exists,
treat LCP warnings as lab signal and do not add client instrumentation that cannot
be recorded.

## Related

- [README.md](./README.md)
- [process.md](./process.md) — when a budget may move
- `docs/test-strategy.md`
