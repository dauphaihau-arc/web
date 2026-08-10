<script lang="ts" setup>
import MessagesPageContent from './_components/messages-page-content/messages-page-content.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const route = useRoute()

const selectedConversationId = computed(() => {
  const value = route.query.conversation_id
  return typeof value === 'string' ? value : undefined
})
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
      <MessagesPageContent :selected-conversation-id="selectedConversationId" />
    </template>
  </LayoutShopWrapperContent>
</template>
