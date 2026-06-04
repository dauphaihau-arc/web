import { createChatQuerySyncHandler } from './chat-query-cache-sync'
import { createSharedChatSocketClient } from './chat-socket-client'
import type {
  BaseChatConversation,
  BaseChatMessage,
  ChatEventsClient,
  CreateChatEventsClientOptions,
} from './chat-realtime.types'

export type {
  BaseChatConversation,
  BaseChatMessage,
  ChatEventsClient,
  ChatMessageCreatedRealtimeEvent,
  CreateChatEventsClientOptions,
} from './chat-realtime.types'

export function createChatEventsClient<
  TConversation extends BaseChatConversation,
  TMessage extends BaseChatMessage,
>(
  options: CreateChatEventsClientOptions<TConversation, TMessage>,
): ChatEventsClient {
  const socketClient = createSharedChatSocketClient({
    stateKey: options.stateKey,
    socketUrl: options.socketUrl,
  })
  const handler = createChatQuerySyncHandler(options)

  return {
    start() {
      socketClient.start(handler)
    },
    stop() {
      socketClient.stop(handler)
    },
    subscribeConversation(conversationId: string) {
      socketClient.subscribeConversation(conversationId)
    },
    unsubscribeConversation(conversationId: string) {
      socketClient.unsubscribeConversation(conversationId)
    },
  }
}
