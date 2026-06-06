<script lang="ts" setup>
import dayjs from 'dayjs'
import type { MyChatConversation } from '~/shared/api/me/chat/contracts/chat.contract'
import ChatConversationPanel from '~/app/components/chat/chat-conversation-panel.vue'
import { routes } from '~/shared/navigation/routes'
import { createStorefrontChatEventsClient } from '~/shared/realtime/chat-events.client'
import {
  useMyChatConversations,
  useMyChatUnreadCount,
} from '~/shared/server-state/me/chat/conversations.query'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const chatEventsClient = import.meta.client
  ? createStorefrontChatEventsClient(queryClient)
  : null
const selectedConversationId = computed(() => {
  const value = route.query.conversation_id
  return typeof value === 'string' ? value : undefined
})

const conversationParams = computed(() => ({
  page: 1,
  limit: 50,
}))

const { data: unreadCount } = useMyChatUnreadCount()
const {
  data: conversationList,
  isPending: isPendingConversations,
} = useMyChatConversations(conversationParams)

const conversations = computed<MyChatConversation[]>(() => conversationList.value?.results ?? [])
const selectedConversation = computed<MyChatConversation | null>(() => {
  return conversations.value.find((conversation: MyChatConversation) => conversation.id === selectedConversationId.value)
    ?? null
})

watch(
  conversations,
  (nextConversations: MyChatConversation[]) => {
    if (selectedConversationId.value) {
      return
    }

    const firstConversation = nextConversations[0]

    if (!firstConversation) {
      return
    }

    router.replace(routes.accountMessages({ conversationId: firstConversation.id }))
  },
  { immediate: true },
)

function selectConversation(conversation: MyChatConversation) {
  router.push(routes.accountMessages({ conversationId: conversation.id }))
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

function formatConversationTime(value?: string | null) {
  if (!value) {
    return ''
  }

  return dayjs(value).format('MMM D, HH:mm')
}

if (import.meta.client) {
  onMounted(() => {
    chatEventsClient?.start()
  })

  onBeforeUnmount(() => {
    chatEventsClient?.stop()
  })
}
</script>

<template>
  <div class="">
    <div class="mb-8">
      <SectionHeader
        title="Messages"
        description="Talk directly with sellers about products and orders."
        heading-class="text-3xl font-semibold text-text-strong"
      >
        <template #badge>
          <div class="rounded-full border border-border-subtle bg-surface-muted px-3 py-1 text-sm text-text-subtle">
            Unread: {{ unreadCount?.unread_count ?? 0 }}
          </div>
        </template>
      </SectionHeader>
    </div>

    <ConversationInboxShell>
      <ConversationListPanel
        :total-results="conversationList?.total_results ?? 0"
        :loading="isPendingConversations"
        :empty="conversations.length === 0"
        empty-text="No conversations yet."
      >
        <button
          v-for="conversation in conversations"
          :key="conversation.id"
          type="button"
          class="flex w-full flex-col gap-2 border-b border-border-subtle px-5 py-4 text-left transition hover:bg-surface-muted"
          :class="selectedConversationId === conversation.id ? 'bg-surface-muted' : ''"
          @click="selectConversation(conversation)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="truncate text-sm font-semibold text-text-strong">
                {{ conversation.product?.title || conversation.shop.shop_name }}
              </div>
              <div class="truncate text-xs text-text-muted">
                {{ conversation.shop.shop_name }}
              </div>
            </div>
            <div class="shrink-0 text-xs text-text-muted">
              {{ formatConversationTime(conversation.last_message_at || conversation.created_at) }}
            </div>
          </div>

          <div class="flex items-center justify-between gap-2">
            <div class="truncate text-xs text-text-muted">
              {{ conversation.product?.slug || conversation.shop.slug }}
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
      </ConversationListPanel>

      <ChatConversationPanel
        :conversation-id="selectedConversationId"
        :initial-conversation="selectedConversation"
      />
    </ConversationInboxShell>
  </div>
</template>
