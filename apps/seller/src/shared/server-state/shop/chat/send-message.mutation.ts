import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { resolveMyShopId } from '../resolve-my-shop-id'
import { toastCustom } from '~/shared/config/toast'
import { shopChatApi } from '~/shared/api/shop/chat/chat.api'
import type { SendShopChatMessageRequest } from '~/shared/api/shop/chat/contracts/chat.contract'

export function useShopSendChatMessage() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: ['shop-send-chat-message'],
    mutationFn: async (input: {
      conversationId: string
      body: SendShopChatMessageRequest
    }) => {
      const shopId = await resolveMyShopId(queryClient)
      return await shopChatApi.sendMessage(shopId, input.conversationId, input.body)
    },
    onSuccess(_result, variables) {
      queryClient.invalidateQueries({ queryKey: ['shop-chat-conversations'] })
      queryClient.invalidateQueries({ queryKey: ['shop-chat-unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['shop-chat-messages', variables.conversationId] })
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Failed to send message',
      })
    },
  })
}
