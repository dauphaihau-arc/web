# Storefront and Seller Nuxt Welcome UI Troubleshooting

## Symptom

Running:

```bash
pnpm --filter @arc/storefront dev
```

and opening `http://localhost:4000` shows the default Nuxt welcome UI, even though the real app entry exists at `apps/storefront/src/app.vue`.

The same issue can also affect seller:

```bash
pnpm --filter @arc/seller dev
```

and opening `http://localhost:4001` shows the default Nuxt welcome UI even though the real app entry exists at `apps/seller/src/app.vue`.

## Misleading signal

This can look like a broken app structure or missing `app.vue`, but that was not the root cause here.

Previous working commits used the same app structure:

- `apps/storefront/src/app.vue`
- `apps/storefront/src/app/pages`
- `apps/seller/src/app.vue`
- `apps/seller/src/app/pages`
- `srcDir: 'src/'`
- `dir.pages = 'app/pages'`

In the broken state, Nuxt generated an empty route manifest at:

`apps/storefront/.nuxt/manifest/meta/dev.json`

That caused Nuxt to fall back to the default welcome screen.

## Root cause

The issue was local toolchain drift, not storefront or seller source code:

- Node runtime had drifted to `22.x`
- workspace dependency state and lockfile were out of sync
- Nuxt 3.12 ran against that local state and generated an empty dev route app

## Fix

Use Node 20, clear local install/build state, refresh workspace dependencies, then start dev again:

```bash
volta install node@20
volta pin node@20

rm -rf node_modules apps/storefront/node_modules apps/storefront/.nuxt apps/storefront/.output

pnpm install --no-frozen-lockfile
pnpm --filter @arc/storefront dev
```

## Why `--no-frozen-lockfile`

`pnpm install --frozen-lockfile` validates the entire workspace lockfile. If any workspace package manifest has drifted from `pnpm-lock.yaml`, install will fail before storefront or seller can be tested.

In this case, refreshing the workspace lockfile once was required.
