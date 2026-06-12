import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { resolveMyShopId } from '../resolve-my-shop-id';
import { shopChatApi } from '~/shared/api/shop/chat/chat.api';
import type { ListShopChatMessagesRequest } from '~/shared/api/shop/chat/contracts/chat.contract';

export function useShopChatMessages(
  conversationId?: MaybeRefOrGetter<string | undefined>,
  query?: MaybeRefOrGetter<ListShopChatMessagesRequest>
) {
  const queryClient = useQueryClient();
  const resolvedConversationId = computed(() => toValue(conversationId));
  const resolvedQuery = computed(() => toValue(query));

  return useQuery({
    enabled: computed(() => !!resolvedConversationId.value),
    queryKey: ['shop-chat-messages', resolvedConversationId, resolvedQuery],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopChatApi.listMessages(
        shopId,
        resolvedConversationId.value!,
        resolvedQuery.value
      );
    },
    refetchInterval: 10_000,
  });
}
