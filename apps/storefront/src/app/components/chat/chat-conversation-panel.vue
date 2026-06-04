<script lang="ts" setup>
import dayjs from 'dayjs'
import type {
  MyChatConversation,
  MyChatMessage,
} from '~/shared/api/me/chat/contracts/chat.contract'
import { createStorefrontChatEventsClient } from '~/shared/realtime/chat-events.client'
import { useMyMarkChatRead } from '~/shared/server-state/me/chat/mark-read.mutation'
import { useMyChatMessages } from '~/shared/server-state/me/chat/messages.query'
import { useMySendChatMessage } from '~/shared/server-state/me/chat/send-message.mutation'

const props = withDefaults(defineProps<{
  conversationId?: string
  initialConversation?: MyChatConversation | null
  showProductLink?: boolean
  emptyStateText?: string
}>(), {
  initialConversation: null,
  showProductLink: true,
  emptyStateText: 'Select a conversation to read and reply.',
})

const messageDraft = ref('')
const messageListEl = ref<HTMLElement | null>(null)
const queryClient = useQueryClient()

const chatEventsClient = import.meta.client
  ? createStorefrontChatEventsClient(queryClient)
  : null

const messageParams = computed(() => ({
  page: 1,
  limit: 100,
}))

const {
  data: messageList,
  isPending: isPendingMessages,
} = useMyChatMessages(() => props.conversationId, messageParams)

const {
  mutateAsync: sendMessage,
  isPending: isSendingMessage,
} = useMySendChatMessage()
const { mutate: markConversationRead } = useMyMarkChatRead()

const messages = computed<MyChatMessage[]>(() => messageList.value?.results ?? [])

const selectedConversation = computed<MyChatConversation | null>(() => {
  return messageList.value?.conversation ?? props.initialConversation ?? null
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

function isConversationUnread(conversation: MyChatConversation) {
  return conversation.last_message_sender_user_id !== null
    && conversation.last_message_sender_user_id === conversation.shop.owner_user_id
    && (
      !conversation.buyer_last_read_at
      || (
        !!conversation.last_message_at
        && conversation.buyer_last_read_at < conversation.last_message_at
      )
    )
}

function formatMessageTime(message: MyChatMessage) {
  return dayjs(message.created_at).format('HH:mm')
}

function isOwnMessage(message: MyChatMessage) {
  return selectedConversation.value !== null
    && message.sender_user_id !== selectedConversation.value.shop.owner_user_id
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
  <section class="flex h-full min-h-0 flex-1 flex-col">
    <div
      v-if="!conversationId || !selectedConversation"
      class="grid flex-1 place-content-center px-6 text-center text-sm text-zinc-500"
    >
      {{ emptyStateText }}
    </div>

    <template v-else>
      <!-- <div class="border-b border-zinc-200 px-6 py-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-lg font-semibold text-zinc-900">
              {{ selectedConversation.product?.title || selectedConversation.shop.shop_name }}
            </div>
            <div class="text-sm text-zinc-500">
              Seller: {{ selectedConversation.shop.shop_name }}
            </div>
          </div>

          <UButton
            v-if="showProductLink && selectedConversation.product?.slug"
            color="gray"
            variant="ghost"
            :to="routes.productDetail(selectedConversation.shop.slug, selectedConversation.product.slug)"
          >
            Open product
          </UButton>
        </div>
      </div> -->

      <div
        ref="messageListEl"
        class="min-h-0 flex-1 space-y-4 overflow-y-auto bg-zinc-50 px-6 py-5"
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
            class="max-w-[75%]"
          >
            <div
              class="rounded-xl px-3 py-2 shadow-sm"
              :class="isOwnMessage(message)
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-900'"
            >
              <div class="whitespace-pre-wrap text-sm leading-6">
                {{ message.body }}
              </div>
            </div>
            <div
              class="mt-1 text-[11px]"
              :class="[
                isOwnMessage(message) ? 'text-right text-zinc-400' : 'text-left text-zinc-500',
              ]"
            >
              {{ formatMessageTime(message) }}
            </div>
          </div>
        </div>
      </div>

      <form
        class="mt-auto shrink-0 bg-zinc-50 px-5 py-5"
        @submit.prevent="handleSendMessage"
      >
        <div class="relative">
          <UTextarea
            v-model="messageDraft"
            :rows="3"
            autoresize
            class="w-full"
            placeholder="Write your message..."
            :ui="{
              base: 'min-h-32 resize-none rounded-[10px] bg-white px-8 py-6 !pr-12 text-lg leading-8 text-zinc-900 shadow-none placeholder:text-zinc-400 focus:ring-0',
            }"
          />
          <UButton
            type="submit"
            icon="i-lucide-arrow-up"
            :loading="isSendingMessage"
            :disabled="!messageDraft.trim()"
            :ui="{ rounded: 'rounded-full' }"
            class="absolute bottom-3 right-3"
          />
        </div>
      </form>
    </template>
  </section>
</template>
