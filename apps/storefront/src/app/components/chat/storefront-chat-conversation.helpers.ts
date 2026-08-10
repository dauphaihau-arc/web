import {
  formatChatConversationTime,
  formatChatUnreadCountLabel,
  getChatLatestMessagePreview,
  isChatConversationUnread
} from '@arc/lib';
import type { MyChatConversation } from '~/domains/me/api/chat/contracts/chat.contract';

export function isConversationUnread(conversation: MyChatConversation) {
  return isChatConversationUnread({
    unreadCount: conversation.buyer_unread_count,
    lastMessageSenderUserId: conversation.last_message_sender_user_id,
    lastMessageIsOwn: conversation.last_message_sender_user_id !== conversation.shop.owner_user_id,
    lastReadAt: conversation.buyer_last_read_at,
    lastMessageAt: conversation.last_message_at,
  });
}

export function formatConversationTime(value?: string | null) {
  return formatChatConversationTime(value);
}

export function getConversationTimeLabel(conversation: MyChatConversation) {
  return formatConversationTime(
    conversation.last_message?.created_at ||
    conversation.last_message_at ||
    conversation.created_at
  );
}

export function getConversationShopName(conversation: MyChatConversation) {
  return conversation.shop.shop_name.trim() || 'Shop';
}

export function getConversationShopInitial(conversation: MyChatConversation) {
  return getConversationShopName(conversation).charAt(0).toUpperCase() || 'S';
}

export function getConversationLatestMessagePreview(conversation: MyChatConversation) {
  return getChatLatestMessagePreview(conversation.last_message);
}

export function getConversationBuyerUnreadLabel(conversation: MyChatConversation) {
  return formatChatUnreadCountLabel(conversation.buyer_unread_count);
}
