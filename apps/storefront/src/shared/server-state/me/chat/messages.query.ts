import { meChatApi } from '~/shared/api/me/chat/chat.api';
import type { ListMyChatMessagesRequest } from '~/shared/api/me/chat/contracts/chat.contract';

export function useMyChatMessages(
  conversationId?: MaybeRefOrGetter<string | undefined>,
  query?: MaybeRefOrGetter<ListMyChatMessagesRequest>
) {
  const resolvedConversationId = computed(() => toValue(conversationId));
  const resolvedQuery = computed(() => toValue(query));

  return useQuery({
    enabled: computed(() => !!resolvedConversationId.value),
    queryKey: ['my-chat-messages', resolvedConversationId, resolvedQuery],
    queryFn: async () => {
      return await meChatApi.listMessages(
        resolvedConversationId.value!,
        resolvedQuery.value
      );
    },
    refetchInterval: 10_000,
  });
}
