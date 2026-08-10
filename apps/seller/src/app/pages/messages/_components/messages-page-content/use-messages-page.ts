import { useQueryClient } from '@tanstack/vue-query';
import { parseChatProductReference } from '@arc/lib';
import { formatMinorCurrency } from '@arc/utils';
import {
  formatConversationTime,
  getConversationBuyerInitial,
  getConversationBuyerName,
  getConversationLatestMessagePreview,
  getConversationSellerUnreadLabel,
  isConversationUnread,
  toThreadMessages
} from './messages-page-content.helpers';
import { routes } from '~/shared/navigation/routes';
import type {
  ShopChatConversation,
  ShopChatMessage
} from '~/domains/shop/api/chat/contracts/chat.contract';
import { createSellerChatEventsClient } from '~/domains/shop/chat/realtime/chat-events.client';
import { useGetMyShop } from '~/domains/shop/queries/my-shop.query';
import { useShopMarkChatRead } from '~/domains/shop/mutations/mark-read.mutation';
import { useShopChatMessages } from '~/domains/shop/queries/messages.query';
import { useShopSendChatMessage } from '~/domains/shop/mutations/send-message.mutation';
import { useShopChatConversations } from '~/domains/shop/queries/conversations.query';

function buildAssetUrl(assetHost: string, storageKey?: string) {
  if (!storageKey || !assetHost) {
    return undefined;
  }

  return `${assetHost}/${storageKey.replace(/^\/+/, '')}`;
}

export function useMessagesPage(selectedConversationId: Ref<string | undefined>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();

  const storefrontAppURL = computed(() => config.public.storefrontAppURL.replace(/\/+$/, ''));
  const assetHost = computed(() => config.public.assetHost?.replace(/\/+$/, '') ?? '');

  const chatEventsClient = import.meta.client ?
    createSellerChatEventsClient(queryClient) :
    null;

  const conversationParams = computed(() => ({
    page: 1,
    limit: 50,
  }));

  const messageParams = computed(() => ({
    limit: 50,
  }));

  const messageDraft = ref('');

  const { data: myShop } = useGetMyShop();

  const {
    data: conversationList,
    isPending: isPendingConversations,
  } = useShopChatConversations(conversationParams);

  const {
    data: messageList,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    isPending: isPendingMessages,
  } = useShopChatMessages(selectedConversationId, messageParams);

  const {
    mutateAsync: sendMessage,
    isPending: isSendingMessage,
  } = useShopSendChatMessage();

  const { mutate: markConversationRead } = useShopMarkChatRead();

  const conversations = computed<ShopChatConversation[]>(() => conversationList.value?.results ?? []);

  const messages = computed<ShopChatMessage[]>(() => {
    const messageById = new Map<string, ShopChatMessage>();

    for (const page of messageList.value?.pages ?? []) {
      for (const message of page.results) {
        messageById.set(message.id, message);
      }
    }

    return Array
      .from(messageById.values())
      .sort((left, right) => {
        const timeDelta = Date.parse(left.created_at) - Date.parse(right.created_at);

        return timeDelta === 0 ?
          left.id.localeCompare(right.id) :
          timeDelta;
      });
  });

  const shopOwnerUserId = computed(() => myShop.value?.owner_user_id);

  const selectedConversationResolved = computed<ShopChatConversation | null>(() => {
    return messageList.value?.pages.at(-1)?.conversation ??
      conversations.value.find(conversation => conversation.id === selectedConversationId.value) ??
      null;
  });

  const selectedConversationUnread = computed(() => {
    const conversation = selectedConversationResolved.value;

    return conversation ?
      isConversationUnread(conversation, shopOwnerUserId.value) :
      false;
  });

  const threadMessages = computed(() => toThreadMessages(
    messages.value,
    shopOwnerUserId.value,
    toProductReferenceDisplay
  ));

  watch(
    conversations,
    (nextConversations: ShopChatConversation[]) => {
      if (selectedConversationId.value) {
        return;
      }

      const firstConversation = nextConversations[0];

      if (!firstConversation) {
        return;
      }

      router.replace(routes.messages({ conversationId: firstConversation.id }));
    },
    { immediate: true }
  );

  watch(
    selectedConversationResolved,
    (conversation: ShopChatConversation | null) => {
      if (!conversation || !selectedConversationUnread.value) {
        return;
      }

      markConversationRead(conversation.id);
    },
    { immediate: true }
  );

  if (import.meta.client) {
    onMounted(() => {
      chatEventsClient?.start();
    });

    watch(
      selectedConversationId,
      (conversationId: string | undefined, previousConversationId: string | undefined) => {
        if (previousConversationId) {
          chatEventsClient?.unsubscribeConversation(previousConversationId);
        }

        if (!conversationId) {
          return;
        }

        chatEventsClient?.subscribeConversation(conversationId);
      },
      { immediate: true }
    );

    onBeforeUnmount(() => {
      if (selectedConversationId.value) {
        chatEventsClient?.unsubscribeConversation(selectedConversationId.value);
      }

      chatEventsClient?.stop();
    });
  }

  function selectConversation(conversation: ShopChatConversation) {
    router.push(routes.messages({ conversationId: conversation.id }));
  }

  function conversationTimeLabel(conversation: ShopChatConversation) {
    return formatConversationTime(conversation.last_message?.created_at || conversation.last_message_at || conversation.created_at);
  }

  function toProductReferenceDisplay(message: ShopChatMessage) {
    const productReference = parseChatProductReference(message.metadata);

    if (!productReference) {
      return undefined;
    }

    const snapshot = productReference.snapshot;
    const priceLabel = snapshot.amount_minor != null && snapshot.currency ?
      formatMinorCurrency(snapshot.amount_minor, snapshot.currency) :
      undefined;
    const statusLabel = productReference.current?.in_stock === false ?
      'Currently unavailable' :
      undefined;

    return {
      title: snapshot.title,
      imageUrl: buildAssetUrl(assetHost.value, snapshot.image_storage_key),
      priceLabel,
      statusLabel,
      href: `${storefrontAppURL.value}/${snapshot.shop_slug}/${snapshot.product_slug}`,
      external: true,
    };
  }

  async function handleSendMessage() {
    const conversationId = selectedConversationId.value;
    const body = messageDraft.value.trim();

    if (!conversationId || !body || isSendingMessage.value) {
      return;
    }

    await sendMessage({
      conversationId,
      body: { body },
    });

    messageDraft.value = '';
  }

  return {
    conversationList,
    conversations,
    conversationTimeLabel,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    getConversationBuyerInitial,
    getConversationBuyerName,
    getConversationLatestMessagePreview,
    getConversationSellerUnreadLabel,
    handleSendMessage,
    isConversationUnread: (conversation: ShopChatConversation) =>
      isConversationUnread(conversation, shopOwnerUserId.value),
    isPendingConversations,
    isPendingMessages,
    isSendingMessage,
    messageDraft,
    messages,
    selectConversation,
    selectedConversationResolved,
    threadMessages,
  };
}
