import type { QueryClient } from '@tanstack/vue-query'

export type ChatMessageCreatedRealtimeEvent = {
  event_type: 'chat.message.created'
  conversation_id: string
  shop_id: string | null
  message: {
    id: string
    body: string
    sender_user_id: string
    occurred_at: string
    metadata: Record<string, unknown> | null
  }
}

export type BaseChatConversation = {
  id: string
  last_message_at: string | null
  last_message_sender_user_id: string | null
  buyer_last_read_at: string | null
  seller_last_read_at: string | null
  updated_at: string
}

export type BaseChatMessage = {
  id: string
  conversation_id: string
  sender_user_id: string
  body: string
  message_type: string
  metadata: Record<string, unknown> | null
  edited_at: string | null
  created_at: string
  updated_at: string
}

export type CreateChatEventsClientOptions<
  TConversation extends BaseChatConversation,
  TMessage extends BaseChatMessage,
> = {
  stateKey: string
  socketUrl: string
  queryClient: QueryClient
  conversationQueryKey: string
  unreadCountQueryKey: string
  messageQueryKey: string
  createMessage: (payload: ChatMessageCreatedRealtimeEvent) => TMessage
  isConversationUnread: (conversation: TConversation) => boolean
}

export type ChatEventsClient = {
  start: () => void
  stop: () => void
  subscribeConversation: (conversationId: string) => void
  unsubscribeConversation: (conversationId: string) => void
}

export type ChatEventsHandler = (
  payload: ChatMessageCreatedRealtimeEvent
) => void | Promise<void>
