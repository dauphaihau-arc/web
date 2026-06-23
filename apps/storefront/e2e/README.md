# Storefront E2E

This folder contains Playwright browser tests for the storefront app.

## Current scope

- Real browser coverage through Playwright
- Network-level API stubs for deterministic first-pass tests
- Focus on critical user flows before expanding to seeded full-stack scenarios

## Run

```bash
pnpm e2e
pnpm e2e:headed
pnpm e2e:ui
```

## Current specs

- `auth/protected-route.spec.ts`
- `auth/login.spec.ts`
- `checkout/redirect.spec.ts`
- `guest-orders/lookup.spec.ts`
- `notifications/read-all.spec.ts`

## Next flows worth promoting to stronger e2e coverage

- Guest add-to-cart and cart persistence
- Buy-it-now to checkout session
- Cart merge after login using seeded backend data
- Account messages send-message flow
- Browser notification enable/disable flow

## Structure

- `support/factories.ts`: small mock data builders
- `support/network.ts`: shared route interception helpers
- feature folders: spec files grouped by user flow
