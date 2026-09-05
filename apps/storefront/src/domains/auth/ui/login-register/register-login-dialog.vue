<script setup lang="ts">
import LoginForm from './login-form.vue'
import RegisterForm from './register-form.vue'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'

const route = useRoute()
const { data: dataUserAuth } = useGetCurrentUser()
const modal = useModal()

const isOpen = ref(false)
const isLoginForm = ref(true)

defineShortcuts({
  escape: {
    usingInput: true,
    whenever: [isOpen],
    handler: () => { isOpen.value = false },
  },
})

watch(() => route.path, () => {
  modal.close()
})

watch(() => dataUserAuth.value?.user, () => {
  if (dataUserAuth.value?.user) {
    modal.close()
  }
})
</script>

<template>
  <BaseDialog
    v-model="isOpen"
    :ui="{
      modal: {
        margin: '!mb-72',
      },
    }"
    width="w-full sm:max-w-[400px]"
  >
    <h1 class="mb-4 text-3xl font-bold">
      {{ isLoginForm ? 'Log in' : 'Create your account' }}
    </h1>

    <LoginForm v-if="isLoginForm" />
    <RegisterForm v-else />

    <div class="mt-3 flex items-center">
      <p class="text-sm text-text-strong">
        {{ isLoginForm ? 'New to Arc?' : 'Already a Arc user?' }}
      </p>
      <UButton
        variant="link"
        class="pl-1"
        @click="isLoginForm = !isLoginForm"
      >
        {{ isLoginForm ? 'Register' : 'Log in' }}
      </UButton>
    </div>
  </BaseDialog>
</template>
