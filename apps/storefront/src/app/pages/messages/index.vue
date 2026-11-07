<script lang="ts" setup>
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import type { AppTabsItem } from '@arc/ui/patterns/app-tabs/app-tabs.vue'
import AppTabs from '@arc/ui/patterns/app-tabs/app-tabs.vue'
import type { MyChatConversation } from '~/domains/me/api/chat/contracts/chat.contract'
import ChatConversationPanel from '~/domains/me/ui/chat/chat-conversation-panel.vue'
import {
  getConversationBuyerUnreadLabel,
  getConversationLatestMessagePreview,
  getConversationShopInitial,
  getConversationShopName,
  getConversationTimeLabel,
} from '~/domains/me/ui/chat/storefront-chat-conversation.helpers'
import { routes } from '~/shared/navigation/routes'
import { createStorefrontChatEventsClient } from '~/domains/me/realtime/chat-events.client'
import {
  useMyChatConversations,
  useMyChatUnreadCount,
} from '~/domains/me/queries/chat/conversations.query'

type MessagesTab = 'all' | 'unread'

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

const activeTab = computed<MessagesTab>(() => (
  route.query.tab === 'unread' ? 'unread' : 'all'
))

const state = reactive({
  q: typeof route.query.q === 'string' ? route.query.q : '',
})

const search = toRef(state, 'q')
const debouncedSearch = refDebounced(search, 400, { maxWait: 800 })

const activeSearch = computed(() => {
  const value = route.query.q
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
})

const { data: unreadCount } = useMyChatUnreadCount()

const messageTabItems = computed<AppTabsItem[]>(() => {
  const count = unreadCount.value?.unread_count

  return [
    { label: 'All', value: 'all' },
    {
      label: 'Unread',
      value: 'unread',
      // A zero count carries no signal; AppTabs drops zero badges.
      badge: count,
    },
  ]
})

const conversationParams = computed(() => ({
  page: 1,
  limit: 50,
  ...(activeTab.value === 'unread' ? { unread: true } : {}),
  ...(activeSearch.value ? { q: activeSearch.value } : {}),
}))

const {
  data: conversationList,
  isPending: isPendingConversations,
} = useMyChatConversations(conversationParams)

const conversations = computed<MyChatConversation[]>(() => conversationList.value?.results ?? [])

const emptyText = computed(() => {
  if (activeSearch.value) {
    return 'No conversations match your search.'
  }

  return activeTab.value === 'unread' ? 'No unread conversations.' : 'No conversations yet.'
})

const selectedConversation = computed<MyChatConversation | null>(() => {
  return conversations.value.find((conversation: MyChatConversation) => conversation.id === selectedConversationId.value)
    ?? null
})

/** `lg` breakpoint: below it the inbox shows one pane at a time instead of list + thread side by side. */
const isDesktop = useMediaQuery('(min-width: 1024px)')

const conversationListPanelClass = computed(() => [
  'min-h-0 flex-col border-b border-border-subtle lg:border-b-0 lg:border-r',
  // Mobile/tablet: the list yields to the open thread. Desktop keeps both panes visible.
  selectedConversationId.value ? 'hidden lg:flex' : 'flex',
].join(' '))

const conversationPanelClass = computed(() => (
  selectedConversationId.value ? '' : 'hidden lg:flex'
))

function syncQuery(
  nextQuery: { conversationId?: string, tab?: 'unread', q?: string },
  history: 'push' | 'replace' = 'replace',
) {
  const targetQuery = {
    ...(nextQuery.conversationId ? { conversation_id: nextQuery.conversationId } : {}),
    ...(nextQuery.tab ? { tab: nextQuery.tab } : {}),
    ...(nextQuery.q ? { q: nextQuery.q } : {}),
  }
  const currentQuery = {
    ...(selectedConversationId.value ? { conversation_id: selectedConversationId.value } : {}),
    ...(activeTab.value === 'unread' ? { tab: 'unread' } : {}),
    ...(activeSearch.value ? { q: activeSearch.value } : {}),
  }

  if (JSON.stringify(targetQuery) === JSON.stringify(currentQuery)) {
    return
  }

  const target = routes.messages(nextQuery)

  if (history === 'push') {
    router.push(target)

    return
  }

  router.replace(target)
}

function handleTabChange(value: string | number) {
  syncQuery({
    conversationId: selectedConversationId.value,
    tab: value === 'unread' ? 'unread' : undefined,
    q: activeSearch.value,
  })
}

watch(
  [conversations, isDesktop],
  ([nextConversations, desktop]: [MyChatConversation[], boolean]) => {
    // Mobile/tablet starts on the list, so the first thread is auto-opened on desktop only.
    if (!desktop || selectedConversationId.value) {
      return
    }

    const firstConversation = nextConversations[0]

    if (!firstConversation) {
      return
    }

    router.replace(routes.messages({
      conversationId: firstConversation.id,
      tab: activeTab.value === 'unread' ? 'unread' : undefined,
      q: activeSearch.value,
    }))
  },
  { immediate: true },
)

function selectConversation(conversation: MyChatConversation) {
  syncQuery({
    conversationId: conversation.id,
    tab: activeTab.value === 'unread' ? 'unread' : undefined,
    q: activeSearch.value,
  }, 'push')
}

function closeConversation() {
  syncQuery({
    tab: activeTab.value === 'unread' ? 'unread' : undefined,
    q: activeSearch.value,
  }, 'push')
}

watch(() => route.query.q, (q) => {
  state.q = typeof q === 'string' ? q : ''
})

watch(debouncedSearch, (value) => {
  syncQuery({
    conversationId: selectedConversationId.value,
    tab: activeTab.value === 'unread' ? 'unread' : undefined,
    q: value.trim() || undefined,
  })
})

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
  <div class="mx-auto mt-8 max-w-home-layout px-4 md:px-12 lg:px-16">
    <div class="mb-8">
      <SectionHeader
        title="Messages"
        description="Talk directly with sellers about products and orders."
        heading-class="text-2xl font-semibold text-text-strong md:text-3xl"
      />
    </div>

    <ConversationInboxShell container-class="grid h-[calc(100dvh-18rem)] min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
      <ConversationListPanel
        :loading="isPendingConversations"
        :empty="conversations.length === 0"
        :empty-text="emptyText"
        :aside-class="conversationListPanelClass"
        list-class="scrollbar-subtle min-h-0 flex-1 overflow-y-auto"
      >
        <template #toolbar>
          <div class="px-5 pb-3 pt-4">
            <UInput
              v-model="state.q"
              :icon="ICON_NAME_BY_ALIAS['searchSolid']"
              placeholder="Search shops"
              size="lg"
              class="w-full"
            />
          </div>

          <AppTabs
            variant="link"
            size="md"
            stretch
            aria-label="Message filters"
            :items="messageTabItems"
            :model-value="activeTab"
            @change="handleTabChange"
          />
        </template>

        <button
          v-for="conversation in conversations"
          :key="conversation.id"
          type="button"
          class="flex w-full flex-col gap-2 border-b border-border-subtle px-5 py-4 text-left transition hover:bg-surface-muted"
          :class="selectedConversationId === conversation.id ? 'bg-surface-muted' : ''"
          @click="selectConversation(conversation)"
        >
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-control text-sm font-semibold text-text-strong">
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
        :class="conversationPanelClass"
        show-back-button
        @back="closeConversation"
      />
    </ConversationInboxShell>
  </div>
</template>
