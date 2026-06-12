# Web Deployment

The web repo deploys to Netlify with two separate sites connected to the same Git repository.

## Deployment model

- storefront site
- seller site

Each site should:

- keep the repository root as the base directory
- set its package directory to the app folder
- use the app-local `netlify.toml`
- publish `dist`, because Netlify monorepo packaging rewrites the generated static output there for deployment

Because both apps have `ssr: false` in their Nuxt config, static generation is the correct Netlify target.

Sources:

- [Netlify monorepos](https://docs.netlify.com/build/configure-builds/monorepos/)
- [Netlify ignore builds](https://docs.netlify.com/build/configure-builds/ignore-builds/)

## Recommended Netlify settings

### Storefront site

- Base directory: repository root
- Package directory: `apps/storefront`
- Config file: `apps/storefront/netlify.toml`

### Seller site

- Base directory: repository root
- Package directory: `apps/seller`
- Config file: `apps/seller/netlify.toml`

## Ignore rules

Each site now has an app-local `ignore` command in `netlify.toml`.

- [apps/storefront/netlify.toml](/Volumes/Local/dev/pj-personal/apps/arc/codebase/apps/web/apps/storefront/netlify.toml:1)
- [apps/seller/netlify.toml](/Volumes/Local/dev/pj-personal/apps/arc/codebase/apps/web/apps/seller/netlify.toml:1)

Netlify's current docs say:

- by default, changes in the repository root can trigger builds for all connected sites in a monorepo
- an `ignore` command can narrow that behavior
- an exit code of `0` skips the build
- an exit code of `1` continues the build

Current behavior after these changes:

- storefront builds only when `apps/storefront`, shared `packages`, or root workspace files change
- seller builds only when `apps/seller`, shared `packages`, or root workspace files change

## Important note

Netlify's docs also say that `ignore` does not cancel builds triggered by build hooks.

So this setup assumes:

- Netlify auto-deploy from Git stays enabled
- GitHub Actions does not trigger Netlify build hooks for these sites
