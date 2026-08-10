<script lang="ts" setup>
import type { MyChatConversation } from '~/domains/me/api/chat/contracts/chat.contract'
import ChatConversationPanel from '~/app/components/chat/chat-conversation-panel.vue'
import {
  getConversationBuyerUnreadLabel,
  getConversationLatestMessagePreview,
  getConversationShopInitial,
  getConversationShopName,
  getConversationTimeLabel,
} from '~/app/components/chat/storefront-chat-conversation.helpers'
import { routes } from '~/shared/navigation/routes'
import { createStorefrontChatEventsClient } from '~/shared/realtime/chat-events.client'
import { useMyChatConversations } from '~/domains/me/queries/chat/conversations.query'

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
  <div class="min-w-0 flex-1">
    <div class="mb-8">
      <SectionHeader
        title="Messages"
        description="Talk directly with sellers about products and orders."
        heading-class="text-3xl font-semibold text-text-strong"
      />
    </div>

    <ConversationInboxShell container-class="grid h-[calc(100dvh-18rem)] min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
      <ConversationListPanel
        :total-results="conversationList?.total_results ?? 0"
        :loading="isPendingConversations"
        :empty="conversations.length === 0"
        empty-text="No conversations yet."
        aside-class="flex min-h-0 flex-col border-b border-border-subtle lg:border-b-0 lg:border-r"
        list-class="scrollbar-subtle min-h-0 flex-1 overflow-y-auto"
      >
        <button
          v-for="conversation in conversations"
          :key="conversation.id"
          type="button"
          class="flex w-full flex-col gap-2 border-b border-border-subtle px-5 py-4 text-left transition hover:bg-surface-muted"
          :class="selectedConversationId === conversation.id ? 'bg-surface-muted' : ''"
          @click="selectConversation(conversation)"
        >
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-customGray-200 text-sm font-semibold text-text-strong">
              {{ getConversationShopInitial(conversation) }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="truncate text-sm font-semibold text-text-strong">
                  {{ getConversationShopName(conversation) }}
                </div>
                <div class="shrink-0 text-xs text-text-muted">
                  {{ getConversationTimeLabel(conversation) }}
                </div>
              </div>

              <div class="mt-1 flex items-center justify-between gap-2">
                <div class="truncate text-xs text-text-muted">
                  {{ getConversationLatestMessagePreview(conversation) }}
                </div>
                <UBadge
                  v-if="conversation.buyer_unread_count > 0"
                  color="blue"
                  variant="subtle"
                  size="xs"
                >
                  {{ getConversationBuyerUnreadLabel(conversation) }}
                </UBadge>
              </div>
            </div>
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
