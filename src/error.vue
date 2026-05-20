<script setup lang="ts">
import { routes } from '~/shared/navigation/routes'

interface IError {
  statusCode: number
  statusMessage: string
  message: string
}

const { error } = defineProps<{
  error: IError
}>()

const errorCode = computed(() => (
  !(error instanceof Error) || !error
    ? 500
    : error.statusCode
))

const errorMessage = computed(() => (
  !(error instanceof Error) || !error
    ? 'Something went wrong'
    : error.statusMessage
))

const handleError = () => {
  clearError({ redirect: routes.home() })
}

useHead({
  title: computed(() => (errorCode.value === 404 ? 'Page Not Found' : errorMessage.value)),
})
</script>

<template>
  <div class="mx-auto grid h-screen max-w-[350px] place-content-center text-center">
    <div class="mb-8">
      <h1 class="text-primary mb-3 text-xl font-medium">
        {{ errorCode }}
      </h1>
      <p class="text-2xl font-bold">
        {{ errorMessage }}
      </p>
    </div>
    <UButton
      size="xl"
      block
      @click="handleError"
    >
      Back to home
    </UButton>
  </div>
</template>
