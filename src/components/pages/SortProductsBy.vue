<script setup lang="ts">
const router = useRouter()
const route = useRoute()

const options = [
  { id: null, label: 'Relevancy' },
  { id: 'newest', label: 'Newest' },
  { id: 'price_asc', label: 'Lowest Price' },
  { id: 'price_desc', label: 'Highest Price' },
]

const defaultValue = computed(() => {
  const order = route.query['order']
  if (order) {
    const foundOption = options.find(opt => opt.id === order)
    if (foundOption) return foundOption
  }
  return options[0]
})

const selected = ref(defaultValue.value)

watch(selected, () => {
  const routeQuery = { ...route.query }
  if (selected.value.id) {
    routeQuery.order = selected.value.id
  }
  else {
    delete routeQuery.order
  }
  router.push({ query: routeQuery })
})
</script>

<template>
  <div class="flex items-center gap-2">
    <div>Sort by:</div>
    <USelectMenu
      v-model="selected"
      :options="options"
      :ui-menu="{
        width: 'w-[10.5rem]',
      }"
    />
  </div>
</template>

<style scoped>

</style>
