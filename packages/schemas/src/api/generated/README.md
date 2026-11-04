# Generated API types

Everything in this directory is generated. `openapi.d.ts` is produced by `pnpm generate:api-types`
(`scripts/generate-api-types.mjs`) from `@dauphaihau-arc/api-spec`, the contract package published by
the API repo, and is committed so contract changes are reviewable in diffs. Install requires a
`NODE_AUTH_TOKEN` with `read:packages` for the `dauphaihau-arc` scope (see `.npmrc`). Do not edit
these files by hand; regenerate and run `pnpm generate:api-types -- --check` to detect drift.
