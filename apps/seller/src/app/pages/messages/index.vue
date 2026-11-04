<script lang="ts" setup>
import MessagesInbox from './_components/messages-inbox/messages-inbox.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const route = useRoute()

const selectedConversationId = computed(() => {
  const value = route.query.conversation_id
  return typeof value === 'string' ? value : undefined
})

const activeTab = computed<'all' | 'unread'>(() =>
  route.query.tab === 'unread' ? 'unread' : 'all',
)
</script>

<template>
  <LayoutShopWrapperContent content-class="min-h-0">
    <template #title>
      Messages
    </template>
    <template #description>
      Respond to buyer conversations and keep support requests moving.
    </template>
    <template #content>
      <MessagesInbox
        :selected-conversation-id="selectedConversationId"
        :active-tab="activeTab"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
