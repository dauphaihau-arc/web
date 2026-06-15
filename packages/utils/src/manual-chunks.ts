export function manualChunks(id: string): string | undefined {
  if (id.includes('/packages/ui/src/')) {
    return 'arc-ui'
  }

  if (!id.includes('node_modules')) {
    return undefined
  }

  if (
    id.includes('/@nuxt/ui/')
    || id.includes('/@headlessui/')
    || id.includes('/@floating-ui/')
    || id.includes('/@heroicons/')
  ) {
    return 'nuxt-ui'
  }

  if (
    id.includes('/@tanstack/')
    || id.includes('/@hebilicious/vue-query-nuxt/')
  ) {
    return 'vue-query'
  }

  if (id.includes('/dayjs/')) {
    return 'dayjs'
  }

  return undefined
}
