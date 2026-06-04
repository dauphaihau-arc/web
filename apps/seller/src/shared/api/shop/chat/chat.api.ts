import type {
  ListShopChatConversationsRequest,
  ListShopChatConversationsResponse,
  ListShopChatMessagesRequest,
  ListShopChatMessagesResponse,
  MarkShopChatConversationReadResponse,
  SendShopChatMessageRequest,
  SendShopChatMessageResponse,
  ShopChatUnreadCountResponse,
} from './contracts/chat.contract'
import { apiClient } from '~/shared/lib/api-client'

export const shopChatApi = {
  listConversations(shopId: string, query?: ListShopChatConversationsRequest) {
    return apiClient.get<ListShopChatConversationsResponse>(
      `/shops/${shopId}/chat/conversations`,
      query,
    )
  },

  unreadCount(shopId: string) {
    return apiClient.get<ShopChatUnreadCountResponse>(
      `/shops/${shopId}/chat/conversations/unread-count`,
    )
  },

  listMessages(
    shopId: string,
    conversationId: string,
    query?: ListShopChatMessagesRequest,
  ) {
    return apiClient.get<ListShopChatMessagesResponse>(
      `/shops/${shopId}/chat/conversations/${conversationId}/messages`,
      query,
    )
  },

  sendMessage(
    shopId: string,
    conversationId: string,
    payload: SendShopChatMessageRequest,
  ) {
    return apiClient.post<SendShopChatMessageResponse>(
      `/shops/${shopId}/chat/conversations/${conversationId}/messages`,
      payload,
    )
  },

  markRead(shopId: string, conversationId: string) {
    return apiClient.patch<MarkShopChatConversationReadResponse>(
      `/shops/${shopId}/chat/conversations/${conversationId}/read`,
      {},
    )
  },
}
