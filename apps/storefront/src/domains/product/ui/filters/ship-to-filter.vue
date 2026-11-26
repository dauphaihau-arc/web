<script setup lang="ts">
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/vue'
import { toCountryOptionLabel } from '~/domains/location/utils/country-flag'
import { useGetCountries } from '~/domains/location/queries/countries.query'
import { useProductListingFilters } from '~/domains/product/ui/filters/use-product-listing-filters'

/**
 * Catalog-only destination selector. The value is the URL-backed
 * `catalogShipTo`: `''` follows the current Market's Preview Destination,
 * `'all'` disables coverage filtering, and an ISO alpha-2 code filters to that
 * country. Home, detail, suggestions, and cart remain Market-scoped.
 *
 * The menu is teleported to the body because the desktop filter sidebar and
 * the mobile filter sheet both scroll; an in-flow popper would be clipped by
 * those containers.
 */
const props = defineProps<{
  mode?: 'live' | 'draft'
  /** Draft value when `mode` is `draft`; ignored in live mode. */
  modelValue?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { state } = useProductListingFilters()
const { t } = useI18n()
const marketStore = useMarketStore()
const { data: countries } = useGetCountries()

const triggerRef = ref<HTMLButtonElement | null>(null)
const query = ref('')
const menuStyle = ref<Record<string, string>>({})

const selectedValue = computed(() =>
  props.mode === 'draft' ? props.modelValue ?? '' : state.catalogShipTo,
)

// The implicit "My region" choice carries an empty value; keep its label
// visible on the trigger instead of rendering a blank control.
const myRegionLabel = computed(() => t('catalog.filters.shipping.myRegion', {
  region: marketStore.activePreferences?.region
    ?? marketStore.previewCountryCode
    ?? '',
}))

const options = computed(() => {
  const namesByCode = new Map<string, string>()

  for (const country of countries.value ?? []) {
    namesByCode.set(country.code.toUpperCase(), country.name)
  }

  // A hydrated URL can name a country outside the current server list; keep it
  // visible and selectable instead of rendering a blank control.
  if (selectedValue.value && selectedValue.value !== 'all' && !namesByCode.has(selectedValue.value)) {
    namesByCode.set(selectedValue.value, selectedValue.value)
  }

  const countryOptions = Array.from(namesByCode, ([value, name]) => ({
    value,
    name,
    label: toCountryOptionLabel(value, name),
  }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ value, label }) => ({ value, label }))

  return [
    { value: '', label: myRegionLabel.value },
    { value: 'all', label: t('catalog.filters.shipping.allDestinations') },
    ...countryOptions,
  ]
})

const selectedLabel = computed(() =>
  options.value.find(option => option.value === selectedValue.value)?.label
  ?? myRegionLabel.value,
)

const filteredOptions = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()

  if (!needle) {
    return options.value
  }

  return options.value.filter(option => option.label.toLocaleLowerCase().includes(needle))
})

function updateMenuPosition() {
  const rect = triggerRef.value?.getBoundingClientRect()

  if (!rect) {
    return
  }

  const margin = 8
  const width = Math.min(320, window.innerWidth - margin * 2)
  const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin)
  const spaceBelow = window.innerHeight - rect.bottom - margin
  const spaceAbove = rect.top - margin
  const preferUp = spaceBelow < 280 && spaceAbove > spaceBelow
  const maxHeight = Math.max(160, Math.min(320, preferUp ? spaceAbove : spaceBelow))

  menuStyle.value = {
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${maxHeight}px`,
    ...(preferUp
      ? { bottom: `${window.innerHeight - rect.top + margin}px` }
      : { top: `${rect.bottom + margin}px` }),
  }
}

function prepareOpen() {
  query.value = ''
  void nextTick(updateMenuPosition)
}

function onQueryChange(event: Event) {
  query.value = (event.target as HTMLInputElement).value
}

function onSelect(value: unknown) {
  const next = typeof value === 'string' ? value : ''

  query.value = ''

  if (props.mode === 'draft') {
    emit('update:modelValue', next)
    return
  }

  state.catalogShipTo = next
}

onMounted(() => {
  window.addEventListener('scroll', updateMenuPosition, true)
  window.addEventListener('resize', updateMenuPosition)
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateMenuPosition, true)
  window.removeEventListener('resize', updateMenuPosition)
})
</script>

<template>
  <Combobox
    v-slot="{ open }"
    :model-value="selectedValue"
    as="div"
    @update:model-value="onSelect"
  >
    <ComboboxButton as="template">
      <button
        ref="triggerRef"
        type="button"
        class="focus-visible:ring-primary flex w-full items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-left text-sm shadow-sm transition hover:bg-surface-muted focus:outline-none focus-visible:ring-2"
        :class="selectedValue ? 'text-text-strong' : 'text-text-subtle'"
        data-testid="ship-to-filter"
        @click="prepareOpen"
        @keydown.down="prepareOpen"
        @keydown.up="prepareOpen"
      >
        <span class="truncate">{{ selectedLabel }}</span>
        <AppIcon
          name="chevronDown"
          size="xs"
          class="shrink-0 text-text-subtle"
        />
      </button>
    </ComboboxButton>

    <Teleport
      v-if="open"
      to="body"
    >
      <div
        :style="menuStyle"
        class="fixed z-[100] flex flex-col overflow-hidden rounded-md bg-surface p-1 shadow-lg ring-1 ring-border-subtle"
      >
        <ComboboxInput
          :display-value="() => query"
          placeholder="Search..."
          autocomplete="off"
          autofocus
          class="mb-1 w-full border-b border-border-subtle bg-transparent px-3 py-1.5 text-sm text-text-strong placeholder:text-text-subtle focus:outline-none"
          @change="onQueryChange"
        />

        <ComboboxOptions
          static
          class="ship-to-options min-h-0 flex-1 overflow-y-auto p-1"
        >
          <ComboboxOption
            v-for="option in filteredOptions"
            :key="option.value"
            v-slot="{ active, selected: optionSelected }"
            :value="option.value"
            as="template"
          >
            <li
              class="flex cursor-default select-none items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm"
              :class="active ? 'bg-surface-muted text-text-strong' : 'text-text-strong'"
            >
              <span class="truncate">{{ option.label }}</span>
              <AppIcon
                v-if="optionSelected"
                name="i-heroicons-check-20-solid"
                size="xs"
                class="shrink-0"
              />
            </li>
          </ComboboxOption>

          <li
            v-if="!filteredOptions.length"
            class="px-2 py-1.5 text-sm text-text-subtle"
          >
            No results.
          </li>
        </ComboboxOptions>
      </div>
    </Teleport>
  </Combobox>
</template>

<style scoped>
.ship-to-options {
  scrollbar-width: thin;
  scrollbar-color: rgb(180 180 180) var(--surface-muted);
}

.ship-to-options::-webkit-scrollbar {
  width: 8px;
}

.ship-to-options::-webkit-scrollbar-track {
  background: var(--surface-muted);
  border-radius: 9999px;
}

.ship-to-options::-webkit-scrollbar-thumb {
  background: rgb(180 180 180);
  border-radius: 9999px;
}
</style>
