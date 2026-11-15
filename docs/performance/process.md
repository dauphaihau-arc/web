# Ongoing Process

## Rules For A Change

- Pick the rendering mode from `docs/performance/rendering-strategies.md` and state
  it in the route config or PR. Do not flip a route to SSR without a budget.
- Every SSR `await` has an explicit time budget and a client fallback.
- Below-the-fold components ship as lazy-visible hydration.
- One `priority` image per page; no `densities` default leaking a 2x request.
- Nothing raises a bundle budget without a stated reason in the same PR.
- No new client-side performance library. Solve the cause.

## Budget Ratchet

`performance-budgets.json` is the guard, not a target. Raise a limit in the same PR
as the feature that needs it, with the reason in the PR body; lower it in the PR
that lands the win. A limit that is never lowered is a ceiling nobody is testing
against.

## When A Number Moves

1. Reproduce it: built assets for bundle size, nightly Lighthouse for lab timings.
2. Name the cause in the PR — new dependency, route moved to SSR, client fetch
   restored, image variant changed.
3. Fix or budget it explicitly; do not raise a threshold silently.

`lighthouserc.cjs` stays nightly-only. Moving it to PRs would compare cached and
uncached ISR renders and turn shared-runner jitter into merge noise.

## Related

- [README.md](./README.md)
- [measurement.md](./measurement.md) — the layers and thresholds
- `docs/test-strategy.md` §Performance gates
