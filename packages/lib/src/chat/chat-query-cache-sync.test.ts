import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { QueryClient } from '@tanstack/vue-query';
import { createChatQuerySyncHandler } from './chat-query-cache-sync';
import type {
  BaseChatConversation,
  BaseChatMessage,
  ChatMessageCreatedRealtimeEvent,
} from './chat-realtime.types';

const CONVERSATION_QUERY_KEY = 'shop-chat-conversations';
const MESSAGE_QUERY_KEY = 'shop-chat-messages';
const UNREAD_COUNT_QUERY_KEY = 'shop-chat-unread-count';

function createConversation(
  overrides: Partial<BaseChatConversation> = {},
): BaseChatConversation {
  return {
    id: 'conv-1',
    buyer_user_id: 'buyer-1',
    shop: { owner_user_id: 'owner-1' },
    last_message: {
      id: 'msg-0',
      body_preview: 'Earlier message',
      sender_user_id: 'buyer-1',
      message_type: 'text',
      created_at: '2026-01-01T00:00:00.000Z',
    },
    last_message_at: '2026-01-01T00:00:00.000Z',
    last_message_sender_user_id: 'buyer-1',
    buyer_last_read_at: null,
    seller_last_read_at: null,
    buyer_unread_count: 0,
    seller_unread_count: 0,
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createMessageEvent(
  overrides: Partial<ChatMessageCreatedRealtimeEvent['message']> = {},
  conversationId = 'conv-1',
): ChatMessageCreatedRealtimeEvent {
  return {
    event_type: 'chat.message.created',
    conversation_id: conversationId,
    shop_id: 'shop-1',
    message: {
      id: 'msg-1',
      body: 'A brand new message',
      message_type: 'text',
      sender_user_id: 'buyer-1',
      occurred_at: '2026-01-02T00:00:00.000Z',
      metadata: null,
      ...overrides,
    },
  };
}

function createHandler(queryClient: QueryClient) {
  return createChatQuerySyncHandler<BaseChatConversation, BaseChatMessage>({
    stateKey: 'shop-chat-state',
    socketUrl: 'http://localhost',
    queryClient,
    conversationQueryKey: CONVERSATION_QUERY_KEY,
    unreadCountQueryKey: UNREAD_COUNT_QUERY_KEY,
    messageQueryKey: MESSAGE_QUERY_KEY,
    createMessage: payload => ({
      id: payload.message.id,
      conversation_id: payload.conversation_id,
      sender_user_id: payload.message.sender_user_id,
      body: payload.message.body,
      message_type: payload.message.message_type ?? 'text',
      metadata: payload.message.metadata,
      edited_at: null,
      created_at: payload.message.occurred_at,
      updated_at: payload.message.occurred_at,
    }),
    isConversationUnread: conversation => conversation.seller_unread_count > 0,
  });
}

describe('createChatQuerySyncHandler conversation lists', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it('patches the variant holding the conversation and refetches the ones missing it', async () => {
    const target = createConversation({
      id: 'conv-1',
      buyer_unread_count: 4,
      seller_unread_count: 0,
    });
    const other = createConversation({ id: 'conv-2' });

    const populatedKey = [CONVERSATION_QUERY_KEY, { page: 1 }];
    const filteredKey = [CONVERSATION_QUERY_KEY, { page: 1, unread: true }];

    queryClient.setQueryData(populatedKey, { results: [other, target] });
    queryClient.setQueryData(filteredKey, { results: [other] });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await createHandler(queryClient)(createMessageEvent({ sender_user_id: 'buyer-1' }));

    const patched = queryClient.getQueryData<{ results: BaseChatConversation[] }>(populatedKey);
    expect(patched?.results.map(conversation => conversation.id)).toEqual(['conv-1', 'conv-2']);

    const promoted = patched?.results[0];
    expect(promoted?.last_message?.id).toBe('msg-1');
    expect(promoted?.last_message_at).toBe('2026-01-02T00:00:00.000Z');
    // The buyer sent it, so their counter resets while the shop's grows.
    expect(promoted?.buyer_unread_count).toBe(0);
    expect(promoted?.seller_unread_count).toBe(1);

    const filtered = queryClient.getQueryData<{ results: BaseChatConversation[] }>(filteredKey);
    expect(filtered?.results).toEqual([other]);

    const invalidatedKeys = invalidateSpy.mock.calls.map(([filters]) => (
      typeof filters === 'function' ? undefined : filters?.queryKey
    ));
    expect(invalidatedKeys).toEqual([filteredKey]);
  });

  it('increments the buyer counter for messages sent by the shop owner', async () => {
    const target = createConversation({
      id: 'conv-1',
      buyer_unread_count: 2,
      seller_unread_count: 0,
    });
    const populatedKey = [CONVERSATION_QUERY_KEY, { page: 1 }];

    queryClient.setQueryData(populatedKey, { results: [target] });

    await createHandler(queryClient)(createMessageEvent({ sender_user_id: 'owner-1' }));

    const patched = queryClient.getQueryData<{ results: BaseChatConversation[] }>(populatedKey);
    expect(patched?.results[0]?.buyer_unread_count).toBe(3);
    expect(patched?.results[0]?.seller_unread_count).toBe(0);
  });

  it('ignores list and message variants whose data is empty or undefined', () => {
    const emptyKey = [CONVERSATION_QUERY_KEY, { page: 1 }];
    const undefinedKey = [CONVERSATION_QUERY_KEY, { page: 1, unread: true }];

    queryClient.setQueryData(emptyKey, { results: [] });
    queryClient.setQueryData(undefinedKey, undefined);
    queryClient.setQueryData([MESSAGE_QUERY_KEY, 'conv-1'], undefined);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const handler = createHandler(queryClient);

    expect(() => handler(createMessageEvent())).not.toThrow();

    expect(queryClient.getQueryData(emptyKey)).toEqual({ results: [] });
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
