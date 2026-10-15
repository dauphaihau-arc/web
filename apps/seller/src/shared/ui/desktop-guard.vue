<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

/**
 * The seller app is desktop-only. The shop shell spends a fixed 220px on its
 * sidebar plus page gutters, so nothing below Tailwind's `xl` (1280px) has a
 * usable content width. Mounted once in `app.vue` around the app surface, which
 * covers every route and layout.
 *
 * The toggle is CSS, not `useMediaQuery` + `v-if`: seller surfaces are
 * server-rendered on several routes, and a class toggle keeps the first paint
 * correct there without a hydration pass or a flash of the wrong branch.
 */
</script>

<template>
  <div>
    <div class="hidden xl:block">
      <slot />
    </div>

    <Empty
      class="xl:hidden"
      variant="naked"
      size="2xl"
      :icon="ICON_NAME_BY_ALIAS.desktop"
      title="Desktop recommended"
      description="Seller Dashboard works best on a desktop or laptop. Please switch to a larger screen to manage your store."
      heading-class="font-semibold"
      container-class="min-h-screen"
    />
  </div>
</template>

<style scoped>
/*
  The primitive caps its header at `max-w-sm`, which wraps the notice copy into
  four lines; the notice is a full-page surface and reads as one wide line.
*/
:deep([data-slot='header']) {
  max-width: 48rem;
}
</style>
