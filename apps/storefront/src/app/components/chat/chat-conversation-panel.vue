<script lang="ts" setup>
import {
  formatChatMessageTime,
  parseChatProductReference,
  shouldShowChatMessageTime,
} from '@arc/lib'
import { formatMinorCurrency } from '@arc/utils'
import ChatThreadPanel from '@arc/ui/shells/chat-thread-panel.vue'
import type {
  MyChatConversation,
  MyChatMessage,
} from '~/domains/me/api/chat/contracts/chat.contract'
import {
  getConversationShopInitial,
  getConversationShopName,
  isConversationUnread,
} from '~/app/components/chat/storefront-chat-conversation.helpers'
import { createStorefrontChatEventsClient } from '~/shared/realtime/chat-events.client'
import {
  getRoutePath,
  routes,
} from '~/shared/navigation/routes'
import { resolveStoragePublicUrl } from '~/shared/utils/storage-public-url'
import { useMyMarkChatRead } from '~/domains/me/mutations/chat/mark-read.mutation'
import { useMyChatMessages } from '~/domains/me/queries/chat/messages.query'
import { useMySendChatMessage } from '~/domains/me/mutations/chat/send-message.mutation'

const props = withDefaults(defineProps<{
  conversationId?: string
  initialConversation?: MyChatConversation | null
  emptyStateText?: string
  showHeader?: boolean
}>(), {
  initialConversation: null,
  emptyStateText: 'Select a conversation to read and reply.',
  showHeader: true,
})

const messageDraft = ref('')
const queryClient = useQueryClient()
const config = useRuntimeConfig()

const chatEventsClient = import.meta.client
  ? createStorefrontChatEventsClient(queryClient)
  : null

const messageParams = computed(() => ({
  limit: 50,
}))

const {
  data: messageList,
  fetchPreviousPage,
  hasPreviousPage,
  isFetchingPreviousPage,
  isPending: isPendingMessages,
} = useMyChatMessages(() => props.conversationId, messageParams)

const {
  mutateAsync: sendMessage,
  isPending: isSendingMessage,
} = useMySendChatMessage()
const { mutate: markConversationRead } = useMyMarkChatRead()

const messages = computed<MyChatMessage[]>(() => {
  const messageById = new Map<string, MyChatMessage>()

  for (const page of messageList.value?.pages ?? []) {
    for (const message of page.results) {
      messageById.set(message.id, message)
    }
  }

  return Array
    .from(messageById.values())
    .sort((left, right) => {
      const timeDelta = Date.parse(left.created_at) - Date.parse(right.created_at)

      return timeDelta === 0
        ? left.id.localeCompare(right.id)
        : timeDelta
    })
})

const threadMessages = computed(() => messages.value.map((message, index, messageList) => ({
  id: message.id,
  body: message.body,
  createdAtLabel: formatMessageTime(message),
  showCreatedAt: shouldShowMessageTime(message, index, messageList),
  isOwn: isOwnMessage(message),
  productReference: toProductReferenceDisplay(message),
})))

const selectedConversation = computed<MyChatConversation | null>(() => {
  return messageList.value?.pages.at(-1)?.conversation ?? props.initialConversation ?? null
})

watch(
  selectedConversation,
  (conversation: MyChatConversation | null) => {
    if (!conversation || !isConversationUnread(conversation)) {
      return
    }

    markConversationRead(conversation.id)
  },
  { immediate: true },
)

if (import.meta.client) {
  onMounted(() => {
    chatEventsClient?.start()
  })

  watch(
    () => props.conversationId,
    (conversationId: string | undefined, previousConversationId: string | undefined) => {
      if (previousConversationId) {
        chatEventsClient?.unsubscribeConversation(previousConversationId)
      }

      if (!conversationId) {
        return
      }

      chatEventsClient?.subscribeConversation(conversationId)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (props.conversationId) {
      chatEventsClient?.unsubscribeConversation(props.conversationId)
    }

    chatEventsClient?.stop()
  })
}

function formatMessageTime(message: MyChatMessage) {
  return formatChatMessageTime(message.created_at)
}

function shouldShowMessageTime(
  message: MyChatMessage,
  index: number,
  messageList: MyChatMessage[],
) {
  return shouldShowChatMessageTime(message, index, messageList)
}

function isOwnMessage(message: MyChatMessage) {
  return selectedConversation.value !== null
    && message.sender_user_id !== selectedConversation.value.shop.owner_user_id
}

function toProductReferenceDisplay(message: MyChatMessage) {
  const productReference = parseChatProductReference(message.metadata)

  if (!productReference) {
    return undefined
  }

  const snapshot = productReference.snapshot
  const priceLabel = snapshot.amount_minor != null && snapshot.currency
    ? formatMinorCurrency(snapshot.amount_minor, snapshot.currency)
    : undefined
  const statusLabel = productReference.current?.in_stock === false
    ? 'Currently unavailable'
    : undefined

  return {
    title: snapshot.title,
    imageUrl: resolveStoragePublicUrl({
      storageKey: snapshot.image_storage_key,
      assetHost: config.public.assetHost,
    }),
    priceLabel,
    statusLabel,
    href: getRoutePath(routes.productDetail(snapshot.shop_slug, snapshot.product_slug)),
  }
}

async function handleSendMessage() {
  const conversationId = props.conversationId
  const body = messageDraft.value.trim()

  if (!conversationId || !body || isSendingMessage.value) {
    return
  }

  await sendMessage({
    conversationId,
    body: { body },
  })

  messageDraft.value = ''
}
</script>

<template>
  <ChatThreadPanel
    :has-conversation="!!conversationId && !!selectedConversation"
    :loading="isPendingMessages"
    :empty="messages.length === 0"
    :empty-state-text="emptyStateText"
    :messages="threadMessages"
    :model-value="messageDraft"
    :sending="isSendingMessage"
    :has-older-messages="hasPreviousPage"
    :loading-older-messages="isFetchingPreviousPage"
    list-class="scrollbar-subtle min-h-0 flex-1 space-y-4 overflow-y-auto bg-surface-muted px-6 py-5"
    composer-class="shrink-0 bg-surface-muted px-6 pb-4"
    section-class="flex h-full min-h-0 flex-col"
    @update:model-value="messageDraft = $event"
    @load-older-messages="fetchPreviousPage"
    @send="handleSendMessage"
  >
    <template
      v-if="showHeader && selectedConversation"
      #header
    >
      <div class="flex shrink-0 items-center border-b border-border-subtle px-6 py-3.5">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex size-11 shrink-0 items-center justify-center rounded-full bg-customGray-200 text-base font-semibold text-text-strong">
            {{ getConversationShopInitial(selectedConversation) }}
          </div>

          <div class="min-w-0">
            <div class="truncate text-lg font-semibold text-text-strong">
              {{ getConversationShopName(selectedConversation) }}
            </div>
            <div class="truncate text-sm text-text-muted">
              Conversation
            </div>
          </div>
        </div>
      </div>
    </template>
  </ChatThreadPanel>
</template>
