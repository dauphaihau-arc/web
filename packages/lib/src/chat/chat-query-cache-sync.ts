import type { InfiniteData } from '@tanstack/vue-query'
import type {
  BaseChatConversation,
  BaseChatMessage,
  ChatEventsHandler,
  ChatMessageCreatedRealtimeEvent,
  CreateChatEventsClientOptions,
} from './chat-realtime.types'

type ConversationListData<TConversation> = {
  results: TConversation[]
}

type MessageListData<TConversation, TMessage> = {
  conversation: TConversation
  results: TMessage[]
}

type InfiniteMessageListData<TConversation, TMessage> = InfiniteData<
  MessageListData<TConversation, TMessage>
>

type UnreadCountData = {
  unread_count: number
}

function patchConversation<TConversation extends BaseChatConversation>(
  conversation: TConversation,
  payload: ChatMessageCreatedRealtimeEvent,
): TConversation {
  const senderUserId = payload.message.sender_user_id

  return {
    ...conversation,
    last_message: {
      id: payload.message.id,
      body_preview: payload.message.body.trim().replace(/\s+/g, ' ').slice(0, 160),
      sender_user_id: payload.message.sender_user_id,
      message_type: payload.message.message_type ?? 'text',
      created_at: payload.message.occurred_at,
    },
    last_message_at: payload.message.occurred_at,
    last_message_sender_user_id: senderUserId,
    buyer_unread_count: senderUserId === conversation.buyer_user_id
      ? 0
      : conversation.buyer_unread_count + 1,
    seller_unread_count: senderUserId === conversation.shop.owner_user_id
      ? 0
      : conversation.seller_unread_count + 1,
    updated_at: payload.message.occurred_at,
  }
}

function patchMessageLists<
  TConversation extends BaseChatConversation,
  TMessage extends BaseChatMessage,
>(
  options: Pick<
    CreateChatEventsClientOptions<TConversation, TMessage>,
    'queryClient' | 'messageQueryKey' | 'createMessage'
  >,
  payload: ChatMessageCreatedRealtimeEvent,
): void {
  const cacheEntries = options.queryClient.getQueriesData<
    MessageListData<TConversation, TMessage> | InfiniteMessageListData<TConversation, TMessage>
  >({
    queryKey: [options.messageQueryKey],
  })

  for (const [queryKey, queryData] of cacheEntries) {
    if (!queryData) {
      continue
    }

    if ('pages' in queryData) {
      const conversationPage = queryData.pages.find(page => page.conversation.id === payload.conversation_id)

      if (!conversationPage) {
        continue
      }

      const hasExistingMessage = queryData.pages.some(page =>
        page.results.some(message => message.id === payload.message.id))

      if (hasExistingMessage) {
        continue
      }

      const lastPageIndex = queryData.pages.length - 1
      const nextPages = queryData.pages.map((page, index) => ({
        ...page,
        conversation: patchConversation(page.conversation, payload),
        results: index === lastPageIndex
          ? [
              ...page.results,
              options.createMessage(payload),
            ]
          : page.results,
      }))

      options.queryClient.setQueryData(queryKey, {
        ...queryData,
        pages: nextPages,
      })

      continue
    }

    if (queryData.conversation.id !== payload.conversation_id) {
      continue
    }

    const hasExistingMessage = queryData.results.some(message => message.id === payload.message.id)

    if (hasExistingMessage) {
      continue
    }

    options.queryClient.setQueryData(queryKey, {
      ...queryData,
      conversation: patchConversation(queryData.conversation, payload),
      results: [
        ...queryData.results,
        options.createMessage(payload),
      ],
    })
  }
}

function patchUnreadCounts<TConversation extends BaseChatConversation>(
  options: Pick<
    CreateChatEventsClientOptions<TConversation, BaseChatMessage>,
    'queryClient' | 'unreadCountQueryKey' | 'isConversationUnread'
  >,
  previousConversation: TConversation,
  nextConversation: TConversation,
): void {
  const previousUnread = options.isConversationUnread(previousConversation)
  const nextUnread = options.isConversationUnread(nextConversation)

  if (previousUnread === nextUnread) {
    return
  }

  const delta = nextUnread ? 1 : -1
  const cacheEntries = options.queryClient.getQueriesData<UnreadCountData>({
    queryKey: [options.unreadCountQueryKey],
  })

  for (const [queryKey, queryData] of cacheEntries) {
    if (!queryData) {
      continue
    }

    options.queryClient.setQueryData(queryKey, {
      ...queryData,
      unread_count: Math.max(0, queryData.unread_count + delta),
    })
  }
}

export function createChatQuerySyncHandler<
  TConversation extends BaseChatConversation,
  TMessage extends BaseChatMessage,
>(
  options: CreateChatEventsClientOptions<TConversation, TMessage>,
): ChatEventsHandler {
  return (payload) => {
    const cacheEntries = options.queryClient.getQueriesData<ConversationListData<TConversation>>({
      queryKey: [options.conversationQueryKey],
    })

    for (const [queryKey, queryData] of cacheEntries) {
      if (!queryData?.results?.length) {
        continue
      }

      const existingIndex = queryData.results.findIndex(conversation => conversation.id === payload.conversation_id)

      if (existingIndex < 0) {
        continue
      }

      const previousConversation = queryData.results[existingIndex]
      const nextConversation = patchConversation(previousConversation, payload)
      const nextResults = [
        nextConversation,
        ...queryData.results.filter(conversation => conversation.id !== payload.conversation_id),
      ]

      options.queryClient.setQueryData(queryKey, {
        ...queryData,
        results: nextResults,
      })

      patchUnreadCounts(
        options,
        previousConversation,
        nextConversation,
      )
    }

    patchMessageLists(
      options,
      payload,
    )

    if (payload.message.message_type === 'product_reference') {
      options.queryClient.invalidateQueries({
        queryKey: [options.messageQueryKey, payload.conversation_id],
      })
    }
  }
}
