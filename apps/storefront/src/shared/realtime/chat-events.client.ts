import type { QueryClient } from '@tanstack/vue-query';
import {
  createChatEventsClient,
  type ChatMessageCreatedRealtimeEvent
} from '@arc/lib';
import type {
  MyChatConversation,
  MyChatMessage
} from '~/shared/api/me/chat/contracts/chat.contract';

function buildChatSocketUrl(): string {
  const config = useRuntimeConfig();
  return `${config.public.apiBaseURL.replace(/\/+$/, '')}/ws`;
}

function createRealtimeChatMessage(
  payload: ChatMessageCreatedRealtimeEvent
): MyChatMessage {
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

function isConversationUnread(conversation: MyChatConversation): boolean {
  return conversation.last_message_sender_user_id !== null &&
    conversation.last_message_sender_user_id === conversation.shop.owner_user_id &&
    (
      !conversation.buyer_last_read_at ||
      (
        !!conversation.last_message_at &&
        conversation.buyer_last_read_at < conversation.last_message_at
      )
    );
}

export function createStorefrontChatEventsClient(queryClient: QueryClient) {
  return createChatEventsClient<MyChatConversation, MyChatMessage>({
    stateKey: 'storefront-chat',
    socketUrl: buildChatSocketUrl(),
    queryClient,
    conversationQueryKey: 'my-chat-conversations',
    unreadCountQueryKey: 'my-chat-unread-count',
    messageQueryKey: 'my-chat-messages',
    createMessage: createRealtimeChatMessage,
    isConversationUnread,
  });
}
