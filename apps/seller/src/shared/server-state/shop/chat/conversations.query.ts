import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { resolveMyShopId } from '../resolve-my-shop-id'
import { shopChatApi } from '~/shared/api/shop/chat/chat.api'
import type { ListShopChatConversationsRequest } from '~/shared/api/shop/chat/contracts/chat.contract'

export function useShopChatConversations(
  query?: MaybeRefOrGetter<ListShopChatConversationsRequest>,
) {
  const queryClient = useQueryClient()
  const resolvedQuery = computed(() => toValue(query))

  return useQuery({
    queryKey: ['shop-chat-conversations', resolvedQuery],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient)
      return await shopChatApi.listConversations(shopId, resolvedQuery.value)
    },
    refetchInterval: 15_000,
  })
}

export function useShopChatUnreadCount() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['shop-chat-unread-count'],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient)
      return await shopChatApi.unreadCount(shopId)
    },
    refetchInterval: 15_000,
  })
}
