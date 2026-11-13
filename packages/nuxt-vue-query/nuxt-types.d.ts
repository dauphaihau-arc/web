/**
 * Standalone typecheck shims for the Nuxt module runtime.
 *
 * `#imports` exists in every consuming Nuxt app; `nuxt/app` provides the same
 * public composable types without requiring generated app types.
 */
declare module '#imports' {
  export * from 'nuxt/app'
}

/** Nuxt auto-import used by the runtime plugin. */
declare const useRuntimeConfig: typeof import('nuxt/app').useRuntimeConfig

/** Nuxt populates these flags on `import.meta` in module runtime code. */
interface ImportMeta {
  readonly server: boolean
  readonly client: boolean
}
