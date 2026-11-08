import { QueryClient, VueQueryPlugin, dehydrate, hydrate, type DehydratedState } from '@tanstack/vue-query'
import { applyCategoryIdentityQueryPolicy, type CategoryIdentityQueryClient } from '@arc/lib'
import { defineNuxtPlugin, useState } from '#imports'

interface VueQueryRuntimeOptions {
  stateKey: string
  queryClientOptions: ConstructorParameters<typeof QueryClient>[0]
  vueQueryPluginOptions: Record<string, unknown>
  categoryIdentityPolicy: boolean
}

export default defineNuxtPlugin((nuxt) => {
  const { stateKey, queryClientOptions, vueQueryPluginOptions, categoryIdentityPolicy } =
    useRuntimeConfig().public.vueQuery as unknown as VueQueryRuntimeOptions

  const vueQueryState = useState<Partial<DehydratedState> | undefined>(stateKey)
  const queryClient = new QueryClient(queryClientOptions)

  if (categoryIdentityPolicy) {
    applyCategoryIdentityQueryPolicy({
      queryClient: queryClient as unknown as CategoryIdentityQueryClient,
    })
  }

  nuxt.vueApp.use(VueQueryPlugin, { queryClient, ...vueQueryPluginOptions })

  if (import.meta.server) {
    nuxt.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient)
    })
  }

  if (import.meta.client) {
    hydrate(queryClient, vueQueryState.value ?? {})
  }
})
