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

type UnreadCountData = {
  unread_count: number
}

function patchConversation<TConversation extends BaseChatConversation>(
  conversation: TConversation,
  payload: ChatMessageCreatedRealtimeEvent,
): TConversation {
  return {
    ...conversation,
    last_message_at: payload.message.occurred_at,
    last_message_sender_user_id: payload.message.sender_user_id,
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
  const cacheEntries = options.queryClient.getQueriesData<MessageListData<TConversation, TMessage>>({
    queryKey: [options.messageQueryKey],
  })

  for (const [queryKey, queryData] of cacheEntries) {
    if (queryData?.conversation?.id !== payload.conversation_id) {
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
  }
}
