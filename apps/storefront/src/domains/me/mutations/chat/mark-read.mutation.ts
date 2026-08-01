import { meChatApi } from '~/domains/me/api/chat/chat.api';

export function useMyMarkChatRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['my-mark-chat-read'],
    mutationFn: async (conversationId: string) => {
      return await meChatApi.markRead(conversationId);
    },
    onSuccess(_result, conversationId) {
      queryClient.invalidateQueries({ queryKey: ['my-chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['my-chat-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['my-chat-messages', conversationId] });
    },
  });
}
