# FE Type Boundaries

This note defines the intended role of `schemas`, `api`, and `models` in `apps/web`.

## Goal

Keep frontend types aligned to the boundary they belong to.

Do not use one broad type as the source of truth for:

- backend entities
- API request and response payloads
- form validation
- UI view state

Those concerns change for different reasons and should not be forced into one shape.

## Source Of Truth By Layer

### `src/shared/schemas/api/*`

Purpose:

- runtime validation for HTTP request and response shapes
- mirrors backend API contracts

Rules:

- should reflect what the backend accepts and returns
- should not be based on frontend form state
- should not be based on backend database entities

Example:

- auth request and response schemas
- cart response schema
- product list/detail response schema

### `src/shared/api/**/contracts/*`

Purpose:

- exported TypeScript contract types inferred from `schemas/api/*`

Rules:

- used by API clients, server-state, and callers that need transport types
- should describe HTTP payloads only
- should not import broad frontend models just to get `id`, `title`, or other scalar field types

### `src/shared/schemas/forms/*`

Purpose:

- runtime validation for UI form state

Rules:

- should match what the screen edits
- may differ from API contracts
- may include UI-only fields or validation details

Examples:

- confirm-password fields
- temporary form-only state
- form-level requiredness that differs from partial update payloads

### `src/shared/models/*`

Purpose:

- frontend app-level view models
- normalized or composed types used by the UI intentionally

Rules:

- not backend entity mirrors
- not raw API contract types
- not generic catch-all shared types

Keep a file in `models/*` only if it represents a real frontend-facing model, for example:

- a normalized category shape used across many screens
- a composed view model built from multiple API responses
- a stable UI-facing shape with naming or structure different from the backend response

Do not keep a file in `models/*` if it only exists to do things like:

- `type X = z.infer<typeof someSchema>`
- `Product['id']` to mean `string`
- reuse a broad type for forms, API payloads, and view state at once

## What Changed

Previously, it was tempting to treat `src/shared/models/*` as if it should match backend entities.

That is no longer the intended design.

Reason:

- backend entities are persistence-internal
- frontend does not consume database entities directly
- frontend consumes API contracts, form state, and UI-specific derived data

So:

- backend entity shape is backend internal truth
- API contract shape is FE/BE network truth
- form schema shape is UI input truth
- frontend model shape is optional UI/app truth

If a frontend schema matches a backend entity exactly, it leaks backend persistence details into the UI.

Better rule:

- backend entity matches database and domain needs
- `schemas/api/*` matches backend API contract
- `schemas/forms/*` matches form and UI needs
- `models/*` matches normalized frontend view model needs

For `user` specifically:

- backend `UserEntity` can have relations, flags, timestamps, and internal fields
- auth response can have `preferences`, `roles`, `permissions`, and `shop`
- register form may only need `email`, `password`, and `display_name`
- update preferences form may only need `region`, `language`, and `currency`

Those should not be forced into one schema.

## Practical Rules

When adding or editing types:

1. If the type is an HTTP payload, put it under `schemas/api/*` and `api/**/contracts/*`.
2. If the type is a form state shape, put it under `schemas/forms/*`.
3. If the type is a normalized UI model used intentionally across the app, put it under `models/*`.
4. If the code only needs a small subset like `id: string`, use a narrow local type instead of importing a broad model.

## Smell Checks

Likely wrong:

- importing a model only to reference `['id']`, `['title']`, `['code']`, etc.
- using one type for both form state and API payload
- making `models/*` mirror backend entities 1:1

Usually fine:

- local inline prop types for small component needs
- contract-derived types for API client and server-state code
- normalized models where the UI truly benefits from a stable frontend shape

## Current Direction

The current structure in `apps/web` is:

- `src/shared/schemas/api/*` for HTTP shapes
- `src/shared/api/**/contracts/*` for exported contract types
- `src/shared/schemas/forms/*` for UI form shapes
- `src/shared/models/*` only for real frontend models

If a model file no longer serves that last purpose, prefer deleting it or replacing its usage with contract-derived or local narrow types.
