<script lang="ts" setup>
const props = withDefaults(defineProps<{
  page: number
  pageCount: number
  total: number | Ref<number> | ComputedRef<number> | undefined
}>(), {
  total: 0,
})

const emit = defineEmits<{ (e: 'onChangePage', value: number): void }>()

const currentPage = computed({
  get: () => props.page,
  set: value => emit('onChangePage', value),
})
const currentPageCount = computed(() => props.pageCount)
const currentTotal = computed(() => unref(props.total) ?? 0)
</script>

<template>
  <div
    v-if="currentTotal > 0"
    class="sticky bottom-0 flex w-full justify-end bg-surface pb-2"
  >
    <div class="shop-layout-content-inner !px-0">
      <div class="flex w-full items-center justify-between border-t border-border-subtle pt-2">
        <div
          v-if="currentTotal > currentPageCount"
          class="text-base text-text-subtle"
        >
          Viewing
          <span class="font-medium text-text-strong">
            {{ currentPageCount * (currentPage - 1) + 1 }} - {{ Math.min(currentPageCount * currentPage, currentTotal) }}
          </span>
          of
          <span class="font-medium text-text-strong">
            {{ currentTotal }}
          </span>
          results
        </div>
        <div
          v-else
          class="text-md text-text-subtle"
        >
          <span class="font-medium text-text-strong">
            {{ currentTotal }}
          </span> results
        </div>
        <UPagination
          v-if="currentTotal > currentPageCount"
          v-model="currentPage"
          :total="currentTotal"
          :page-count="currentPageCount"
          :inactive-button="{ color: 'gray' }"
        />
      </div>
    </div>
  </div>
</template>
