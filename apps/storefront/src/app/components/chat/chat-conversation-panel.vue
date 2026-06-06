<script lang="ts" setup>
import dayjs from 'dayjs'
import ConversationThreadPanel from '@arc/ui/conversation-thread-panel.vue'
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
  emptyStateText?: string
}>(), {
  initialConversation: null,
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
  <ConversationThreadPanel
    :has-conversation="!!conversationId && !!selectedConversation"
    :loading="isPendingMessages"
    :empty="messages.length === 0"
    :empty-state-text="emptyStateText"
  >
    <template #default>
      <div
        ref="messageListEl"
        class="contents"
      />

      <div
        v-for="message in messages"
        :key="message.id"
        class="flex"
        :class="isOwnMessage(message) ? 'justify-end' : 'justify-start'"
      >
        <div class="max-w-[75%]">
          <div
            class="rounded-xl px-3 py-2 shadow-sm"
            :class="isOwnMessage(message)
              ? 'bg-text-strong text-surface'
              : 'bg-surface text-text-strong'"
          >
            <div class="whitespace-pre-wrap text-sm leading-6">
              {{ message.body }}
            </div>
          </div>
          <div
            class="mt-1 text-[11px]"
            :class="[
              isOwnMessage(message) ? 'text-right text-text-muted' : 'text-left text-text-muted',
            ]"
          >
            {{ formatMessageTime(message) }}
          </div>
        </div>
      </div>
    </template>

    <template #composer>
      <form @submit.prevent="handleSendMessage">
        <div class="relative">
          <UTextarea
            v-model="messageDraft"
            :rows="3"
            autoresize
            class="w-full"
            placeholder="Write your message..."
            :ui="{
              base: 'min-h-32 resize-none rounded-[10px] bg-surface px-8 py-6 !pr-12 text-lg leading-8 text-text-strong shadow-none placeholder:text-text-muted focus:ring-0',
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
  </ConversationThreadPanel>
</template>
