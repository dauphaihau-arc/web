<script lang="ts" setup>
import dayjs from 'dayjs'
import ChatThreadPanel from '@arc/ui/chat-thread-panel.vue'
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

const threadMessages = computed(() => messages.value.map(message => ({
  id: message.id,
  body: message.body,
  createdAtLabel: formatMessageTime(message),
  isOwn: isOwnMessage(message),
})))

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
  <ChatThreadPanel
    :has-conversation="!!conversationId && !!selectedConversation"
    :loading="isPendingMessages"
    :empty="messages.length === 0"
    :empty-state-text="emptyStateText"
    :messages="threadMessages"
    :model-value="messageDraft"
    :sending="isSendingMessage"
    @update:model-value="messageDraft = $event"
    @send="handleSendMessage"
  />
</template>
