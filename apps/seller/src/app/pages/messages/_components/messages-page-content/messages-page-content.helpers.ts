import dayjs from 'dayjs'
import type {
  ShopChatConversation,
  ShopChatMessage,
} from '~/shared/api/shop/chat/contracts/chat.contract'

export function isConversationUnread(
  conversation: ShopChatConversation,
  shopOwnerUserId?: string | null,
) {
  if (!shopOwnerUserId) {
    return false
  }

  return conversation.last_message_sender_user_id !== null
    && conversation.last_message_sender_user_id !== shopOwnerUserId
    && (
      !conversation.seller_last_read_at
      || (
        !!conversation.last_message_at
        && conversation.seller_last_read_at < conversation.last_message_at
      )
    )
}

export function formatConversationTime(value?: string | null) {
  if (!value) {
    return ''
  }

  return dayjs(value).format('MMM D, HH:mm')
}

export function formatMessageTime(message: ShopChatMessage) {
  return dayjs(message.created_at).format('HH:mm')
}

export function toThreadMessages(
  messages: ShopChatMessage[],
  shopOwnerUserId?: string | null,
) {
  return messages.map(message => ({
    id: message.id,
    body: message.body,
    createdAtLabel: formatMessageTime(message),
    isOwn: message.sender_user_id === shopOwnerUserId,
  }))
}
