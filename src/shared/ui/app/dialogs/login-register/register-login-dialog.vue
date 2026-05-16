<script setup lang="ts">
import LoginForm from './login-form.vue'
import RegisterForm from './register-form.vue'
import { useGetCurrentUser } from '~/shared/services/user'

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
  <UModal
    v-model="isOpen"
    :ui="{
      margin: '!mb-72',
    }"
  >
    <div class="space-y-5 p-12">
      <div class="space-y-1.5">
        <h1 class="text-3xl font-bold">
          {{ isLoginForm ? 'Log in' : 'Create your account' }}
        </h1>
        <p class="text-base text-customGray-950">
          {{
            isLoginForm
              ? 'Enter your credentials to access your account.' : 'Registration is easy.'
          }}
        </p>
      </div>

      <LoginForm v-if="isLoginForm" />
      <RegisterForm v-else />

      <div class="mt-3 flex items-center">
        <p class="text-sm text-customGray-950">
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
    </div>
  </UModal>
</template>
