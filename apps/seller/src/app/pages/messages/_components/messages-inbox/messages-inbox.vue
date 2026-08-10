<script lang="ts" setup>
import ChatThreadPanel from '@arc/ui/shells/chat-thread-panel.vue'
import { useMessagesInbox } from './use-messages-inbox'

const props = defineProps<{
  selectedConversationId?: string
}>()

const selectedConversationId = toRef(props, 'selectedConversationId')

const {
  conversationList,
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
} = useMessagesInbox(selectedConversationId)
</script>

<template>
  <ConversationInboxShell container-class="grid h-[calc(100dvh-11rem)] min-h-0 grid-cols-[360px_minmax(0,1fr)] overflow-hidden">
    <ConversationListPanel
      :total-results="conversationList?.total_results ?? 0"
      :loading="isPendingConversations"
      :empty="conversations.length === 0"
      empty-text="No buyer conversations yet."
      min-height-class="h-[60vh]"
      aside-class="flex min-h-0 flex-col border-r border-border-subtle"
      header-class="flex min-h-[88px] flex-col justify-center border-b border-border-subtle px-5 py-4"
      list-class="scrollbar-subtle min-h-0 flex-1 overflow-y-auto"
    >
      <button
        v-for="conversation in conversations"
        :key="conversation.id"
        type="button"
        class="flex w-full flex-col gap-2 border-b border-border-subtle px-5 py-4 text-left transition hover:bg-surface-muted"
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
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-customGray-200 text-sm font-semibold text-text-strong"
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
      list-class="scrollbar-subtle min-h-0 flex-1 space-y-4 overflow-y-auto bg-surface-muted px-6 py-5"
      composer-class="shrink-0 bg-surface-muted px-6 pb-4"
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
                class="flex size-11 shrink-0 items-center justify-center rounded-full bg-customGray-200 text-base font-semibold text-text-strong"
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
