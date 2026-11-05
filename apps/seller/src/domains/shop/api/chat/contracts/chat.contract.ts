import type { components, paths } from '@arc/schemas/api/generated/openapi';

export type ShopChatConversation = components['schemas']['ChatConversationResponseDto'];
export type ShopChatMessage = components['schemas']['ChatMessageResponseDto'];

export type ListShopChatConversationsRequest =
  paths['/v1/shops/{shop_id}/chat/conversations']['get']['parameters']['query'];
export type ListShopChatConversationsResponse =
  components['schemas']['ChatConversationListResponseDto'];

export type ListShopChatMessagesRequest =
  paths['/v1/shops/{shop_id}/chat/conversations/{conversation_id}/messages']['get']['parameters']['query'];
export type ListShopChatMessagesResponse = components['schemas']['ChatMessageListResponseDto'];

export type SendShopChatMessageRequest = components['schemas']['SendChatMessageDto'];
export type SendShopChatMessageResponse = components['schemas']['ChatMessageEnvelopeResponseDto'];

export type MarkShopChatConversationReadResponse =
  components['schemas']['ChatConversationEnvelopeResponseDto'];
export type ShopChatUnreadCountResponse = components['schemas']['ChatUnreadCountResponseDto'];
