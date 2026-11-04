# Generated API types

Everything in this directory is generated. `openapi.d.ts` is produced by `pnpm generate:api-types`
(`scripts/generate-api-types.mjs`) from `@dauphaihau-arc/api-spec` — falling back to the sibling
`apps/api/api/openapi.json` checkout when the package is not installed — and is committed so
contract changes are reviewable in diffs. Do not edit it by hand; regenerate and run
`pnpm generate:api-types -- --check` to detect drift.
