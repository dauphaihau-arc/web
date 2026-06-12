import { meChatApi } from '~/shared/api/me/chat/chat.api';
import type { SendMyChatMessageRequest } from '~/shared/api/me/chat/contracts/chat.contract';
import { toastCustom } from '~/shared/config/toast';

export function useMySendChatMessage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['my-send-chat-message'],
    mutationFn: async (input: {
      conversationId: string
      body: SendMyChatMessageRequest
    }) => {
      return await meChatApi.sendMessage(input.conversationId, input.body);
    },
    onSuccess(_result, variables) {
      queryClient.invalidateQueries({ queryKey: ['my-chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['my-chat-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['my-chat-messages', variables.conversationId] });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Failed to send message',
      });
    },
  });
}
