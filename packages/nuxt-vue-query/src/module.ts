import { addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'

const COMPOSABLES = [
  'useQuery',
  'useQueries',
  'useInfiniteQuery',
  'useMutation',
  'useIsFetching',
  'useIsMutating',
  'useQueryClient',
]

export interface ModuleOptions {
  /** `useState` key used to transfer the dehydrated cache from server to client. */
  stateKey: string
  /** Composables auto-imported from `@tanstack/vue-query`. */
  autoImports: string[]
  /** Passed straight to the `QueryClient` constructor. */
  queryClientOptions: Record<string, unknown>
  /** Passed straight to `VueQueryPlugin`. */
  vueQueryPluginOptions: Record<string, unknown>
  /**
   * Apply `applyCategoryIdentityQueryPolicy` from `@arc/lib` as query-client
   * defaults. Category identity mismatch is terminal for the running app
   * instance, so category-bearing queries must not retry or auto-refetch while
   * blocked.
   */
  categoryIdentityPolicy: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'arc-vue-query',
    configKey: 'vueQuery',
  },
  defaults: {
    stateKey: 'vue-query',
    autoImports: COMPOSABLES,
    queryClientOptions: { defaultOptions: { queries: { staleTime: 5000 } } },
    vueQueryPluginOptions: {},
    categoryIdentityPolicy: false,
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // The plugin runs in the app, not the config, so options reach it through
    // public runtime config (same contract the previous module exposed).
    const publicConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
    publicConfig.vueQuery = defu(
      publicConfig.vueQuery as Record<string, unknown> | undefined,
      options as unknown as Record<string, unknown>,
    )

    addPlugin(resolve('./runtime/plugin'))

    if (options.autoImports.length > 0) {
      addImports(options.autoImports.map(name => ({ name, from: '@tanstack/vue-query' })))
    }
  },
})
