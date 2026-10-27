<script setup lang="ts">
import LoginForm from './_components/login-form.vue'

definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Admin Login',
})
</script>

<template>
  <div class="mx-auto w-full max-w-lg rounded-3xl border border-border-subtle bg-surface px-8 py-10 shadow-2xl sm:px-10 lg:px-12 lg:py-14">
    <div class="mx-auto max-w-md">
      <div class="space-y-1.5">
        <h2 class="text-3xl font-bold text-text-strong">
          Log in
        </h2>
        <p class="text-base text-text-subtle">
          Enter your admin account credentials to continue.
        </p>
      </div>

      <div class="mt-8">
        <LoginForm />
      </div>
    </div>
  </div>
</template>
