<script setup lang="ts">
import type { Category } from '@arc/models/category'
import { getRoutePath, routes } from '~/shared/navigation/routes'
import { useGetRootCategories } from '~/shared/server-state/category/categories.query'

const {
  data: dataRootCategories,
  isPending: isPendingRootCategories,
  isFetching: isFetchingRootCategories,
} = useGetRootCategories()
const marketStore = useMarketStore()

const redirectByCategory = (rootCategory: Category) => {
  const to = getRoutePath(routes.category(rootCategory.name.replaceAll(' ', '-').toLowerCase()))
  marketStore.categoriesBreadcrumb = [{ ...rootCategory, to }]
  marketStore.userActivities.rootCategoryProductVisited = rootCategory
  navigateTo(to)
}
</script>

<template>
  <div>
    <div
      v-if="isPendingRootCategories && isFetchingRootCategories"
      class="flex gap-3"
    >
      <USkeleton
        v-for="index in 7"
        :key="index"
        class="h-7 w-20 rounded-md"
      />
    </div>

    <div
      v-else-if="dataRootCategories && dataRootCategories.length > 0"
      class="flex gap-3"
    >
      <div
        v-for="(cg, index) of dataRootCategories"
        :key="index"
      >
        <UButton
          color="gray"
          variant="ghost"
          class="icon-button w-full capitalize"
          @click="() => redirectByCategory(cg)"
        >
          {{ cg.name }}
        </UButton>
      </div>

      <!--        <UPopover :popper="{ offsetDistance: 0 }"> -->
      <!--          <UButton -->
      <!--            color="gray" -->
      <!--            variant="ghost" -->
      <!--            class="icon-button" -->
      <!--          > -->
      <!-- &lt;!&ndash;            <Icon name="i-material-symbols:menu" color="black" />&ndash;&gt; -->
      <!-- &lt;!&ndash;            Categories&ndash;&gt; -->

      <!--                        More -->

      <!--            <UPopover :popper="{ offsetDistance: 0 }"> -->
      <!--              <UButton -->
      <!--                color="gray" -->
      <!--                variant="ghost" -->
      <!--                class="icon-button" -->
      <!--              > -->
      <!--                <Icon name="i-material-symbols:menu" color="black" /> -->
      <!--                Categories -->
      <!--              </UButton> -->

      <!--              <template #panel="{ close }"> -->
      <!--                <div class="p-2 flex flex-col gap-3"> -->
      <!--                  <div v-for="(cg, index) of categories" :key="index"> -->
      <!--                    <UButton -->
      <!--                      color="gray" -->
      <!--                      variant="ghost" -->
      <!--                      class="icon-button capitalize w-full" -->
      <!--                      @click="() => { -->
      <!--                        redirectByCategory(cg) -->
      <!--                        close() -->
      <!--                      }" -->
      <!--                    > -->
      <!--                      {{ cg.name }} -->
      <!--                    </UButton> -->
      <!--                  </div> -->
      <!--                </div> -->
      <!--              </template> -->
      <!--            </UPopover> -->
      <!--          </UButton> -->

      <!--          <template #panel="{ close }"> -->
      <!--            <div class="p-2 flex flex-col gap-3"> -->
      <!--              <div v-for="(cg, index) of categories" :key="index"> -->
      <!--                <UButton -->
      <!--                  color="gray" -->
      <!--                  variant="ghost" -->
      <!--                  class="icon-button capitalize w-full" -->
      <!--                  @click="() => { -->
      <!--                    redirectByCategory(cg) -->
      <!--                    close() -->
      <!--                  }" -->
      <!--                > -->
      <!--                  {{ cg.name }} -->
      <!--                </UButton> -->
      <!--              </div> -->
      <!--            </div> -->
      <!--          </template> -->
      <!--        </UPopover> -->
    </div>
  </div>
</template>
