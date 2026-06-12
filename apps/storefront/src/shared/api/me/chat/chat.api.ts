import type {
  CreateMyChatConversationRequest,
  ListMyChatConversationsRequest,
  ListMyChatConversationsResponse,
  ListMyChatMessagesRequest,
  ListMyChatMessagesResponse,
  MarkMyChatConversationReadResponse,
  MyChatConversation,
  MyChatUnreadCountResponse,
  SendMyChatMessageRequest,
  SendMyChatMessageResponse
} from './contracts/chat.contract';
import { apiClient } from '~/shared/lib/api-client';

export const meChatApi = {
  createOrGetConversation(payload: CreateMyChatConversationRequest) {
    return apiClient.post<MyChatConversation>(
      '/me/chat/conversations',
      payload
    );
  },

  listConversations(query?: ListMyChatConversationsRequest) {
    return apiClient.get<ListMyChatConversationsResponse>(
      '/me/chat/conversations',
      query
    );
  },

  unreadCount() {
    return apiClient.get<MyChatUnreadCountResponse>(
      '/me/chat/conversations/unread-count'
    );
  },

  listMessages(
    conversationId: string,
    query?: ListMyChatMessagesRequest
  ) {
    return apiClient.get<ListMyChatMessagesResponse>(
      `/me/chat/conversations/${conversationId}/messages`,
      query
    );
  },

  sendMessage(
    conversationId: string,
    payload: SendMyChatMessageRequest
  ) {
    return apiClient.post<SendMyChatMessageResponse>(
      `/me/chat/conversations/${conversationId}/messages`,
      payload
    );
  },

  markRead(conversationId: string) {
    return apiClient.patch<MarkMyChatConversationReadResponse>(
      `/me/chat/conversations/${conversationId}/read`,
      {}
    );
  },
};
