import {
  type InfiniteData,
  useInfiniteQuery
} from '@tanstack/vue-query';
import { meChatApi } from '~/domains/me/api/chat/chat.api';
import type {
  ListMyChatMessagesRequest,
  ListMyChatMessagesResponse
} from '~/domains/me/api/chat/contracts/chat.contract';

type MyChatMessagesQueryKey = [
  'my-chat-messages',
  string | undefined,
  { limit: number }
];

export function useMyChatMessages(
  conversationId?: MaybeRefOrGetter<string | undefined>,
  query?: MaybeRefOrGetter<ListMyChatMessagesRequest>
) {
  const resolvedConversationId = computed(() => toValue(conversationId));
  const resolvedQuery = computed(() => toValue(query));
  const resolvedLimit = computed(() => resolvedQuery.value?.limit ?? 50);

  return useInfiniteQuery<
    ListMyChatMessagesResponse,
    Error,
    InfiniteData<ListMyChatMessagesResponse, string | undefined>,
    MyChatMessagesQueryKey,
    string | undefined
  >({
    enabled: computed(() => !!resolvedConversationId.value),
    queryKey: computed<MyChatMessagesQueryKey>(() => [
      'my-chat-messages',
      resolvedConversationId.value,
      { limit: resolvedLimit.value },
    ]),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      return await meChatApi.listMessages(
        resolvedConversationId.value!,
        {
          limit: resolvedLimit.value,
          before: pageParam,
        }
      );
    },
    getPreviousPageParam: firstPage => firstPage.page_info.has_more_before ?
      firstPage.page_info.before_cursor ?? undefined :
      undefined,
    getNextPageParam: () => undefined,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}
