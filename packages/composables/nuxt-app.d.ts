/**
 * Standalone typecheck shims for the Nuxt runtime this package runs inside.
 *
 * `#app` exists in every consuming Nuxt app; `nuxt/app` provides the same public
 * composable types without requiring generated app types.
 */
declare module '#app' {
  export * from 'nuxt/app'
}

/** Nuxt auto-import; not part of the `#app` module surface. */
const $fetch: import('nuxt/app').$Fetch
