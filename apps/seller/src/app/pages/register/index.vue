<script setup lang="ts">
import RegisterForm from './_components/register-form.vue'
import { routes } from '~/shared/navigation/routes'

definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Seller Register',
})
</script>

<template>
  <div class="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
    <section class="bg-slate-900 px-8 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
      <div class="flex h-full flex-col justify-between gap-10">
        <div class="space-y-4">
          <p class="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">
            Arc Seller
          </p>
          <h1 class="max-w-md text-4xl font-bold leading-tight">
            Create your account to start selling on Arc.
          </h1>
          <p class="max-w-md text-base leading-7 text-slate-300">
            Register first, then create your shop to start listing products and managing orders.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p class="text-sm font-medium text-white">
              Catalog
            </p>
            <p class="mt-1 text-sm text-slate-300">
              Add and update product listings.
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p class="text-sm font-medium text-white">
              Promotions
            </p>
            <p class="mt-1 text-sm text-slate-300">
              Configure coupons and campaigns.
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p class="text-sm font-medium text-white">
              Fulfillment
            </p>
            <p class="mt-1 text-sm text-slate-300">
              Monitor incoming orders and status.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="px-8 py-10 sm:px-10 lg:px-12 lg:py-14">
      <div class="mx-auto max-w-md">
        <div class="space-y-1.5">
          <h2 class="text-3xl font-bold text-slate-950">
            Register
          </h2>
          <p class="text-base text-slate-600">
            Create your account first. You’ll set up your shop in the next step.
          </p>
        </div>

        <div class="mt-8">
          <RegisterForm />
        </div>

        <p class="mt-6 text-sm text-slate-600">
          Already have an account?
          <NuxtLink
            :to="routes.login()"
            class="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4"
          >
            Log in
          </NuxtLink>
        </p>
      </div>
    </section>
  </div>
</template>
