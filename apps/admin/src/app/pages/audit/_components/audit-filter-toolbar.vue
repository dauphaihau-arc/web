<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import FilterPopover from '@arc/ui/patterns/data-filter/filter-popover.vue'
import FilterToolbar from '@arc/ui/patterns/data-filter/filter-toolbar.vue'
import MultiSelectPanel from '@arc/ui/patterns/data-filter/multi-select-panel.vue'
import { summarizeFilterLabels } from '@arc/ui/patterns/data-filter/summary'
import {
  ADMIN_AUDIT_ACTION_OPTIONS,
  ADMIN_AUDIT_ENTITY_TYPE_OPTIONS,
} from '~/domains/audit/utils/audit-presentation'

defineProps<{
  isExporting: boolean
}>()

const emit = defineEmits<{
  export: []
}>()

const actions = defineModel<string[]>('actions', { default: () => [] })
const entityTypes = defineModel<string[]>('entityTypes', { default: () => [] })
const search = defineModel<string>('search', { required: true })

const searchDraft = ref('')
const actionsDraft = ref<string[]>([...actions.value])
const entityTypesDraft = ref<string[]>([...entityTypes.value])

const openFilter = ref<'search' | 'actions' | 'types' | null>(null)

const hasActiveSearchFilter = computed(() => search.value.length > 0)
const hasActiveActionsFilter = computed(() => actions.value.length > 0)
const hasActiveTypesFilter = computed(() => entityTypes.value.length > 0)
const hasActiveFilters = computed(() =>
  hasActiveSearchFilter.value
  || hasActiveActionsFilter.value
  || hasActiveTypesFilter.value,
)

const searchFilterSummary = computed(() =>
  search.value || undefined,
)

const actionsFilterSummary = computed(() => {
  if (actions.value.length === 0) {
    return undefined
  }

  return summarizeFilterLabels(
    ADMIN_AUDIT_ACTION_OPTIONS
      .filter(option => actions.value.includes(option.value))
      .map(option => option.label),
  )
})

const typesFilterSummary = computed(() => {
  if (entityTypes.value.length === 0) {
    return undefined
  }

  return summarizeFilterLabels(
    ADMIN_AUDIT_ENTITY_TYPE_OPTIONS
      .filter(option => entityTypes.value.includes(option.value))
      .map(option => option.label),
  )
})

watch(actions, (value) => {
  actionsDraft.value = [...value]
}, { deep: true })

watch(entityTypes, (value) => {
  entityTypesDraft.value = [...value]
}, { deep: true })

function applySearchFilter() {
  search.value = searchDraft.value.trim()
}

function clearSearchFilter() {
  searchDraft.value = ''
  search.value = ''
}

function applyActionsFilter() {
  actions.value = [...actionsDraft.value]
}

function clearActionsFilter() {
  actionsDraft.value = []
  actions.value = []
}

function applyTypesFilter() {
  entityTypes.value = [...entityTypesDraft.value]
}

function clearTypesFilter() {
  entityTypesDraft.value = []
  entityTypes.value = []
}

function clearAllFilters() {
  openFilter.value = null
  clearSearchFilter()
  clearActionsFilter()
  clearTypesFilter()
}

function updateOpenFilter(filter: 'search' | 'actions' | 'types', open: boolean) {
  if (open) {
    openFilter.value = filter
    return
  }

  if (openFilter.value === filter) {
    openFilter.value = null
  }
}
</script>

<template>
  <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
    <FilterToolbar class="min-w-0 flex-1">
      <FilterPopover
        :open="openFilter === 'search'"
        label="Search"
        :active="hasActiveSearchFilter"
        :value="searchFilterSummary"
        :apply-disabled="!searchDraft.trim()"
        @update:open="updateOpenFilter('search', $event)"
        @apply="applySearchFilter"
        @clear="clearSearchFilter"
      >
        <UInput
          v-model="searchDraft"
          :icon="ICON_NAME_BY_ALIAS.search"
          type="search"
          placeholder="Search by user, order ID, or target"
          autofocus
        />
      </FilterPopover>

      <FilterPopover
        :open="openFilter === 'actions'"
        label="Actions"
        :active="hasActiveActionsFilter"
        :value="actionsFilterSummary"
        panel-class="w-[min(92vw,360px)]"
        @update:open="updateOpenFilter('actions', $event)"
        @apply="applyActionsFilter"
        @clear="clearActionsFilter"
      >
        <MultiSelectPanel
          v-model="actionsDraft"
          :options="ADMIN_AUDIT_ACTION_OPTIONS"
        />
      </FilterPopover>

      <FilterPopover
        :open="openFilter === 'types'"
        label="Modules"
        :active="hasActiveTypesFilter"
        :value="typesFilterSummary"
        panel-class="w-[min(92vw,300px)]"
        @update:open="updateOpenFilter('types', $event)"
        @apply="applyTypesFilter"
        @clear="clearTypesFilter"
      >
        <MultiSelectPanel
          v-model="entityTypesDraft"
          :options="ADMIN_AUDIT_ENTITY_TYPE_OPTIONS"
        />
      </FilterPopover>

      <UButton
        v-if="hasActiveFilters"
        variant="ghost"
        class="rounded-full"
        @click="clearAllFilters"
      >
        Clear filters
      </UButton>
    </FilterToolbar>

    <UButton
      class="shrink-0"
      color="gray"
      :icon="ICON_NAME_BY_ALIAS.downloadTray"
      :loading="isExporting"
      :disabled="isExporting"
      @click="emit('export')"
    >
      Export CSV
    </UButton>
  </div>
</template>
