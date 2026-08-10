import {
  type InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopChatApi } from '~/domains/shop/api/chat/chat.api';
import type {
  ListShopChatMessagesRequest,
  ListShopChatMessagesResponse,
} from '~/domains/shop/api/chat/contracts/chat.contract';

type ShopChatMessagesQueryKey = [
  'shop-chat-messages',
  string | undefined,
  { limit: number },
];

export function useShopChatMessages(
  conversationId?: MaybeRefOrGetter<string | undefined>,
  query?: MaybeRefOrGetter<ListShopChatMessagesRequest>,
) {
  const queryClient = useQueryClient();
  const resolvedConversationId = computed(() => toValue(conversationId));
  const resolvedQuery = computed(() => toValue(query));
  const resolvedLimit = computed(() => resolvedQuery.value?.limit ?? 50);

  return useInfiniteQuery<
    ListShopChatMessagesResponse,
    Error,
    InfiniteData<ListShopChatMessagesResponse, string | undefined>,
    ShopChatMessagesQueryKey,
    string | undefined
  >({
    enabled: computed(() => !!resolvedConversationId.value),
    queryKey: computed<ShopChatMessagesQueryKey>(() => [
      'shop-chat-messages',
      resolvedConversationId.value,
      { limit: resolvedLimit.value },
    ]),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopChatApi.listMessages(
        shopId,
        resolvedConversationId.value!,
        {
          limit: resolvedLimit.value,
          before: pageParam,
        },
      );
    },
    getPreviousPageParam: firstPage => firstPage.page_info.has_more_before
      ? firstPage.page_info.before_cursor ?? undefined
      : undefined,
    getNextPageParam: () => undefined,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}
