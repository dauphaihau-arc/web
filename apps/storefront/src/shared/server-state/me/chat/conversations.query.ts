import { meChatApi } from '~/shared/api/me/chat/chat.api';
import type { ListMyChatConversationsRequest } from '~/shared/api/me/chat/contracts/chat.contract';

export function useMyChatConversations(
  query?: MaybeRefOrGetter<ListMyChatConversationsRequest>
) {
  const resolvedQuery = computed(() => toValue(query));

  return useQuery({
    queryKey: ['my-chat-conversations', resolvedQuery],
    queryFn: async () => {
      return await meChatApi.listConversations(resolvedQuery.value);
    },
    refetchInterval: 15_000,
  });
}

export function useMyChatUnreadCount() {
  return useQuery({
    queryKey: ['my-chat-unread-count'],
    queryFn: async () => {
      return await meChatApi.unreadCount();
    },
    refetchInterval: 15_000,
  });
}
