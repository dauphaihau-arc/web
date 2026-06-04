<script setup lang="ts">
import CreateShopForm from './_components/create-shop-form.vue'
import { isBackendWakeUpError } from '~/shared/composables/use-backend-status'
import { routes } from '~/shared/navigation/routes'
import { setPostAuthRedirect } from '~/shared/server-state/auth/post-auth-redirect'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'

definePageMeta({
  layout: 'auth',
  middleware: [
    async (to) => {
      const { data: dataUserAuth, refetch } = useGetCurrentUser()

      if (dataUserAuth.value?.user?.shop) {
        return navigateTo(routes.products())
      }

      if (dataUserAuth.value?.user) {
        return
      }

      try {
        const response = await refetch({ throwOnError: true })

        if (response.data?.user?.shop) {
          return navigateTo(routes.products())
        }

        if (response.data?.user) {
          return
        }
      }
      catch (error) {
        if (isBackendWakeUpError(error)) {
          void refetch()
          return
        }
      }

      setPostAuthRedirect(to.fullPath)
      return navigateTo(routes.login())
    },
  ],
})

useSeoMeta({
  title: 'Create Your Shop',
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
            Create your shop and start selling.
          </h1>
          <p class="max-w-md text-base leading-7 text-slate-300">
            You're already signed in. Set up your shop name and currency to start listing products.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p class="text-sm font-medium text-white">
              Shop setup
            </p>
            <p class="mt-1 text-sm text-slate-300">
              Pick your shop name and selling currency.
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p class="text-sm font-medium text-white">
              Catalog
            </p>
            <p class="mt-1 text-sm text-slate-300">
              Add products after onboarding is complete.
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p class="text-sm font-medium text-white">
              Orders
            </p>
            <p class="mt-1 text-sm text-slate-300">
              Manage fulfillment from the seller workspace.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="px-8 py-10 sm:px-10 lg:px-12 lg:py-14">
      <div class="mx-auto max-w-md">
        <div class="space-y-1.5">
          <h2 class="text-3xl font-bold text-slate-950">
            Create shop
          </h2>
          <p class="text-base text-slate-600">
            Set up your shop details to start listing products and managing orders.
          </p>
        </div>

        <div class="mt-8">
          <CreateShopForm />
        </div>
      </div>
    </section>
  </div>
</template>
