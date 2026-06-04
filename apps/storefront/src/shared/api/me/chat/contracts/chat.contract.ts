export type MyChatConversation = {
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
}

export type MyChatMessage = {
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

export type CreateMyChatConversationRequest = {
  shop_id: string
  product_id?: string
}

export type ListMyChatConversationsRequest = {
  page?: number
  limit?: number
}

export type ListMyChatConversationsResponse = {
  results: MyChatConversation[]
  page: number
  limit: number
  total_pages: number
  total_results: number
}

export type ListMyChatMessagesRequest = {
  page?: number
  limit?: number
}

export type ListMyChatMessagesResponse = {
  conversation: MyChatConversation
  results: MyChatMessage[]
  page: number
  limit: number
  total_pages: number
  total_results: number
}

export type SendMyChatMessageRequest = {
  body: string
  metadata?: Record<string, unknown>
}

export type SendMyChatMessageResponse = {
  message: MyChatMessage
}

export type MarkMyChatConversationReadResponse = {
  conversation: MyChatConversation
}

export type MyChatUnreadCountResponse = {
  unread_count: number
}
