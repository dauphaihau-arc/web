<script lang="ts" setup>
import MessagesPageContent from './_components/messages-page-content/messages-page-content.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { useShopChatUnreadCount } from '~/shared/server-state/shop/chat/conversations.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const route = useRoute()
const { data: unreadCount } = useShopChatUnreadCount()

const selectedConversationId = computed(() => {
  const value = route.query.conversation_id
  return typeof value === 'string' ? value : undefined
})
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
      <div class="rounded-full bg-surface-muted px-3 py-1 text-sm text-text-subtle">
        Unread: {{ unreadCount?.unread_count ?? 0 }}
      </div>
    </template>
    <template #content>
      <MessagesPageContent :selected-conversation-id="selectedConversationId" />
    </template>
  </LayoutShopWrapperContent>
</template>
