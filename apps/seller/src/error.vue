<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { routePaths } from '~/shared/navigation/routes'

defineOptions({
  name: 'SellerErrorPage',
})

interface IError {
  statusCode: number
  statusMessage: string
  message: string
}

const { error } = defineProps<{
  error: IError
}>()

const errorCode = computed(() => error?.statusCode || 500)

const errorMessage = computed(() => error?.statusMessage || 'Something went wrong')

const handleError = () => {
  clearError({ redirect: routePaths.home })
}

useHead({
  title: computed(() => (errorCode.value === 404 ? 'Page Not Found' : errorMessage.value)),
})
</script>

<template>
  <Empty
    variant="naked"
    size="xl"
    :icon="ICON_NAME_BY_ALIAS['warning']"
    :title="errorMessage"
    :description="`Error code: ${errorCode}`"
    container-class="h-screen"
  >
    <template #actions>
      <UButton
        size="xl"
        @click="handleError"
      >
        Back to home
      </UButton>
    </template>
  </Empty>
</template>
