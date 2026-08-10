import type { ChatProductReferenceMetadata } from '@arc/lib';

export type MyChatConversation = {
  id: string
  buyer_user_id: string
  buyer: {
    id: string
    display_name: string | null
    avatar: string | null
  }
  shop: {
    id: string
    owner_user_id: string
    shop_name: string
    slug: string
  }
  status: string
  last_message: {
    id: string
    body_preview: string
    sender_user_id: string
    message_type: string
    created_at: string
  } | null
  last_message_at: string | null
  last_message_sender_user_id: string | null
  buyer_last_read_at: string | null
  seller_last_read_at: string | null
  buyer_unread_count: number
  seller_unread_count: number
  created_at: string
  updated_at: string
};

export type MyChatMessage = {
  id: string
  conversation_id: string
  sender_user_id: string
  body: string
  message_type: string
  metadata: ChatProductReferenceMetadata | Record<string, unknown> | null
  edited_at: string | null
  created_at: string
  updated_at: string
};

export type CreateMyChatConversationRequest = {
  shop_id: string
  product_id?: string
};

export type ListMyChatConversationsRequest = {
  page?: number
  limit?: number
};

export type ListMyChatConversationsResponse = {
  results: MyChatConversation[]
  page: number
  limit: number
  total_pages: number
  total_results: number
};

export type ListMyChatMessagesRequest = {
  limit?: number
  before?: string
};

export type ListMyChatMessagesResponse = {
  conversation: MyChatConversation
  results: MyChatMessage[]
  limit: number
  page_info: {
    has_more_before: boolean
    before_cursor: string | null
  }
};

export type SendMyChatMessageRequest = {
  body: string
  metadata?: Record<string, unknown>
};

export type SendMyChatMessageResponse = {
  message: MyChatMessage
};

export type MarkMyChatConversationReadResponse = {
  conversation: MyChatConversation
};

export type MyChatUnreadCountResponse = {
  unread_count: number
};
