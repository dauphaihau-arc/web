<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import type { MyChatConversation } from '~/domains/me/api/chat/contracts/chat.contract'
import RegisterLoginDialog from '~/domains/auth/ui/login-register/register-login-dialog.vue'
import ChatConversationPanel from '~/domains/me/ui/chat/chat-conversation-panel.vue'
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract'
import { setPostAuthRedirect } from '~/domains/auth/utils/post-auth-redirect'
import { useCreateOrGetMyChatConversation } from '~/domains/me/mutations/chat/create-conversation.mutation'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { useGetCountries } from '~/domains/location/queries/countries.query'

const props = defineProps<{
  product?: GetDetailProductBySlugResponse
  isLoading?: boolean
}>()

const modal = useModal()
const route = useRoute()
const router = useRouter()

const { data: currentUser } = useGetCurrentUser()

const {
  mutateAsync: createOrGetConversation,
  isPending: isOpeningChat,
} = useCreateOrGetMyChatConversation()

const isSellerChatOpen = ref(false)
const activeConversation = ref<MyChatConversation | null>(null)
const hasAttemptedAutoOpenChat = ref(false)

const items = computed(() => [
  {
    id: 'info',
    label: 'Product details',
    defaultOpen: true,
    content: props.product?.description ?? '',
  },
  {
    id: 'shipping',
    label: 'Shipping and return policies',
    defaultOpen: true,
    content: '',
  },
  {
    id: 'seller',
    label: 'Meet your sellers',
    defaultOpen: true,
    content: props.product?.shop.shop_name ?? '',
  },
])

const countryNameByIso2 = computed(() => new Map(
  (countriesResponse.value?.data ?? [])
    .filter(country => country.Iso2)
    .map(country => [country.Iso2!.toUpperCase(), country.name]),
))

function countryLabel(iso2?: string) {
  if (!iso2) {
    return ''
  }

  return countryNameByIso2.value.get(iso2.toUpperCase()) ?? iso2
}

const shippingCoverage = computed(() => {
  const destinations = props.product?.shipping?.destinations ?? []
  if (destinations.length === 0) {
    return []
  }

  const labels = destinations.map((destination) => {
    switch (destination.destination_scope) {
      case 'everywhere_else':
        return 'Ships worldwide'
      case 'country':
        return destination.destination_country ? `Ships to ${countryLabel(destination.destination_country)}` : ''
      default:
        return ''
    }
  }).filter(label => label.length > 0)

  return [...new Set(labels)]
})

const { data: countriesResponse } = useGetCountries()

const shouldAutoOpenChat = computed(() => route.query.open_chat === '1')

const productChatRedirectPath = computed(() => {
  return router.resolve({
    path: route.path,
    query: {
      ...route.query,
      open_chat: '1',
    },
  }).fullPath
})

async function showSellerChat() {
  if (!props.product) {
    return
  }

  const conversation = await createOrGetConversation({
    shop_id: props.product.shop.id,
    product_id: props.product.id,
  })

  activeConversation.value = conversation
  isSellerChatOpen.value = true
}

async function openSellerChat() {
  if (!props.product) {
    return
  }

  if (!currentUser.value?.user) {
    setPostAuthRedirect(productChatRedirectPath.value)
    modal.open(RegisterLoginDialog)
    return
  }

  await showSellerChat()
}

watch(
  () => [currentUser.value?.user?.id, shouldAutoOpenChat.value] as const,
  async ([userId, autoOpenChat]) => {
    if (!userId || !autoOpenChat || hasAttemptedAutoOpenChat.value) {
      return
    }

    hasAttemptedAutoOpenChat.value = true
    await showSellerChat()
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="props.isLoading"
    class="space-y-4"
    aria-busy="true"
    aria-live="polite"
  >
    <div
      v-for="index in 3"
      :key="index"
      class="space-y-3 border-b border-border-subtle pb-6"
    >
      <div class="flex items-center justify-between">
        <USkeleton class="h-5 w-40 !bg-customGray-300/85" />
        <USkeleton class="size-5 rounded !bg-customGray-300/85" />
      </div>
      <USkeleton class="h-4 w-full !bg-customGray-300/85" />
      <USkeleton class="h-4 w-5/6 !bg-customGray-300/85" />
    </div>
  </div>

  <div v-else>
    <UAccordion
      color="gray"
      variant="ghost"
      size="sm"
      multiple
      :items="items"
      :ui="{
        wrapper: '-ml-2.5',
        item: {
          padding: 'pl-1 pb-8',
        },
        default: {
          class: 'text-base font-semibold',
        },
      }"
    >
      <template #item="{ item }">
        <div
          v-if="item.id === 'info'"
          class="whitespace-pre-line px-1 text-sm leading-6 text-text-subtle"
        >
          {{ item.content }}
        </div>

        <div
          v-else-if="item.id === 'shipping'"
          class="space-y-2.5 px-1"
        >
          <template v-if="shippingCoverage.length > 0">
            <div
              v-for="line in shippingCoverage"
              :key="line"
              class="flex gap-2"
            >
              <UIcon name="i-material-symbols:location-on-outline" />
              {{ line }}
            </div>
          </template>
          <div
            v-else
            class="flex gap-2 text-text-subtle"
          >
            <UIcon name="i-material-symbols:location-on-outline" />
            Shipping coverage not available
          </div>
        </div>

        <div
          v-else-if="item.id === 'seller'"
          class="space-y-3 px-1"
        >
          <div class="text-sm text-text-subtle">
            Questions about this item? Start a direct conversation with {{ props.product?.shop.shop_name }}.
          </div>
          <UButton
            color="gray"
            :loading="isOpeningChat"
            @click="openSellerChat"
          >
            Message {{ props.product?.shop.shop_name }}
          </UButton>
        </div>

        <div
          v-else
          class="whitespace-pre-line px-1 text-sm leading-6 text-text-subtle"
        >
          {{ item.content }}
        </div>
      </template>
    </UAccordion>

    <Teleport to="body">
      <div
        v-if="isSellerChatOpen && activeConversation"
        class="fixed inset-0 z-50"
      >
        <div
          class="absolute inset-0"
          aria-hidden="true"
          @click="isSellerChatOpen = false"
        />

        <div class="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:w-[420px]">
          <div
            class="overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-overlay"
            @click.stop
          >
            <div class="flex items-center justify-between border-b border-border-subtle px-5 py-3">
              <div>
                <div class="text-sm font-semibold text-text-strong">
                  {{ props.product?.shop.shop_name }}
                </div>
                <div class="text-xs text-text-muted">
                  Ask about this product directly from here.
                </div>
              </div>

              <UButton
                color="gray"
                variant="ghost"
                :icon="ICON_NAME_BY_ALIAS['x']"
                aria-label="Close seller chat"
                class="-mr-2"
                @click="isSellerChatOpen = false"
              />
            </div>

            <div class="h-[min(70vh,640px)]">
              <ChatConversationPanel
                :conversation-id="activeConversation.id"
                :initial-conversation="activeConversation"
                :show-header="false"
                autofocus-composer
                empty-state-text="Loading conversation..."
              />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
