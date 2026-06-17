import { useQueryClient } from '@tanstack/vue-query'
import {
  formatConversationTime,
  isConversationUnread,
  toThreadMessages,
} from './messages-page-content.helpers'
import { routes } from '~/shared/navigation/routes'
import type {
  ShopChatConversation,
  ShopChatMessage,
} from '~/shared/api/shop/chat/contracts/chat.contract'
import { createSellerChatEventsClient } from '~/shared/realtime/chat-events.client'
import { useGetMyShop } from '~/shared/server-state/shop/my-shop.query'
import { useShopMarkChatRead } from '~/shared/server-state/shop/chat/mark-read.mutation'
import { useShopChatMessages } from '~/shared/server-state/shop/chat/messages.query'
import { useShopSendChatMessage } from '~/shared/server-state/shop/chat/send-message.mutation'
import { useShopChatConversations } from '~/shared/server-state/shop/chat/conversations.query'

export function useMessagesPage(selectedConversationId: Ref<string | undefined>) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const config = useRuntimeConfig()

  const storefrontAppURL = computed(() => config.public.storefrontAppURL.replace(/\/+$/, ''))
  const chatEventsClient = import.meta.client
    ? createSellerChatEventsClient(queryClient)
    : null

  const conversationParams = computed(() => ({
    page: 1,
    limit: 50,
  }))

  const messageParams = computed(() => ({
    page: 1,
    limit: 100,
  }))

  const messageDraft = ref('')

  const { data: myShop } = useGetMyShop()
  const {
    data: conversationList,
    isPending: isPendingConversations,
  } = useShopChatConversations(conversationParams)
  const {
    data: messageList,
    isPending: isPendingMessages,
  } = useShopChatMessages(selectedConversationId, messageParams)
  const {
    mutateAsync: sendMessage,
    isPending: isSendingMessage,
  } = useShopSendChatMessage()
  const { mutate: markConversationRead } = useShopMarkChatRead()

  const conversations = computed<ShopChatConversation[]>(() => conversationList.value?.results ?? [])
  const messages = computed<ShopChatMessage[]>(() => messageList.value?.results ?? [])
  const shopOwnerUserId = computed(() => myShop.value?.owner_user_id)

  const selectedConversationResolved = computed<ShopChatConversation | null>(() => {
    return messageList.value?.conversation
      ?? conversations.value.find(conversation => conversation.id === selectedConversationId.value)
      ?? null
  })

  const selectedConversationUnread = computed(() => {
    const conversation = selectedConversationResolved.value

    return conversation
      ? isConversationUnread(conversation, shopOwnerUserId.value)
      : false
  })

  const threadMessages = computed(() => toThreadMessages(messages.value, shopOwnerUserId.value))

  watch(
    conversations,
    (nextConversations: ShopChatConversation[]) => {
      if (selectedConversationId.value) {
        return
      }

      const firstConversation = nextConversations[0]

      if (!firstConversation) {
        return
      }

      router.replace(routes.messages({ conversationId: firstConversation.id }))
    },
    { immediate: true },
  )

  watch(
    selectedConversationResolved,
    (conversation: ShopChatConversation | null) => {
      if (!conversation || !selectedConversationUnread.value) {
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
      selectedConversationId,
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
      if (selectedConversationId.value) {
        chatEventsClient?.unsubscribeConversation(selectedConversationId.value)
      }

      chatEventsClient?.stop()
    })
  }

  function selectConversation(conversation: ShopChatConversation) {
    router.push(routes.messages({ conversationId: conversation.id }))
  }

  function conversationTimeLabel(conversation: ShopChatConversation) {
    return formatConversationTime(conversation.last_message_at || conversation.created_at)
  }

  function openProductPreview() {
    const conversation = selectedConversationResolved.value
    const productSlug = conversation?.product?.slug

    if (!conversation || !productSlug) {
      return
    }

    navigateTo(
      `${storefrontAppURL.value}/${conversation.shop.slug}/${productSlug}`,
      {
        external: true,
        open: { target: '_blank' },
      },
    )
  }

  async function handleSendMessage() {
    const conversationId = selectedConversationId.value
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

  return {
    conversationList,
    conversations,
    conversationTimeLabel,
    handleSendMessage,
    isConversationUnread: (conversation: ShopChatConversation) =>
      isConversationUnread(conversation, shopOwnerUserId.value),
    isPendingConversations,
    isPendingMessages,
    isSendingMessage,
    messageDraft,
    messages,
    openProductPreview,
    selectConversation,
    selectedConversationResolved,
    threadMessages,
  }
}
