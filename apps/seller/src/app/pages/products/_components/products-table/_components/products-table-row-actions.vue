<script lang="ts" setup>
import type { DropdownItem } from '#ui/types'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import { isProductActive } from '../products-table.helpers'
import type { ProductRow } from '../products-table.types'

const props = defineProps<{
  row: ProductRow
}>()

const emit = defineEmits<{
  edit: [row: ProductRow]
  preview: [row: ProductRow]
  deactivate: [row: ProductRow]
  remove: [row: ProductRow]
}>()

/**
 * Only a live product can be deactivated, and only a live product has a
 * storefront page to preview.
 */
const isActiveProduct = computed(() => isProductActive(props.row))

/**
 * Icons come from the app icon tokens; every alias is registered in
 * `APP_ICON_CLIENT_BUNDLE_ICONS`, while raw names in a `.ts` module would not
 * reach nuxt icon's client-bundle scan.
 */
const dropdownItems = computed<DropdownItem[][]>(() => [
  [
    ...(isActiveProduct.value
      ? [{
          label: 'Deactivate',
          icon: ICON_NAME_BY_ALIAS.archive,
          click: () => emit('deactivate', props.row),
        }]
      : []),
    {
      label: 'Edit',
      icon: ICON_NAME_BY_ALIAS.edit,
      click: () => emit('edit', props.row),
    },
    ...(isActiveProduct.value
      ? [{
          label: 'Preview',
          icon: ICON_NAME_BY_ALIAS.preview,
          click: () => emit('preview', props.row),
        }]
      : []),
  ],
  [
    {
      label: 'Delete',
      icon: ICON_NAME_BY_ALIAS.trash,
      click: () => emit('remove', props.row),
    },
  ],
])
</script>

<template>
  <div class="flex w-full items-center justify-end gap-1">
    <div class="flex items-center">
      <UTooltip
        v-if="isActiveProduct"
        text="Preview product"
      >
        <UButton
          color="gray"
          variant="ghost"
          data-row-hover-action
          class="p-1.5 transition-opacity"
          @click="emit('preview', row)"
        >
          <template #leading>
            <AppIcon name="preview" />
          </template>
        </UButton>
      </UTooltip>
    </div>
    <UDropdown :items="dropdownItems">
      <UTooltip text="More actions">
        <UButton
          color="gray"
          variant="ghost"
        >
          <template #leading>
            <AppIcon name="moreHorizontal" />
          </template>
        </UButton>
      </UTooltip>
    </UDropdown>
  </div>
</template>
