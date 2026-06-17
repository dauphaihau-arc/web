<script lang="ts" setup>
import ChatThreadPanel from '@arc/ui/chat-thread-panel.vue'
import { useMessagesPage } from './use-messages-page'

const props = defineProps<{
  selectedConversationId?: string
}>()

const selectedConversationId = toRef(props, 'selectedConversationId')

const {
  conversationList,
  conversations,
  conversationTimeLabel,
  handleSendMessage,
  isConversationUnread,
  isPendingConversations,
  isPendingMessages,
  isSendingMessage,
  messageDraft,
  messages,
  openProductPreview,
  selectConversation,
  selectedConversationResolved,
  threadMessages,
} = useMessagesPage(selectedConversationId)
</script>

<template>
  <ConversationInboxShell container-class="grid min-h-[70vh] grid-cols-[360px_minmax(0,1fr)] overflow-hidden">
    <ConversationListPanel
      :total-results="conversationList?.total_results ?? 0"
      :loading="isPendingConversations"
      :empty="conversations.length === 0"
      empty-text="No buyer conversations yet."
      min-height-class="h-[60vh]"
      aside-class="border-r border-border-subtle"
      header-class="flex min-h-[88px] flex-col justify-center border-b border-border-subtle px-5 py-4"
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
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-text-strong">
              {{ conversation.product?.title || 'General inquiry' }}
            </div>
            <div class="truncate text-xs text-text-muted">
              {{ conversation.product?.slug || conversation.shop.slug }}
            </div>
          </div>
          <div class="shrink-0 text-xs text-text-muted">
            {{ conversationTimeLabel(conversation) }}
          </div>
        </div>

        <div class="flex items-center justify-between gap-2">
          <div class="truncate text-xs text-text-muted">
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
      list-class="flex-1 space-y-4 overflow-y-auto bg-surface-muted px-6 py-5"
      composer-class="bg-surface-muted px-6 py-4"
      section-class="flex min-h-[70vh] flex-col"
      @update:model-value="messageDraft = $event"
      @send="handleSendMessage"
    >
      <template
        v-if="selectedConversationResolved"
        #header
      >
        <div class="flex min-h-[88px] items-center border-b border-border-subtle px-6 py-4">
          <div class="flex w-full items-start justify-between gap-4">
            <div>
              <div class="text-lg font-semibold text-text-strong">
                {{ selectedConversationResolved.product?.title || 'General inquiry' }}
              </div>
              <div class="text-sm text-text-muted">
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
      </template>
    </ChatThreadPanel>
  </ConversationInboxShell>
</template>
