<script setup lang="ts">
import type { MyChatConversation } from '~/shared/api/me/chat/contracts/chat.contract'
import ChatConversationPanel from '~/app/components/chat/chat-conversation-panel.vue'
import RegisterLoginDialog from '~/app/components/dialogs/login-register/register-login-dialog.vue'
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract'
import { setPostAuthRedirect } from '~/shared/server-state/auth/post-auth-redirect'
import { useCreateOrGetMyChatConversation } from '~/shared/server-state/me/chat/create-conversation.mutation'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'

const { product } = defineProps<{
  product: GetDetailProductBySlugResponse
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

const items = [
  {
    id: 'info',
    label: 'Product details',
    defaultOpen: true,
    content: product.description ?? '',
  },
  {
    id: 'shipping',
    label: 'Shipping and return policies',
    defaultOpen: true,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed neque elit, tristique placerat feugiat ac, facilisis vitae arcu. Proin eget egestas augue. Praesent ut sem nec arcu pellentesque aliquet. Duis dapibus diam vel metus tempus vulputate.',
  },
  {
    id: 'seller',
    label: 'Meet your sellers',
    defaultOpen: true,
    content: product.shop.shop_name,
  },
]

const processTime = computed(() => {
  if (product?.shipping?.process_time_label) {
    return product.shipping.process_time_label
  }
  return ''
})

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
  const conversation = await createOrGetConversation({
    shop_id: product.shop.id,
    product_id: product.id,
  })

  activeConversation.value = conversation
  isSellerChatOpen.value = true
}

async function openSellerChat() {
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
  <UAccordion
    color="gray"
    variant="ghost"
    size="sm"
    multiple
    :items="items"
    :ui="{
      wrapper: '-ml-2.5',
      item: {
        padding: 'pl-1',
      },
    }"
  >
    <template #item="{ item }">
      <div
        v-if="item.id === 'info'"
        class="px-1 text-sm leading-6 whitespace-pre-line text-text-subtle"
      >
        {{ item.content }}
      </div>

      <div
        v-else-if="item.id === 'shipping'"
        class="space-y-2.5 px-1"
      >
        <div class="flex gap-2">
          <UIcon name="i-material-symbols:calendar-month-rounded" />
          Ships out within {{ processTime }} business days
        </div>
        <div class="flex gap-2">
          <UIcon name="i-material-symbols:location-on-outline" />
          Ship from {{ product?.shipping?.origin_country }}
        </div>
      </div>

      <div
        v-else-if="item.id === 'seller'"
        class="space-y-3 px-1"
      >
        <div class="text-sm text-text-subtle">
          Questions about this item? Start a direct conversation with {{ product.shop.shop_name }}.
        </div>
        <UButton
          color="gray"
          :loading="isOpeningChat"
          @click="openSellerChat"
        >
          Message {{ product.shop.shop_name }}
        </UButton>
      </div>

      <div
        v-else
        class="px-1 text-sm leading-6 whitespace-pre-line text-text-subtle"
      >
        {{ item.content }}
      </div>
    </template>
  </UAccordion>

  <Teleport to="body">
    <div
      v-if="isSellerChatOpen && activeConversation"
      class="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-4 sm:w-[420px]"
    >
      <div class="overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-overlay">
        <div class="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <div>
            <div class="text-sm font-semibold text-text-strong">
              Chat with {{ product.shop.shop_name }}
            </div>
            <div class="text-xs text-text-muted">
              Ask about this product directly from here.
            </div>
          </div>

          <UButton
            color="gray"
            variant="ghost"
            icon="i-lucide-x"
            aria-label="Close seller chat"
            class="-mr-2"
            @click="isSellerChatOpen = false"
          />
        </div>

        <div class="h-[min(70vh,640px)]">
          <ChatConversationPanel
            :conversation-id="activeConversation.id"
            :initial-conversation="activeConversation"
            :show-product-link="false"
            empty-state-text="Loading conversation..."
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>
