import {
  formatChatConversationTime,
  formatChatUnreadCountLabel,
  isChatConversationUnread,
} from '@arc/lib';
import type { MyChatConversation } from '~/domains/me/api/chat/contracts/chat.contract';

type Translate = (key: string, params?: Record<string, unknown>) => string;

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

export function getConversationTimeLabel(conversation: MyChatConversation, t?: Translate) {
  const label = formatConversationTime(
    conversation.last_message?.created_at
    || conversation.last_message_at
    || conversation.created_at,
  );

  return label === 'Yesterday' && t ? t('account.messages.yesterday') : label;
}

export function getConversationShopName(conversation: MyChatConversation, t?: Translate) {
  return conversation.shop.shop_name.trim() || t?.('account.common.shopFallback') || 'Shop';
}

export function getConversationShopInitial(conversation: MyChatConversation, t?: Translate) {
  return getConversationShopName(conversation, t).charAt(0).toUpperCase() || 'S';
}

export function getConversationLatestMessagePreview(conversation: MyChatConversation, t?: Translate) {
  const message = conversation.last_message;

  if (message?.message_type === 'product_reference') {
    const name = message.body_preview;

    return name
      ? t?.('account.messages.productPrefix', { name }) ?? `Product: ${name}`
      : t?.('account.messages.productShared') ?? 'Product shared';
  }

  return message?.body_preview || t?.('account.messages.noMessages') || 'No messages yet.';
}

export function getConversationBuyerUnreadLabel(conversation: MyChatConversation) {
  return formatChatUnreadCountLabel(conversation.buyer_unread_count);
}
