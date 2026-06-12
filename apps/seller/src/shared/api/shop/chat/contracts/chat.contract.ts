export type ShopChatConversation = {
  id: string
  buyer_user_id: string
  shop: {
    id: string
    owner_user_id: string
    shop_name: string
    slug: string
  }
  product: {
    id: string
    title?: string | null
    slug?: string | null
  } | null
  status: string
  last_message_at: string | null
  last_message_sender_user_id: string | null
  buyer_last_read_at: string | null
  seller_last_read_at: string | null
  created_at: string
  updated_at: string
};

export type ShopChatMessage = {
  id: string
  conversation_id: string
  sender_user_id: string
  body: string
  message_type: string
  metadata: Record<string, unknown> | null
  edited_at: string | null
  created_at: string
  updated_at: string
};

export type ListShopChatConversationsRequest = {
  page?: number
  limit?: number
};

export type ListShopChatConversationsResponse = {
  results: ShopChatConversation[]
  page: number
  limit: number
  total_pages: number
  total_results: number
};

export type ListShopChatMessagesRequest = {
  page?: number
  limit?: number
};

export type ListShopChatMessagesResponse = {
  conversation: ShopChatConversation
  results: ShopChatMessage[]
  page: number
  limit: number
  total_pages: number
  total_results: number
};

export type SendShopChatMessageRequest = {
  body: string
  metadata?: Record<string, unknown>
};

export type SendShopChatMessageResponse = {
  message: ShopChatMessage
};

export type MarkShopChatConversationReadResponse = {
  conversation: ShopChatConversation
};

export type ShopChatUnreadCountResponse = {
  unread_count: number
};
