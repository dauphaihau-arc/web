<script setup lang="ts">
import FilterPopover from '@arc/ui/patterns/data-filter/filter-popover.vue'
import FilterToolbar from '@arc/ui/patterns/data-filter/filter-toolbar.vue'

const search = defineModel<string>('search', { required: true })

const searchDraft = ref('')
const isOpen = ref(false)

const hasActiveSearch = computed(() => search.value.trim().length > 0)

function updateOpen(nextOpen: boolean) {
  if (nextOpen) {
    searchDraft.value = search.value
  }

  isOpen.value = nextOpen
}

function applySearch() {
  search.value = searchDraft.value.trim()
  isOpen.value = false
}

function clearSearch() {
  searchDraft.value = ''
  search.value = ''
}
</script>

<template>
  <FilterToolbar class="mb-6">
    <FilterPopover
      :open="isOpen"
      label="Search"
      :active="hasActiveSearch"
      :value="hasActiveSearch ? search : undefined"
      :apply-disabled="!searchDraft.trim()"
      @update:open="updateOpen"
      @apply="applySearch"
      @clear="clearSearch"
    >
      <UInput
        v-model="searchDraft"
        placeholder="Search shops by name, slug, id or owner"
        autofocus
      />
    </FilterPopover>

    <UButton
      v-if="hasActiveSearch"
      variant="ghost"
      class="rounded-full"
      @click="clearSearch"
    >
      Clear filters
    </UButton>
  </FilterToolbar>
</template>
