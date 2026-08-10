import dayjs from 'dayjs'

export type ChatLatestMessagePreviewFields = {
  message_type?: string | null
  body_preview?: string | null
}

export type ChatMessageTimeFields = {
  created_at: string
  sender_user_id: string
}

export type ChatUnreadOptions = {
  unreadCount: number
  lastMessageSenderUserId?: string | null
  lastMessageIsOwn: boolean
  lastReadAt?: string | null
  lastMessageAt?: string | null
}

export function formatChatConversationTime(value?: string | null) {
  if (!value) {
    return ''
  }

  const timestamp = dayjs(value)
  const today = dayjs().startOf('day')
  const messageDay = timestamp.startOf('day')

  if (messageDay.isSame(today)) {
    return timestamp.format('h:mm A')
  }

  if (messageDay.isSame(today.subtract(1, 'day'))) {
    return 'Yesterday'
  }

  if (timestamp.isSame(today, 'year')) {
    return timestamp.format('D MMM')
  }

  return timestamp.format('D MMM YYYY')
}

export function formatChatMessageTime(value: string) {
  return dayjs(value).format('HH:mm')
}

export function shouldShowChatMessageTime<TMessage extends ChatMessageTimeFields>(
  message: TMessage,
  index: number,
  messages: TMessage[],
) {
  const nextMessage = messages[index + 1]

  if (!nextMessage) {
    return true
  }

  const timestamp = dayjs(message.created_at)
  const nextTimestamp = dayjs(nextMessage.created_at)

  return message.sender_user_id !== nextMessage.sender_user_id
    || !timestamp.isSame(nextTimestamp, 'day')
    || nextTimestamp.diff(timestamp, 'minute') >= 5
}

export function getChatLatestMessagePreview(message?: ChatLatestMessagePreviewFields | null) {
  if (message?.message_type === 'product_reference') {
    return message.body_preview
      ? `Product: ${message.body_preview}`
      : 'Product shared'
  }

  return message?.body_preview || 'No messages yet.'
}

export function formatChatUnreadCountLabel(unreadCount: number) {
  return unreadCount > 99
    ? '99+'
    : String(unreadCount)
}

export function isChatConversationUnread(options: ChatUnreadOptions) {
  if (options.unreadCount > 0) {
    return true
  }

  if (options.lastMessageSenderUserId === null || options.lastMessageSenderUserId === undefined) {
    return false
  }

  return !options.lastMessageIsOwn
    && (
      !options.lastReadAt
      || (
        !!options.lastMessageAt
        && options.lastReadAt < options.lastMessageAt
      )
    )
}
