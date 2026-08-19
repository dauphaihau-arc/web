# Web Testing

Use this file when changing behavior, fixing bugs, or deciding whether a web
change needs tests.

## Decision Rule

- Add or update tests when a change affects business behavior, routing, stores, query/mutation behavior, validation, permissions, or a reported bug.
- Do not add tests for purely mechanical changes such as formatting, comments, renames, or local refactors with no behavior change.
- Prefer the smallest test that proves the changed behavior.

## Placement Rules

- App-level behavior: use the nearest existing test style in `apps/seller/test` or `apps/storefront/test`.
- Page or middleware behavior: test beside the existing app tests when available.
- Domain query/mutation/store behavior: test near the domain module or in the app test folder following local precedent.
- Shared package behavior: test in the owning package if tests already exist there.

## Verification Commands

From `apps/web`:

```bash
pnpm check
pnpm check:seller
pnpm check:storefront
pnpm test:seller
pnpm test:storefront
```

From the repository root:

```bash
./scripts/verify web
./scripts/verify seller
./scripts/verify storefront
```
