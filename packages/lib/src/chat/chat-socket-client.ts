import { io, type Socket } from 'socket.io-client'
import type {
  ChatEventsHandler,
  ChatMessageCreatedRealtimeEvent,
} from './chat-realtime.types'

type GlobalChatSocketState = {
  socket: Socket | null
  handlers: Set<ChatEventsHandler>
  activeConsumerCount: number
  subscribedConversationIds: Set<string>
}

type CreateSharedChatSocketClientOptions = {
  stateKey: string
  socketUrl: string
}

function isChatMessageCreatedRealtimeEvent(
  value: unknown,
): value is ChatMessageCreatedRealtimeEvent {
  if (!value || typeof value !== 'object') {
    return false
  }

  return Reflect.get(value, 'event_type') === 'chat.message.created'
    && typeof Reflect.get(value, 'conversation_id') === 'string'
}

function getGlobalChatSocketState(stateKey: string): GlobalChatSocketState {
  const globalState = globalThis as typeof globalThis & {
    __arcChatSocketStates__?: Record<string, GlobalChatSocketState>
  }

  if (!globalState.__arcChatSocketStates__) {
    globalState.__arcChatSocketStates__ = {}
  }

  if (!globalState.__arcChatSocketStates__[stateKey]) {
    globalState.__arcChatSocketStates__[stateKey] = {
      socket: null,
      handlers: new Set(),
      activeConsumerCount: 0,
      subscribedConversationIds: new Set(),
    }
  }

  return globalState.__arcChatSocketStates__[stateKey]
}

function ensureSocket(
  state: GlobalChatSocketState,
  socketUrl: string,
): Socket {
  if (state.socket) {
    return state.socket
  }

  const socket = io(socketUrl, {
    autoConnect: false,
    withCredentials: true,
  })

  socket.on('connect', () => {
    for (const conversationId of state.subscribedConversationIds) {
      socket.emit('conversation.subscribe', {
        conversation_id: conversationId,
      })
    }
  })

  socket.on('message', (payload: unknown) => {
    if (!isChatMessageCreatedRealtimeEvent(payload)) {
      return
    }

    for (const handler of state.handlers) {
      void handler(payload)
    }
  })

  socket.on('connect_error', (error) => {
    console.warn('Chat socket connection error', error)
  })

  state.socket = socket

  return socket
}

export function createSharedChatSocketClient(
  options: CreateSharedChatSocketClientOptions,
) {
  const state = getGlobalChatSocketState(options.stateKey)

  return {
    start(handler: ChatEventsHandler) {
      state.handlers.add(handler)
      state.activeConsumerCount += 1

      const socket = ensureSocket(state, options.socketUrl)

      if (!socket.connected) {
        socket.connect()
      }
    },
    stop(handler: ChatEventsHandler) {
      state.handlers.delete(handler)
      state.activeConsumerCount = Math.max(0, state.activeConsumerCount - 1)

      if (state.activeConsumerCount > 0) {
        return
      }

      state.socket?.disconnect()
      state.socket = null
    },
    subscribeConversation(conversationId: string) {
      state.subscribedConversationIds.add(conversationId)

      if (!state.socket?.connected) {
        return
      }

      state.socket.emit('conversation.subscribe', {
        conversation_id: conversationId,
      })
    },
    unsubscribeConversation(conversationId: string) {
      state.subscribedConversationIds.delete(conversationId)

      if (!state.socket?.connected) {
        return
      }

      state.socket.emit('conversation.unsubscribe', {
        conversation_id: conversationId,
      })
    },
  }
}
