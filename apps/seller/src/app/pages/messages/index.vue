import { useQueryClient } from '@tanstack/vue-query'

<script lang="ts" setup>
import dayjs from 'dayjs'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'
import { createSellerChatEventsClient } from '~/shared/realtime/chat-events.client'
import { useGetMyShop } from '~/shared/server-state/shop/my-shop.query'
import { useShopMarkChatRead } from '~/shared/server-state/shop/chat/mark-read.mutation'
import { useShopChatMessages } from '~/shared/server-state/shop/chat/messages.query'
import { useShopSendChatMessage } from '~/shared/server-state/shop/chat/send-message.mutation'
import {
  useShopChatConversations,
  useShopChatUnreadCount,
} from '~/shared/server-state/shop/chat/conversations.query'
import type {
  ShopChatConversation,
  ShopChatMessage,
} from '~/shared/api/shop/chat/contracts/chat.contract'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const config = useRuntimeConfig()
const storefrontAppURL = computed(() => config.public.storefrontAppURL.replace(/\/+$/, ''))
const chatEventsClient = import.meta.client
  ? createSellerChatEventsClient(queryClient)
  : null
const selectedConversationId = computed(() => {
  const value = route.query.conversation_id
  return typeof value === 'string' ? value : undefined
})

const conversationParams = computed(() => ({
  page: 1,
  limit: 50,
}))

const messageParams = computed(() => ({
  page: 1,
  limit: 100,
}))

const messageDraft = ref('')
const selectedConversation = ref<ShopChatConversation | null>(null)
const messageListEl = ref<HTMLElement | null>(null)

const { data: myShop } = useGetMyShop()
const { data: unreadCount } = useShopChatUnreadCount()
const {
  data: conversationList,
  isPending: isPendingConversations,
} = useShopChatConversations(conversationParams)
const {
  data: messageList,
  isPending: isPendingMessages,
} = useShopChatMessages(selectedConversationId, messageParams)
const {
  mutateAsync: sendMessage,
  isPending: isSendingMessage,
} = useShopSendChatMessage()
const { mutate: markConversationRead } = useShopMarkChatRead()

const conversations = computed<ShopChatConversation[]>(() => conversationList.value?.results ?? [])
const messages = computed<ShopChatMessage[]>(() => messageList.value?.results ?? [])

const selectedConversationResolved = computed<ShopChatConversation | null>(() => {
  return messageList.value?.conversation
    ?? conversations.value.find((conversation: ShopChatConversation) => conversation.id === selectedConversationId.value)
    ?? null
})

const shopOwnerUserId = computed(() => myShop.value?.owner_user_id)

const selectedConversationUnread = computed(() => {
  const conversation = selectedConversationResolved.value

  if (!conversation || !shopOwnerUserId.value) {
    return false
  }

  return conversation.last_message_sender_user_id !== null
    && conversation.last_message_sender_user_id !== shopOwnerUserId.value
    && (
      !conversation.seller_last_read_at
      || (
        !!conversation.last_message_at
        && conversation.seller_last_read_at < conversation.last_message_at
      )
    )
})

watch(
  conversations,
  (nextConversations: ShopChatConversation[]) => {
    if (selectedConversationId.value) {
      return
    }

    const firstConversation = nextConversations[0]

    if (!firstConversation) {
      return
    }

    router.replace(routes.messages({ conversationId: firstConversation.id }))
  },
  { immediate: true },
)

watch(
  selectedConversationResolved,
  (conversation: ShopChatConversation | null) => {
    selectedConversation.value = conversation

    if (!conversation || !selectedConversationUnread.value) {
      return
    }

    markConversationRead(conversation.id)
  },
  { immediate: true },
)

watch(
  messages,
  async () => {
    await nextTick()

    if (!messageListEl.value) {
      return
    }

    messageListEl.value.scrollTop = messageListEl.value.scrollHeight
  },
)

if (import.meta.client) {
  onMounted(() => {
    chatEventsClient?.start()
  })

  watch(
    selectedConversationId,
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
    if (selectedConversationId.value) {
      chatEventsClient?.unsubscribeConversation(selectedConversationId.value)
    }

    chatEventsClient?.stop()
  })
}

function selectConversation(conversation: ShopChatConversation) {
  router.push(routes.messages({ conversationId: conversation.id }))
}

function isConversationUnread(conversation: ShopChatConversation) {
  if (!shopOwnerUserId.value) {
    return false
  }

  return conversation.last_message_sender_user_id !== null
    && conversation.last_message_sender_user_id !== shopOwnerUserId.value
    && (
      !conversation.seller_last_read_at
      || (
        !!conversation.last_message_at
        && conversation.seller_last_read_at < conversation.last_message_at
      )
    )
}

function formatConversationTime(value?: string | null) {
  if (!value) {
    return ''
  }

  return dayjs(value).format('MMM D, HH:mm')
}

function formatMessageTime(message: ShopChatMessage) {
  return dayjs(message.created_at).format('HH:mm')
}

function openProductPreview() {
  const conversation = selectedConversationResolved.value
  const productSlug = conversation?.product?.slug

  if (!conversation || !productSlug) {
    return
  }

  navigateTo(
    `${storefrontAppURL.value}/${conversation.shop.slug}/${productSlug}`,
    {
      external: true,
      open: { target: '_blank' },
    },
  )
}

function isOwnMessage(message: ShopChatMessage) {
  return message.sender_user_id === shopOwnerUserId.value
}

async function handleSendMessage() {
  const conversationId = selectedConversationId.value
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
  <LayoutShopWrapperContent>
    <template #title>
      Messages
    </template>
    <template #description>
      Respond to buyer conversations and keep support requests moving.
    </template>
    <template #actions>
      <div class="rounded-full  px-3 py-1 text-sm text-zinc-700">
        Unread: {{ unreadCount?.unread_count ?? 0 }}
      </div>
    </template>
    <template #content>
      <div class="grid min-h-[70vh] grid-cols-[360px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <aside class="border-r border-zinc-200">
          <div class="border-b border-zinc-200 px-5 py-4">
            <div class="text-sm font-semibold text-zinc-900">
              Conversations
            </div>
            <div class="text-sm text-zinc-500">
              {{ conversationList?.total_results ?? 0 }} total threads
            </div>
          </div>

          <div
            v-if="isPendingConversations"
            class="grid h-[60vh] place-content-center text-sm text-zinc-500"
          >
            Loading conversations...
          </div>

          <div
            v-else-if="conversations.length === 0"
            class="grid h-[60vh] place-content-center px-6 text-center text-sm text-zinc-500"
          >
            No buyer conversations yet.
          </div>

          <div
            v-else
            class="max-h-[70vh] overflow-y-auto"
          >
            <button
              v-for="conversation in conversations"
              :key="conversation.id"
              type="button"
              class="flex w-full flex-col gap-2 border-b border-zinc-100 px-5 py-4 text-left transition hover:bg-zinc-50"
              :class="[
                selectedConversationId === conversation.id ? 'bg-zinc-50' : '',
              ]"
              @click="selectConversation(conversation)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-zinc-900">
                    {{ conversation.product?.title || 'General inquiry' }}
                  </div>
                  <div class="truncate text-xs text-zinc-500">
                    {{ conversation.product?.slug || conversation.shop.slug }}
                  </div>
                </div>
                <div class="shrink-0 text-xs text-zinc-400">
                  {{ formatConversationTime(conversation.last_message_at || conversation.created_at) }}
                </div>
              </div>

              <div class="flex items-center justify-between gap-2">
                <div class="truncate text-xs text-zinc-500">
                  Buyer: {{ conversation.buyer_user_id }}
                </div>
                <UBadge
                  v-if="isConversationUnread(conversation)"
                  color="blue"
                  variant="subtle"
                  size="xs"
                >
                  Unread
                </UBadge>
              </div>
            </button>
          </div>
        </aside>

        <section class="flex min-h-[70vh] flex-col">
          <div
            v-if="!selectedConversationResolved"
            class="grid flex-1 place-content-center px-6 text-center text-sm text-zinc-500"
          >
            Select a conversation to read and reply.
          </div>

          <template v-else>
            <div class="border-b border-zinc-200 px-6 py-4">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="text-lg font-semibold text-zinc-900">
                    {{ selectedConversationResolved.product?.title || 'General inquiry' }}
                  </div>
                  <div class="text-sm text-zinc-500">
                    Buyer {{ selectedConversationResolved.buyer_user_id }}
                  </div>
                </div>

                <UButton
                  v-if="selectedConversationResolved.product?.slug"
                  color="gray"
                  variant="ghost"
                  @click="openProductPreview"
                >
                  Open product
                </UButton>
              </div>
            </div>

            <div
              ref="messageListEl"
              class="flex-1 space-y-4 overflow-y-auto bg-zinc-50 px-6 py-5"
            >
              <div
                v-if="isPendingMessages"
                class="grid h-full place-content-center text-sm text-zinc-500"
              >
                Loading messages...
              </div>

              <div
                v-else-if="messages.length === 0"
                class="grid h-full place-content-center text-sm text-zinc-500"
              >
                No messages yet.
              </div>

              <div
                v-for="message in messages"
                :key="message.id"
                class="flex"
                :class="isOwnMessage(message) ? 'justify-end' : 'justify-start'"
              >
                <div
                  class="max-w-[75%] rounded-2xl px-4 py-3 shadow-sm"
                  :class="isOwnMessage(message)
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white text-zinc-900'"
                >
                  <div class="whitespace-pre-wrap text-sm leading-6">
                    {{ message.body }}
                  </div>
                  <div
                    class="mt-2 text-right text-[11px]"
                    :class="isOwnMessage(message) ? 'text-zinc-300' : 'text-zinc-400'"
                  >
                    {{ formatMessageTime(message) }}
                  </div>
                </div>
              </div>
            </div>

            <form
              class="border-t border-zinc-200 bg-white px-6 py-4"
              @submit.prevent="handleSendMessage"
            >
              <div class="flex items-end gap-3">
                <UTextarea
                  v-model="messageDraft"
                  :rows="3"
                  autoresize
                  class="flex-1"
                  placeholder="Write your reply..."
                />
                <UButton
                  type="submit"
                  color="black"
                  :loading="isSendingMessage"
                  :disabled="!messageDraft.trim()"
                >
                  Send
                </UButton>
              </div>
            </form>
          </template>
        </section>
      </div>
    </template>
  </LayoutShopWrapperContent>
</template>
