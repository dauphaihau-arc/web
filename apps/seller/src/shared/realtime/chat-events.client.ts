import type { QueryClient } from '@tanstack/vue-query';
import {
  createChatEventsClient,
  type ChatMessageCreatedRealtimeEvent
} from '@arc/lib';
import type {
  ShopChatConversation,
  ShopChatMessage
} from '~/shared/api/shop/chat/contracts/chat.contract';

function buildChatSocketUrl(): string {
  const config = useRuntimeConfig();
  return `${config.public.apiBaseURL.replace(/\/+$/, '')}/ws`;
}

function createRealtimeChatMessage(
  payload: ChatMessageCreatedRealtimeEvent
): ShopChatMessage {
  return {
    id: payload.message.id,
    conversation_id: payload.conversation_id,
    sender_user_id: payload.message.sender_user_id,
    body: payload.message.body,
    message_type: 'text',
    metadata: payload.message.metadata,
    edited_at: null,
    created_at: payload.message.occurred_at,
    updated_at: payload.message.occurred_at,
  };
}

function isConversationUnread(conversation: ShopChatConversation): boolean {
  return conversation.last_message_sender_user_id !== null &&
    conversation.last_message_sender_user_id !== conversation.shop.owner_user_id &&
    (
      !conversation.seller_last_read_at ||
      (
        !!conversation.last_message_at &&
        conversation.seller_last_read_at < conversation.last_message_at
      )
    );
}

export function createSellerChatEventsClient(queryClient: QueryClient) {
  return createChatEventsClient<ShopChatConversation, ShopChatMessage>({
    stateKey: 'seller-chat',
    socketUrl: buildChatSocketUrl(),
    queryClient,
    conversationQueryKey: 'shop-chat-conversations',
    unreadCountQueryKey: 'shop-chat-unread-count',
    messageQueryKey: 'shop-chat-messages',
    createMessage: createRealtimeChatMessage,
    isConversationUnread,
  });
}
