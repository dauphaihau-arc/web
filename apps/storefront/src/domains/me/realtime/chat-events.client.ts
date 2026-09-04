import type { QueryClient } from '@tanstack/vue-query';
import {
  createChatEventsClient,
  isChatConversationUnread,
  type ChatMessageCreatedRealtimeEvent,
} from '@arc/lib';
import type {
  MyChatConversation,
  MyChatMessage,
} from '~/domains/me/api/chat/contracts/chat.contract';

function buildChatSocketUrl(): string {
  const config = useRuntimeConfig();
  return `${config.public.apiBaseURL.replace(/\/+$/, '')}/ws`;
}

function createRealtimeChatMessage(
  payload: ChatMessageCreatedRealtimeEvent,
): MyChatMessage {
  return {
    id: payload.message.id,
    conversation_id: payload.conversation_id,
    sender_user_id: payload.message.sender_user_id,
    body: payload.message.body,
    message_type: payload.message.message_type ?? 'text',
    metadata: payload.message.metadata,
    edited_at: null,
    created_at: payload.message.occurred_at,
    updated_at: payload.message.occurred_at,
  };
}

function isConversationUnread(conversation: MyChatConversation): boolean {
  return isChatConversationUnread({
    unreadCount: conversation.buyer_unread_count,
    lastMessageSenderUserId: conversation.last_message_sender_user_id,
    lastMessageIsOwn: conversation.last_message_sender_user_id !== conversation.shop.owner_user_id,
    lastReadAt: conversation.buyer_last_read_at,
    lastMessageAt: conversation.last_message_at,
  });
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
