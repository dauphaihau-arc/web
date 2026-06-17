<script lang="ts" setup>
import ConversationThreadPanel from './conversation/conversation-thread-panel.vue'

type ChatThreadMessage = {
  id: string
  body: string
  createdAtLabel: string
  isOwn: boolean
}

const props = withDefaults(defineProps<{
  hasConversation: boolean
  loading?: boolean
  empty?: boolean
  emptyStateText?: string
  emptyMessagesText?: string
  messages: ChatThreadMessage[]
  modelValue: string
  sending?: boolean
  textareaRows?: number
  textareaMaxRows?: number
  textareaClass?: string
  messageBubbleClass?: string
  ownMessageBubbleClass?: string
  incomingMessageBubbleClass?: string
  composerClass?: string
  listClass?: string
  sectionClass?: string
}>(), {
  loading: false,
  empty: false,
  emptyStateText: 'Select a conversation to read and reply.',
  emptyMessagesText: 'No messages yet.',
  sending: false,
  textareaRows: 3,
  textareaMaxRows: 8,
  textareaClass: 'w-full',
  messageBubbleClass: 'rounded-xl px-4 py-1 shadow-sm',
  ownMessageBubbleClass: 'bg-primary text-white',
  incomingMessageBubbleClass: 'bg-surface text-text-strong',
  composerClass: 'bg-surface-muted px-6 py-4',
  listClass: 'flex-1 space-y-4 overflow-y-auto bg-surface-muted px-6 py-5',
  sectionClass: 'flex min-h-[70vh] flex-col',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send'): void
}>()

const messageListEl = ref<HTMLElement | null>(null)

const messageDraft = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const isSendDisabled = computed(() => !props.modelValue.trim())

watch(
  () => props.messages,
  async () => {
    await nextTick()

    if (!messageListEl.value) {
      return
    }

    messageListEl.value.scrollTop = messageListEl.value.scrollHeight
  },
  { deep: true },
)

function handleSend() {
  emit('send')
}
</script>

<template>
  <ConversationThreadPanel
    :has-conversation="hasConversation"
    :loading="loading"
    :empty="empty"
    :empty-state-text="emptyStateText"
    :empty-messages-text="emptyMessagesText"
    :composer-class="composerClass"
    :list-class="listClass"
    :section-class="sectionClass"
  >
    <template
      v-if="$slots.header"
      #header
    >
      <slot name="header" />
    </template>

    <template #default>
      <div
        ref="messageListEl"
        class="contents"
      />

      <div
        v-for="message in messages"
        :key="message.id"
        class="flex"
        :class="message.isOwn ? 'justify-end' : 'justify-start'"
      >
        <div class="max-w-[75%]">
          <div
            :class="[
              messageBubbleClass,
              message.isOwn ? ownMessageBubbleClass : incomingMessageBubbleClass,
            ]"
          >
            <div class="whitespace-pre-wrap text-sm leading-6">
              {{ message.body }}
            </div>
          </div>
          <div
            class="mt-2 text-[11px]"
            :class="message.isOwn ? 'text-right text-text-muted' : 'text-left text-text-muted'"
          >
            {{ message.createdAtLabel }}
          </div>
        </div>
      </div>
    </template>

    <template #composer>
      <form @submit.prevent="handleSend">
        <div class="relative">
          <UTextarea
            v-model="messageDraft"
            :rows="textareaRows"
            :maxrows="textareaMaxRows"
            autoresize
            :class="textareaClass"
            textarea-class="p-3.5 !pr-[3.8rem]"
            padded
            placeholder="Write your message..."
            rounded="xl"
            :ui="{
              rounded: 'rounded-xl',
              base: 'min-h-28 resize-none rounded-[10px] bg-surface text-lg leading-8 text-text-strong shadow-none focus:ring-0',
              placeholder: 'placeholder:text-text-muted',
            }"
            @keydown.enter.prevent="handleSend"
          />
          <UButton
            type="submit"
            icon="i-lucide-arrow-up"
            :loading="sending"
            :disabled="isSendDisabled"
            :ui="{ rounded: 'rounded-full' }"
            class="absolute bottom-3 right-3 size-8 justify-center rounded-full p-0"
          />
        </div>
      </form>
    </template>
  </ConversationThreadPanel>
</template>
