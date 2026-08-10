import { meChatApi } from '~/domains/me/api/chat/chat.api';
import type { CreateMyChatConversationRequest } from '~/domains/me/api/chat/contracts/chat.contract';
import { toastCustom } from '~/shared/config/toast';

export function useCreateOrGetMyChatConversation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['create-or-get-my-chat-conversation'],
    mutationFn: async (body: CreateMyChatConversationRequest) => {
      return await meChatApi.createOrGetConversation(body);
    },
    onSuccess(conversation) {
      queryClient.removeQueries({ queryKey: ['my-chat-messages', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['my-chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['my-chat-unread-count'] });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Failed to open chat',
      });
    },
  });
}
