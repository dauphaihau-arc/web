import {
  formatChatConversationTime,
  formatChatMessageTime,
  formatChatUnreadCountLabel,
  getChatLatestMessagePreview,
  isChatConversationUnread,
  shouldShowChatMessageTime
} from '@arc/lib';
import type {
  ShopChatConversation,
  ShopChatMessage
} from '~/domains/shop/api/chat/contracts/chat.contract';

export function isConversationUnread(
  conversation: ShopChatConversation,
  shopOwnerUserId?: string | null
) {
  if (!shopOwnerUserId) {
    return false;
  }

  return isChatConversationUnread({
    unreadCount: conversation.seller_unread_count,
    lastMessageSenderUserId: conversation.last_message_sender_user_id,
    lastMessageIsOwn: conversation.last_message_sender_user_id === shopOwnerUserId,
    lastReadAt: conversation.seller_last_read_at,
    lastMessageAt: conversation.last_message_at,
  });
}

export function formatConversationTime(value?: string | null) {
  return formatChatConversationTime(value);
}

export function formatMessageTime(message: ShopChatMessage) {
  return formatChatMessageTime(message.created_at);
}

export function shouldShowMessageTime(
  message: ShopChatMessage,
  index: number,
  messages: ShopChatMessage[]
) {
  return shouldShowChatMessageTime(message, index, messages);
}

export function toThreadMessages(
  messages: ShopChatMessage[],
  shopOwnerUserId?: string | null,
  toProductReferenceDisplay?: (message: ShopChatMessage) => {
    title: string
    imageUrl?: string
    priceLabel?: string
    statusLabel?: string
    href?: string
    external?: boolean
  } | undefined
) {
  return messages.map((message, index) => ({
    id: message.id,
    body: message.body,
    createdAtLabel: formatMessageTime(message),
    showCreatedAt: shouldShowMessageTime(message, index, messages),
    isOwn: message.sender_user_id === shopOwnerUserId,
    productReference: toProductReferenceDisplay?.(message),
  }));
}

export function getConversationBuyerName(conversation: ShopChatConversation) {
  return conversation.buyer.display_name?.trim() || 'Buyer';
}

export function getConversationBuyerInitial(conversation: ShopChatConversation) {
  return getConversationBuyerName(conversation).charAt(0).toUpperCase() || 'B';
}

export function getConversationLatestMessagePreview(conversation: ShopChatConversation) {
  return getChatLatestMessagePreview(conversation.last_message);
}

export function getConversationSellerUnreadLabel(conversation: ShopChatConversation) {
  return formatChatUnreadCountLabel(conversation.seller_unread_count);
}
