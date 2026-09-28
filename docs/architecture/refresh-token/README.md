# Refresh Token Handling

Arc Web keeps the session in two HttpOnly cookies issued by the API: `accessToken`
and `refreshToken`. The web apps never read, store, or decode the token values for
authorization; they only need to know when the access token can no longer be used and
how to rotate the pair without the user noticing.

This document describes the shared client contract and the two transports that carry
it: seller (same-origin Nitro `/api` proxy plus server-rendered rotation) and storefront
(direct API origin, client-rendered session).

## Goals

- Keep token issuance and rotation owned by the API; the web layer never mints tokens.
- Refresh only when the API says rotation can help, never on every `401`.
- Let concurrent browser requests share one rotation instead of racing each other.
- Never surface a rotation failure as an error; a dead session degrades to a guest render.
- Keep server-rendered seller pages from reading as signed out when the access token
  has merely expired.

## Session Cookies

`apps/seller/src/server/utils/session-cookies.ts` holds the cookie contract used by the
server-rendered path:

- `accessToken` and `refreshToken` are the only cookie names considered.
- `parseCookies` reads a raw `Cookie` header and drops malformed segments.
- `shouldRefreshSession` requires a refresh cookie and an access cookie that is missing
  or expired. A missing access token is as recoverable as an expired one.
- `isExpiredAccessToken` reads only the JWT payload `exp` field; the API verifies the
  signature. A token that cannot be decoded is treated as not expired, so the refresh is
  skipped rather than guessed.

## Shared Client Contract

`packages/lib/src/api/api-client.ts` owns the whole refresh policy. Every request goes
through `createApiClient`, configured per app with a base URL, default headers, a wake-up
error predicate, a backend-lifecycle hook, and the refresh endpoint
(`refreshSession.url`), which both apps set to `${RESOURCES.AUTH}/refresh` (`/auth/refresh`).

Request flow per call:

1. `requestWithAuthRecovery` runs the request through `requestWithWakeUpRecovery`.
2. `requestWithWakeUpRecovery` retries once after the backend wake-up wait when
   `isBackendWakeUpError` matches (no status code at all, or `502`/`503`/`504`).
3. On failure, `isRecoverableAuthError` decides whether a refresh is worth attempting.
4. A recoverable failure triggers `refreshSessionSingleFlight`, then one replay of the
   original request.
5. If the replay still fails, the original error is rethrown.

Refresh is triggered only for `401` responses whose error body carries
`ACCESS_TOKEN_EXPIRED` or `ACCESS_TOKEN_MISSING`. The code is read from `data.code`,
`response._data.code`, or `response.data.code`. Everything else — any other `401`
(bad credentials, invalid signature, revoked session), any `403`, or a `401` with no
code — skips the refresh and returns to the caller.

Two properties matter as much as the trigger:

- **One replay.** The client retries the original request exactly once, so a rotated
  session still failing cannot loop.
- **Browser-only single flight.** Requests in the browser share one in-flight refresh
  promise, and the promise is cleared when it settles. Server clients can span users, so
  they never share refresh work; each server-side call refreshes on its own.

Per-endpoint opt-outs in `apps/{seller,storefront}/src/domains/auth/api/auth.api.ts`
pass `retryOnUnauthorized: false` for `login`, `logout`, `register`, `forgot-password`,
`reset-password`, `verify-token`, and `client-config`. Refreshing after a failed login is
meaningless and would double-submit the mutation. `GET /auth/me` uses
`retryOnUnauthorized: import.meta.client`, because on the server the Nitro middleware
already owns rotation.

Wake-up recovery and auth recovery are deliberately disjoint: a wake-up error is a
transport symptom (no status or a gateway status) and never triggers a refresh, while a
recoverable `401` is an application signal and never triggers the wake-up wait.

## Seller: Browser Requests Through the Proxy

Seller sets `runtimeConfig.public.apiBaseURL` to `/api` and routes `/api/**` to
`apiOrigin` through Nitro `routeRules`. Browser calls therefore stay on the web origin:

- Cookies stay same-origin, so the HttpOnly pair is sent without cross-site rules.
- The API's `Set-Cookie` on rotation is applied on the seller origin as before, so the
  browser stores the rotated pair with no extra client code.

`getDefaultHeaders` in `apps/seller/src/domains/_shared/api-client.ts` forwards the
incoming `cookie` header on server requests. Without it, a plain `$fetch` on the server
carries no session and every server-side guard would decide as a guest.

## Seller: Server-Rendered Rotation

`apps/seller/src/server/middleware/session-refresh.ts` covers the case where a page is
rendered on the server with an expired (or absent) access token but a live refresh token:

- It runs only for `GET`/`HEAD` and skips `/api/**`, so proxied API traffic is untouched.
- `shouldRefreshSession` gates the work; a valid session costs nothing.
- It posts `/v1/auth/refresh` to the API origin with the incoming `cookie` header and
  `retry: 0`.
- Every `Set-Cookie` from the rotation is appended to the render response, and the rotated
  values are written back into `event.node.req.headers.cookie` so the render that follows
  reads the fresh session.
- A rejected refresh is swallowed: the session is gone, and the app renders as a guest.

Seller route rules keep auth pages (`/login`, `/register`) and the seller surfaces
(`/dashboard`, `/orders`, `/products`, `/coupons`, `/notifications`, `/settings/shipping`)
server-rendered; long-lived editor and import flows stay client-rendered. The
`current-user` plugin prefetches `/auth/me` on the server and dehydrates it into the
payload, and the browser revalidates it with `staleTime: 0`.

## Storefront: Direct API Origin

Storefront has no `/api` proxy and no refresh middleware:

- `runtimeConfig.public.apiBaseURL` is the absolute `API_BASE_URL`, so browser calls hit
  the API origin directly with `credentials: 'include'`.
- `getDefaultHeaders` adds the market headers (`X-Market-Code`, `X-Currency`, `X-Locale`,
  `X-Channel`) and nothing else; the incoming `cookie` header is not forwarded on server
  requests.
- Authenticated storefront routes (`/account/**`, `/orders/**`, `/cart/**`,
  `/checkout/**`, `/success`, `/guest-orders/**`, `/reset/**`) are `ssr: false`, so the
  session is resolved in the browser where the cookies live. Public discovery routes
  stay server-rendered, ISR, or static.

The shared client behaves identically in both apps; only the transport in front of the
API and the moment of session resolution differ.

## Failure Modes

- **Refresh token missing.** No refresh is attempted; the request keeps its `401` and
  `getCurrentOrGuest` in `domains/me/api/me.api.ts` maps it to a guest.
- **Refresh rejected.** The original request error is rethrown, never the refresh error.
- **Replay still unauthorized.** No second refresh; the error reaches the caller.
- **Backend asleep.** `isBackendWakeUpError` marks the backend as waking and waits before
  retrying; the refresh call itself is wake-up retryable but never 401 retryable.
- **Logout.** `logout` posts with `retryOnUnauthorized: false`, then seller clears its
  user-scoped query keys and sets `['current-user']` to `{ user: null }`.

## Diagrams

- `diagrams/access-token-refresh.html` — sequence of a recoverable `401`, the single-flight
  rotation, and the one replay. Source: `diagrams/access-token-refresh.sequence.json`.
- `diagrams/session-transport.html` — who holds the session, who may rotate it, and where
  the seller and storefront transports diverge. Source:
  `diagrams/session-transport.architecture.json`.
- `diagrams/session-lifecycle.html` — session states from login to rotation and back, plus
  the terminal exits that never return. Source:
  `diagrams/session-lifecycle.lifecycle.json`.

Each diagram is a self-contained HTML artifact produced with the Archify skill; the JSON
files are the authored source of truth and can be re-delivered with
`archify deliver <type> <source.json> <output.html> --quality showcase`.

## Verification

The rotation policy is covered by:

- `packages/lib/src/api/api-client.test.ts` — recoverable-code detection, one replay,
  no refresh on generic `401`/`403` or when `retryOnUnauthorized: false`, rethrow of the
  original error, and browser single-flight behavior.
- `apps/seller/test/session-cookies.test.ts` — cookie parsing and the
  missing/expired/valid access-token decisions behind the server middleware.

## Related Docs

- `docs/architecture/overview.md`
- `docs/architecture/rendering-strategies.md`
- `docs/fe-type-boundaries.md`
- `docs/deployment.md`
