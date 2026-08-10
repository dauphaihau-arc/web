<script lang="ts" setup>
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { ComponentPublicInstance } from 'vue'
import { ICON_NAME_BY_ALIAS } from '../foundation/app-icon.constants'
import ConversationThreadPanel from './conversation/conversation-thread-panel.vue'

type ChatThreadMessage = {
  id: string
  body: string
  createdAtLabel: string
  showCreatedAt?: boolean
  isOwn: boolean
  productReference?: {
    title: string
    imageUrl?: string
    priceLabel?: string
    statusLabel?: string
    href?: string
    external?: boolean
  }
}

const LOAD_OLDER_SCROLL_THRESHOLD_PX = 160
const STICK_TO_BOTTOM_THRESHOLD_PX = 160

const props = withDefaults(defineProps<{
  hasConversation: boolean
  loading?: boolean
  empty?: boolean
  emptyStateText?: string
  emptyMessagesText?: string
  messages: ChatThreadMessage[]
  modelValue: string
  sending?: boolean
  hasOlderMessages?: boolean
  loadingOlderMessages?: boolean
  textareaRows?: number
  textareaMaxRows?: number
  textareaClass?: string
  autofocusComposer?: boolean
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
  hasOlderMessages: false,
  loadingOlderMessages: false,
  textareaRows: 3,
  textareaMaxRows: 8,
  textareaClass: 'w-full',
  autofocusComposer: false,
  messageBubbleClass: 'rounded-xl px-4 py-1 shadow-sm',
  ownMessageBubbleClass: 'bg-primary text-white',
  incomingMessageBubbleClass: 'bg-surface text-text-strong',
  composerClass: 'bg-surface-muted px-6 py-4',
  listClass: 'scrollbar-subtle flex-1 overflow-y-auto bg-surface-muted px-6 py-5',
  sectionClass: 'flex min-h-[70vh] flex-col',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send' | 'loadOlderMessages'): void
}>()

const threadPanel = ref<InstanceType<typeof ConversationThreadPanel> | null>(null)
const composerField = ref<HTMLElement | null>(null)
const scrollElement = computed(() => threadPanel.value?.listEl ?? null)
const isNearBottom = ref(true)
const previousScrollHeight = ref(0)
const previousScrollTop = ref(0)
const previousFirstMessageId = ref<string | undefined>()
const previousLastMessageId = ref<string | undefined>()
const firstMessageId = computed(() => props.messages[0]?.id)
const lastMessageId = computed(() => props.messages.at(-1)?.id)

const messageDraft = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const isSendDisabled = computed(() => !props.modelValue.trim())

const rowVirtualizer = useVirtualizer(computed(() => ({
  count: props.messages.length,
  getScrollElement: () => scrollElement.value,
  estimateSize: () => 96,
  overscan: 8,
})))

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => rowVirtualizer.value.getTotalSize())

watch(
  () => props.messages.map(message => message.id),
  async () => {
    await nextTick()

    const scrollEl = scrollElement.value

    if (!scrollEl || props.messages.length === 0) {
      return
    }

    const prependedOlderMessages = previousFirstMessageId.value
      && previousFirstMessageId.value !== firstMessageId.value
      && previousLastMessageId.value === lastMessageId.value

    if (prependedOlderMessages) {
      scrollEl.scrollTop = previousScrollTop.value + (scrollEl.scrollHeight - previousScrollHeight.value)
    }
    else if (isNearBottom.value) {
      rowVirtualizer.value.scrollToIndex(props.messages.length - 1, { align: 'end' })
    }

    previousFirstMessageId.value = firstMessageId.value
    previousLastMessageId.value = lastMessageId.value
  },
  { immediate: true },
)

watch(
  () => [props.autofocusComposer, props.hasConversation] as const,
  async ([autofocusComposer, hasConversation]) => {
    if (!autofocusComposer || !hasConversation) {
      return
    }

    await nextTick()
    composerField.value?.querySelector('textarea')?.focus()
  },
  { immediate: true },
)

function handleListScroll(event: Event) {
  const target = event.currentTarget as HTMLElement
  const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight

  isNearBottom.value = distanceFromBottom < STICK_TO_BOTTOM_THRESHOLD_PX

  if (
    target.scrollTop > LOAD_OLDER_SCROLL_THRESHOLD_PX
    || !props.hasOlderMessages
    || props.loadingOlderMessages
  ) {
    return
  }

  previousScrollHeight.value = target.scrollHeight
  previousScrollTop.value = target.scrollTop
  previousFirstMessageId.value = firstMessageId.value
  previousLastMessageId.value = lastMessageId.value
  emit('loadOlderMessages')
}

function handleSend() {
  emit('send')
}

function measureElement(ref: Element | ComponentPublicInstance | null) {
  if (ref instanceof Element) {
    rowVirtualizer.value.measureElement(ref)
  }
}
</script>

<template>
  <ConversationThreadPanel
    ref="threadPanel"
    :has-conversation="hasConversation"
    :loading="loading"
    :empty="empty"
    :empty-state-text="emptyStateText"
    :empty-messages-text="emptyMessagesText"
    :composer-class="composerClass"
    :list-class="listClass"
    :section-class="sectionClass"
    @list-scroll="handleListScroll"
  >
    <template
      v-if="$slots.header"
      #header
    >
      <slot name="header" />
    </template>

    <template #default>
      <div
        v-if="loadingOlderMessages"
        class="sticky top-0 z-10 flex justify-center py-2"
      >
        <UBadge
          color="gray"
          variant="subtle"
          size="xs"
        >
          Loading older messages...
        </UBadge>
      </div>

      <div
        :style="{
          height: `${totalSize}px`,
          position: 'relative',
          width: '100%',
        }"
      >
        <div
          v-for="virtualRow in virtualRows"
          :key="messages[virtualRow.index]?.id"
          :ref="measureElement"
          :data-index="virtualRow.index"
          class="absolute left-0 top-0 w-full py-2"
          :style="{ transform: `translateY(${virtualRow.start}px)` }"
        >
          <div
            v-if="messages[virtualRow.index]"
            class="flex"
            :class="messages[virtualRow.index].isOwn ? 'justify-end' : 'justify-start'"
          >
            <div class="max-w-[75%]">
              <div
                v-if="messages[virtualRow.index].productReference"
                class="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-sm"
              >
                <div class="flex gap-3 p-3">
                  <div class="flex size-[70px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-customGray-200">
                    <img
                      v-if="messages[virtualRow.index].productReference?.imageUrl"
                      :src="messages[virtualRow.index].productReference?.imageUrl"
                      :alt="messages[virtualRow.index].productReference?.title"
                      class="size-full object-cover"
                    >
                    <AppIcon
                      v-else
                      name="product"
                      class="size-7"
                    />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-semibold text-text-strong">
                      {{ messages[virtualRow.index].productReference?.title }}
                    </div>
                    <div
                      v-if="messages[virtualRow.index].productReference?.priceLabel"
                      class="mt-1 text-sm font-medium text-text-strong"
                    >
                      {{ messages[virtualRow.index].productReference?.priceLabel }}
                    </div>
                    <div
                      v-if="messages[virtualRow.index].productReference?.statusLabel"
                      class="mt-1 text-xs text-text-muted"
                    >
                      {{ messages[virtualRow.index].productReference?.statusLabel }}
                    </div>
                    <a
                      v-if="messages[virtualRow.index].productReference?.href"
                      :href="messages[virtualRow.index].productReference?.href"
                      class="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
                      :target="messages[virtualRow.index].productReference?.external ? '_blank' : undefined"
                      :rel="messages[virtualRow.index].productReference?.external ? 'noopener noreferrer' : undefined"
                    >
                      View product
                    </a>
                  </div>
                </div>
              </div>

              <div
                v-else
                :class="[
                  messageBubbleClass,
                  messages[virtualRow.index].isOwn ? ownMessageBubbleClass : incomingMessageBubbleClass,
                ]"
              >
                <div class="whitespace-pre-wrap text-sm leading-6">
                  {{ messages[virtualRow.index].body }}
                </div>
              </div>
              <div
                v-if="messages[virtualRow.index].showCreatedAt !== false"
                class="mt-2 text-[11px]"
                :class="messages[virtualRow.index].isOwn ? 'text-right text-text-muted' : 'text-left text-text-muted'"
              >
                {{ messages[virtualRow.index].createdAtLabel }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #composer>
      <form @submit.prevent="handleSend">
        <div
          ref="composerField"
          class="relative"
        >
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
            :icon="ICON_NAME_BY_ALIAS['arrowUp']"
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
