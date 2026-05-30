<script setup lang="ts">
const config = useRuntimeConfig()

const storefrontAppURL = computed(() => {
  return config.public.storefrontAppURL.replace(/\/+$/, '')
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100">
    <header class="px-4 py-6 sm:px-6 lg:px-8">
      <div class="mx-auto flex w-full max-w-5xl items-center">
        <NuxtLink
          :to="storefrontAppURL"
          external
          class="inline-flex rounded-lg px-2 py-1 text-sm font-semibold tracking-[0.2em] text-slate-950 transition hover:text-slate-700"
        >
          ARC
        </NuxtLink>
      </div>
    </header>

    <main class="flex flex-1 items-center px-4 pb-10 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl">
        <slot />
      </div>
    </main>

    <footer class="px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
      © 2026 Arc Inc.
    </footer>
  </div>
</template>
