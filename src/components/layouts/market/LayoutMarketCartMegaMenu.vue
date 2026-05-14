<script lang="ts" setup>
import { ROUTES } from '~/config/enums/routes'
import { RegisterLoginDialog } from '#components'
import { useLogout } from '~/services/auth'
import { useGetCurrentUser } from '~/services/user'
import { useGetCart } from '~/services/cart'

const props = defineProps<{ show: boolean }>()

const router = useRouter()
const modal = useModal()
const { data: dataUserAuth } = useGetCurrentUser()

const {
  data: dataGetCart,
} = useGetCart()

const {
  mutate: logout,
  isPending: isPendingLogout,
} = useLogout()

const showRegisterLoginDialog = () => {
  modal.open(RegisterLoginDialog)
}

const handleLogout = () => {
  if (isPendingLogout.value) return
  logout()
}

const remainProductCart = computed(() => {
  if (dataGetCart.value?.cart) {
    return dataGetCart.value.cart.totalQuantity - dataGetCart.value.cart.recentItems.length
  }
  return 0
})
</script>

<template>
  <transition name="slide-down">
    <div
      v-if="props.show"
      id="mega-menu-cart"
    >
      <div class="mx-auto ml-5 pb-12">
        <div class="mb-4 flex justify-between gap-3">
          <div class="text-2xl font-semibold">
            Cart
          </div>
          <UButton
            v-if="dataUserAuth?.user"
            :to="ROUTES.CART"
            label="Review Cart"
          >
            <template #trailing>
              <UIcon name="i-heroicons-arrow-right-20-solid" />
            </template>
          </UButton>
        </div>

        <div class="mb-10">
          <div v-if="dataUserAuth?.user">
            <div v-if="dataGetCart?.cart && dataGetCart?.cart.recentItems.length > 0">
              <div class="mb-6 space-y-8">
                <div
                  v-for="(productCart, index) in dataGetCart.cart.recentItems"
                  :key="index"
                >
                  <div
                    class="flex cursor-pointer items-center gap-6"
                    @click="() => router.push(`${ROUTES.PRODUCTS}/${productCart.product.id}`)"
                  >
                    <NuxtImg
                      :src="`domainAwsS3/${productCart.product.imageUrl}`"
                      width="70"
                      height="70"
                      class="rounded"
                    />
                    <div>
                      <div class="text-xl font-medium">
                        {{ productCart.product.title }}
                      </div>
                      <div class="text-[15px] text-zinc-500">
                        {{ productCart.inventory.variantName }}
                      </div>
                      <div class="text-[15px] tracking-wide text-zinc-500">
                        x{{ productCart.quantity }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                v-if="remainProductCart > 0"
                class="text-customGray-950"
              >
                {{ remainProductCart }} more product in your Cart
              </div>
            </div>
            <div
              v-else
              class="text-customGray-950"
            >
              Your cart is empty.
            </div>
          </div>

          <div
            v-else
            class="flex items-center gap-1"
          >
            <UButton
              id="login-btn"
              size="sm"
              variant="link"
              label="Log in"
              :trailing="false"
              :ui="{
                base: 'underline',
                padding: {
                  sm: 'p-0',
                },
              }"
              @click="showRegisterLoginDialog"
            />

            <span class=" text-sm text-customGray-950">
              to see products you added into cart
            </span>
          </div>
        </div>

        <div
          v-if="dataUserAuth?.user"
          id="user-profile"
        >
          <div class="mb-2 text-customGray-950">
            My Profile
          </div>
          <div class="flex flex-col gap-2">
            <div
              class="item-profile"
              @click="() => router.push(ROUTES.ORDERS)"
            >
              <UIcon
                name="i-heroicons-cube"
                color="gray"
              />
              Orders
            </div>
            <div
              class="item-profile"
              @click="() => router.push(ROUTES.ACCOUNT)"
            >
              <UIcon
                name="i-heroicons-user"
                color="gray"
              />
              Account
            </div>
            <div
              class="item-profile"
              @click="() => router.push(ROUTES.ACCOUNT + ROUTES.SHOP)"
            >
              <UIcon
                name="i-heroicons-building-storefront"
                color="gray"
              />
              Manage Shop
            </div>
            <div
              class="item-profile"
              @click="handleLogout"
            >
              <UIcon
                name="i-heroicons-arrow-left-start-on-rectangle"
                color="gray"
              />
              Logout {{ dataUserAuth?.user?.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height 0.3s ease-in-out;
}

.slide-down-enter-to,
.slide-down-leave-from {
  overflow: hidden;
  max-height: 500px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  overflow: hidden;
  max-height: 0;
}

.item-profile {
  @apply font-medium flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100
  hover:bg-gray-100 px-2 py-1 rounded-md
}
</style>
