<script setup lang="ts">
import LoginForm from '~/app/components/auth/login-form.vue'

useSeoMeta({
  title: 'Seller Login',
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
      <div class="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <section class="bg-slate-900 px-8 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
          <div class="flex h-full flex-col justify-between gap-10">
            <div class="space-y-4">
              <p class="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">
                Arc Seller
              </p>
              <h1 class="max-w-md text-4xl font-bold leading-tight">
                Sign in to manage your catalog, coupons, and orders.
              </h1>
              <p class="max-w-md text-base leading-7 text-slate-300">
                Use your seller account to access products, pricing, inventory, and fulfillment tools.
              </p>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p class="text-sm font-medium text-white">
                  Products
                </p>
                <p class="mt-1 text-sm text-slate-300">
                  Publish and update listings.
                </p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p class="text-sm font-medium text-white">
                  Coupons
                </p>
                <p class="mt-1 text-sm text-slate-300">
                  Launch promo codes and sales.
                </p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p class="text-sm font-medium text-white">
                  Orders
                </p>
                <p class="mt-1 text-sm text-slate-300">
                  Track and manage fulfillment.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="px-8 py-10 sm:px-10 lg:px-12 lg:py-14">
          <div class="mx-auto max-w-md">
            <div class="space-y-1.5">
              <h2 class="text-3xl font-bold text-slate-950">
                Log in
              </h2>
              <p class="text-base text-slate-600">
                Enter your seller account credentials to continue.
              </p>
            </div>

            <div class="mt-8">
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
