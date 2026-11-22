# ADR-003: Storefront Locale Lives in the URL and Is Independent of Market

## Status

Accepted

## Date

2026-11-18

## Context

Storefront buyers need a choice of UI language: English is the default, Vietnamese
is the second supported language. The existing preference model stores a language,
region, and currency per buyer, but the storefront has no i18n runtime and renders
hardcoded English.

The rendering constraint is the cache policy: `/` is ISR for 3600 seconds and
`/**` is ISR for 300 seconds, keyed by path. A locale held only in a cookie or
local storage would render one buyer's language into HTML served to every buyer at
that path.

The existing market model also ties supported locales to a market (US: `en-US`;
Vietnam: `vi-VN`, `en-VN`). A buyer's language is not a commercial geography
decision; a Vietnamese speaker may shop the US market.

## Options Considered

### Option A: `prefix_except_default`

English at existing URLs, Vietnamese at `/vi/**`.
Pros: correct SSR under the current ISR policy, Vietnamese URLs for SEO, explicit
shareable links.
Cons: every route, link, redirect, and route rule must be locale-aware.

### Option B: `no_prefix` with preference storage

URLs unchanged; language applied from a cookie or user preference.
Pros: smallest routing change.
Cons: shared ISR caches cannot vary by preference, so SSR is either incorrect or
must stay English and switch after hydration.

### Option C: Prefix both locales

`/en/**` and `/vi/**`.
Pros: symmetrical URLs.
Cons: breaks every existing URL and redirect, with no benefit over Option A.

## Decision

Adopt Option A.

- Supported Storefront Languages are `en` and `vi`; English is the default and has
  no prefix.
- The URL language prefix is the rendering source of truth.
- Storefront Language is independent of Market. A Locale is a Storefront Language
  plus a Market region, and every enabled Market can render every supported
  Storefront Language.
- Buyer Language Preference remains persisted for the switcher and
  server-produced buyer messages, but it does not make cookie-driven SSR
  authoritative.
  A stored `vi` preference client-redirects the bare `/` only; every explicit URL
  wins.
- First visits render English; Vietnamese requires an explicit choice or `/vi`
  URL.
- The switcher keeps the current page and query string, persists the preference,
  and never changes Market or currency.
- Every storefront route exists in both locales; record slugs are identity and
  stay untranslated.
- Requests keep one `X-Locale: <language>-<region>` header; every enabled Market
  accepts both languages in `supportedLocales`.

## Consequences

- All storefront routes, including cart, checkout, account, and orders, exist under
  both locales.
- Route rules must cover `/vi/**` with the same cache policy as the unprefixed
  path.
- Navigation, canonical category redirects, and auth redirects must preserve the
  active locale prefix.
- Each locale is self-canonical with language-level `hreflang` alternates and
  `x-default` on English.
- Locale persistence stays with the existing Buyer Language Preference
  (user preferences plus guest storage); the i18n runtime does not add a second
  locale cookie.
- `vi` replaces the unused `la` and `fr` language values; existing preference rows
  need a migration to `en`.
- The published language enum changes from `en | la | fr` to `en | vi`, and the
  language schema/type is renamed to Storefront Language in the same breaking
  contract revision, then `@arc/schemas` is regenerated.
- Market auto-detection may seed a guest's region and currency, but it never
  selects Vietnamese; only an explicit choice sets the language.
- Localized catalog content can later be selected per Locale without changing the
  routing contract.
