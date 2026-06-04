import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { resolveMyShopId } from '../resolve-my-shop-id'
import { shopChatApi } from '~/shared/api/shop/chat/chat.api'

export function useShopMarkChatRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['shop-mark-chat-read'],
    mutationFn: async (conversationId: string) => {
      const shopId = await resolveMyShopId(queryClient)
      return await shopChatApi.markRead(shopId, conversationId)
    },
    onSuccess(_result, conversationId) {
      queryClient.invalidateQueries({ queryKey: ['shop-chat-conversations'] })
      queryClient.invalidateQueries({ queryKey: ['shop-chat-unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['shop-chat-messages', conversationId] })
    },
  })
}
