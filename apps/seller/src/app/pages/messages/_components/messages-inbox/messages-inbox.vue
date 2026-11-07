<script lang="ts" setup>
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import AppTabs from '@arc/ui/patterns/app-tabs/app-tabs.vue'
import ChatThreadPanel from '@arc/ui/shells/chat-thread-panel.vue'
import { useMessagesInbox } from './use-messages-inbox'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  selectedConversationId?: string
  activeTab?: 'all' | 'unread'
}>()

const route = useRoute()
const router = useRouter()

const selectedConversationId = toRef(props, 'selectedConversationId')

const activeTab = computed<'all' | 'unread'>(() =>
  props.activeTab === 'unread' ? 'unread' : 'all',
)

const searchInput = ref(typeof route.query.q === 'string' ? route.query.q : '')
const debouncedSearchInput = refDebounced(searchInput, 400, { maxWait: 800 })

const searchQuery = computed(() => {
  const value = route.query.q
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
})

const {
  conversations,
  conversationTimeLabel,
  fetchPreviousPage,
  getConversationBuyerInitial,
  getConversationBuyerName,
  getConversationLatestMessagePreview,
  getConversationSellerUnreadLabel,
  hasPreviousPage,
  handleSendMessage,
  isFetchingPreviousPage,
  isPendingConversations,
  isPendingMessages,
  isSendingMessage,
  messageDraft,
  messages,
  selectedConversationResolved,
  selectConversation,
  threadMessages,
  unreadCount,
} = useMessagesInbox(selectedConversationId, activeTab, searchQuery)

const tabs = computed(() => [
  { label: 'All', value: 'all' as const },
  {
    label: 'Unread',
    value: 'unread' as const,
    // A zero count carries no signal; AppTabs drops zero badges.
    badge: unreadCount.value ?? undefined,
  },
])

const emptyText = computed(() => {
  if (searchQuery.value) {
    return 'No conversations match your search.'
  }

  return activeTab.value === 'unread' ? 'No unread conversations.' : 'No buyer conversations yet.'
})

watch(() => route.query.q, (value) => {
  const nextSearch = typeof value === 'string' ? value : ''

  if (nextSearch !== searchInput.value) {
    searchInput.value = nextSearch
  }
})

watch(debouncedSearchInput, (value) => {
  const nextQuery = value.trim() || undefined

  if (nextQuery === searchQuery.value) {
    return
  }

  router.replace(routes.messages({
    conversationId: selectedConversationId.value,
    tab: activeTab.value === 'unread' ? 'unread' : undefined,
    q: nextQuery,
  }))
})

function handleTabChange(value: string | number) {
  const nextTab = value === 'unread' ? 'unread' : 'all'

  if (nextTab === activeTab.value) {
    return
  }

  router.replace(routes.messages({
    conversationId: selectedConversationId.value,
    tab: nextTab === 'unread' ? 'unread' : undefined,
    q: searchQuery.value,
  }))
}
</script>

<template>
  <ConversationInboxShell container-class="grid h-[calc(100dvh-11rem)] min-h-0 grid-cols-[360px_minmax(0,1fr)] overflow-hidden">
    <ConversationListPanel
      :loading="isPendingConversations"
      :empty="conversations.length === 0"
      :empty-text="emptyText"
      min-height-class="h-[60vh]"
      aside-class="flex min-h-0 flex-col border-r border-border-subtle"
      list-class="scrollbar-subtle min-h-0 flex-1 overflow-y-auto"
    >
      <template #toolbar>
        <div class="px-5 pb-3 pt-4">
          <UInput
            v-model="searchInput"
            :icon="ICON_NAME_BY_ALIAS['searchSolid']"
            size="lg"
            placeholder="Search buyers"
            class="w-full"
          />
        </div>
        <AppTabs
          variant="link"
          size="md"
          stretch
          aria-label="Message filters"
          :items="tabs"
          :model-value="activeTab"
          @change="handleTabChange"
        />
      </template>

      <button
        v-for="conversation in conversations"
        :key="conversation.id"
        type="button"
        class="flex w-full flex-col gap-2 border-b border-border-subtle px-5 py-4 text-left transition hover:bg-surface-hover"
        :class="[
          selectedConversationId === conversation.id ? 'bg-surface-muted' : '',
        ]"
        @click="selectConversation(conversation)"
      >
        <div class="flex items-start gap-3">
          <img
            v-if="conversation.buyer.avatar"
            :src="conversation.buyer.avatar"
            :alt="getConversationBuyerName(conversation)"
            class="size-10 shrink-0 rounded-full object-cover"
          />
          <div
            v-else
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-control text-sm font-semibold text-text-strong"
          >
            {{ getConversationBuyerInitial(conversation) }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="truncate text-sm font-semibold text-text-strong">
                {{ getConversationBuyerName(conversation) }}
              </div>
              <div class="shrink-0 text-xs text-text-muted">
                {{ conversationTimeLabel(conversation) }}
              </div>
            </div>

            <div class="mt-1 flex items-center justify-between gap-2">
              <div class="truncate text-xs text-text-muted">
                {{ getConversationLatestMessagePreview(conversation) }}
              </div>
              <UBadge
                v-if="conversation.seller_unread_count > 0"
                variant="subtle"
                size="xs"
                class="flex size-4 shrink-0 items-center justify-center rounded p-0 text-[10px] leading-none"
              >
                {{ getConversationSellerUnreadLabel(conversation) }}
              </UBadge>
            </div>
          </div>
        </div>
      </button>
    </ConversationListPanel>

    <ChatThreadPanel
      :has-conversation="!!selectedConversationResolved"
      :loading="isPendingMessages"
      :empty="messages.length === 0"
      empty-state-text="Select a conversation to read and reply."
      empty-messages-text="No messages yet."
      :messages="threadMessages"
      :model-value="messageDraft"
      :sending="isSendingMessage"
      :has-older-messages="hasPreviousPage"
      :loading-older-messages="isFetchingPreviousPage"
      list-class="scrollbar-subtle min-h-0 flex-1 space-y-4 overflow-y-auto bg-surface px-6 pt-5 pb-40"
      composer-class="px-6 py-4"
      section-class="flex h-full min-h-0 flex-col"
      @update:model-value="messageDraft = $event"
      @load-older-messages="fetchPreviousPage"
      @send="handleSendMessage"
    >
      <template
        v-if="selectedConversationResolved"
        #header
      >
        <div class="flex min-h-[88px] shrink-0 items-center border-b border-border-subtle px-6 py-4">
          <div class="flex w-full items-start justify-between gap-4">
            <div class="flex min-w-0 items-center gap-3">
              <img
                v-if="selectedConversationResolved.buyer.avatar"
                :src="selectedConversationResolved.buyer.avatar"
                :alt="getConversationBuyerName(selectedConversationResolved)"
                class="size-11 shrink-0 rounded-full object-cover"
              />
              <div
                v-else
                class="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-control text-base font-semibold text-text-strong"
              >
                {{ getConversationBuyerInitial(selectedConversationResolved) }}
              </div>

              <div class="min-w-0">
                <div class="truncate text-lg font-semibold text-text-strong">
                  {{ getConversationBuyerName(selectedConversationResolved) }}
                </div>
                <div class="truncate text-sm text-text-muted">
                  Conversation
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ChatThreadPanel>
  </ConversationInboxShell>
</template>
