<script lang="ts" setup>
const { page, pageCount, total = 0 } = defineProps<{
  page: number
  pageCount: number
  total: number | undefined
}>()

const emit = defineEmits<{ (e: 'onChangePage', value: number): void }>()

const isBottomPage = ref(false)
const pageRef = ref(page)

onMounted(() => {
  window.addEventListener('scroll', onScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

function onScroll() {
  const { scrollTop, offsetHeight } = document.documentElement
  isBottomPage.value = scrollTop + window.innerHeight > offsetHeight
}

watch(pageRef, () => {
  emit('onChangePage', pageRef.value)
})
</script>

<template>
  <div
    class="flex w-full justify-end bg-white pb-2"
    :class="{ 'fixed-pagination w-shop-layout-content': !isBottomPage || total <= pageCount }"
  >
    <div class="flex w-full items-center justify-between border-t border-gray-200 pt-2">
      <div
        v-if="total > pageCount"
        class="text-base text-customGray-850"
      >
        Viewing
        <span class="font-medium text-customGray-950">
          {{ pageCount * (page - 1) + 1 }} - {{ pageCount * page }}
        </span>
        of
        <span class="font-medium text-customGray-950">
          {{ total }}
        </span>
        results
      </div>
      <div
        v-else
        class="text-md text-customGray-850"
      >
        <span class="font-medium text-customGray-950">
          {{ total }}
        </span> results
      </div>
      <UPagination
        v-if="total > pageCount"
        v-model="pageRef"
        :total="total ?? 0"
        :page-count="pageCount"
        :inactive-button="{ color: 'gray' }"
      />
    </div>
  </div>
</template>

<style scoped>
.fixed-pagination {
 @apply flex fixed z-[2] bottom-0 pr-20 2xl:pr-12;
}
</style>
