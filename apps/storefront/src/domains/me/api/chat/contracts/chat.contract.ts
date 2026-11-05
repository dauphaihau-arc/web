import type { components, paths } from '@arc/schemas/api/generated/openapi';

export type MyChatConversation = components['schemas']['ChatConversationResponseDto'];
export type MyChatMessage = components['schemas']['ChatMessageResponseDto'];

export type CreateMyChatConversationRequest = components['schemas']['CreateChatConversationDto'];

export type ListMyChatConversationsRequest =
  paths['/v1/me/chat/conversations']['get']['parameters']['query'];
export type ListMyChatConversationsResponse = components['schemas']['ChatConversationListResponseDto'];

export type ListMyChatMessagesRequest =
  paths['/v1/me/chat/conversations/{conversation_id}/messages']['get']['parameters']['query'];
export type ListMyChatMessagesResponse = components['schemas']['ChatMessageListResponseDto'];

export type SendMyChatMessageRequest = components['schemas']['SendChatMessageDto'];
export type SendMyChatMessageResponse = components['schemas']['ChatMessageEnvelopeResponseDto'];

export type MarkMyChatConversationReadResponse =
  components['schemas']['ChatConversationEnvelopeResponseDto'];
export type MyChatUnreadCountResponse = components['schemas']['ChatUnreadCountResponseDto'];
