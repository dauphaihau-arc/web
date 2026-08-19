import type { NuxtPage } from '@nuxt/schema'

const PAGE_SUPPORT_DIRECTORY_PATTERN = /\/pages\/.*\/_(components|composables|schemes)\//

export function removePageComponents(pages: NuxtPage[]) {
  for (let index = pages.length - 1; index >= 0; index -= 1) {
    const page = pages[index]

    if (page.file && PAGE_SUPPORT_DIRECTORY_PATTERN.test(page.file)) {
      pages.splice(index, 1)
      continue
    }

    if (page.children?.length) {
      removePageComponents(page.children)
    }
  }
}
