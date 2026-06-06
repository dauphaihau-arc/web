<script setup lang="ts">
import type { ComputedRef, Ref } from 'vue'
import ShortcutHint from './shortcut-hint.vue'

defineOptions({
  inheritAttrs: false,
})

type DialogActionShortcut = 'escape' | 'enter' | 'meta_enter'

type DialogActionVariant = 'primary' | 'secondary' | 'danger'

type DialogActionConfig = {
  id: string
  label: string
  color?: string
  variant?: DialogActionVariant
  disabled?: boolean | Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  loading?: boolean | Ref<boolean> | ComputedRef<boolean> | (() => boolean)
  shortcut?: DialogActionShortcut
  allowWhileInputFocused?: boolean
  run: () => void | Promise<void>
}

type DialogUiConfig = {
  modal?: Record<string, string>
  card?: {
    body?: Record<string, string>
    header?: Record<string, string>
    footer?: Record<string, string>
  }
}

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  width?: string
  bodyClass?: string
  cardClass?: string
  actions?: DialogActionConfig[]
  actionsAlign?: 'start' | 'end' | 'between'
  actionsFullWidth?: boolean
  ui?: DialogUiConfig
}>(), {
  width: 'w-full sm:max-w-xl',
  bodyClass: 'min-h-0 flex-1 overflow-y-auto py-8 px-6',
  cardClass:
    'flex max-h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden rounded-dialog border border-border-subtle bg-surface text-text-strong',
  actions: () => [],
  actionsAlign: 'end',
  actionsFullWidth: false,
})

const attrs = useAttrs()
const slots = useSlots()

const modalUi = computed(() => ({
  inner: 'fixed inset-0 overflow-hidden',
  container: 'flex h-full items-center justify-center text-center',
  margin: 'sm:my-8',
  width: props.width,
  ...props.ui?.modal,
}))

const cardUi = computed(() => ({
  body: {
    base: 'flex min-h-0 flex-1 flex-col overflow-hidden',
    padding: '!py-0 !px-0 pb-0',
    ...props.ui?.card?.body,
  },
  header: {
    padding: 'px-6 py-5',
    ...props.ui?.card?.header,
  },
  footer: {
    padding: 'border-t border-border-subtle px-6 py-4',
    ...props.ui?.card?.footer,
  },
}))

const hasHeader = computed(() => Boolean(slots.header || props.title || props.description))
const hasFooter = computed(() => Boolean(slots.footer || props.actions.length))
const isDialogOpen = computed(() => attrs.modelValue === undefined || attrs.modelValue !== false)

function isElementInputLike(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable || target.closest('[contenteditable="true"]')) {
    return true
  }

  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function matchesShortcut(event: KeyboardEvent, shortcut: DialogActionShortcut) {
  switch (shortcut) {
    case 'escape':
      return event.key === 'Escape'
    case 'enter':
      return event.key === 'Enter'
        && !event.metaKey
        && !event.ctrlKey
        && !event.altKey
        && !event.shiftKey
    case 'meta_enter':
      return event.key === 'Enter' && (event.metaKey || event.ctrlKey)
  }
}

function getActionColor(action: DialogActionConfig) {
  if (action.color) {
    return action.color
  }

  switch (action.variant) {
    case 'secondary':
      return 'gray'
    case 'danger':
      return 'red'
    default:
      return undefined
  }
}

function getShortcutClass(action: DialogActionConfig) {
  const color = getActionColor(action)

  if (color === 'gray') {
    return 'neutral'
  }

  return 'inverted'
}

async function triggerAction(action: DialogActionConfig, event?: Event) {
  if (toValue(action.disabled) || toValue(action.loading)) {
    return
  }

  event?.preventDefault()
  await action.run()
}

function onWindowKeydown(event: KeyboardEvent) {
  if (!isDialogOpen.value || event.defaultPrevented || event.isComposing) {
    return
  }

  const action = props.actions.find((candidate) => {
    if (!candidate.shortcut || !matchesShortcut(event, candidate.shortcut)) {
      return false
    }

    if (toValue(candidate.disabled) || toValue(candidate.loading)) {
      return false
    }

    if (!candidate.allowWhileInputFocused && isElementInputLike(event.target)) {
      return false
    }

    return true
  })

  if (!action) {
    return
  }

  void triggerAction(action, event)
}

onMounted(() => {
  window.addEventListener('keydown', onWindowKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onWindowKeydown)
})
</script>

<template>
  <UModal
    v-bind="attrs"
    :ui="modalUi"
  >
    <UCard
      :class="cardClass"
      :ui="cardUi"
    >
      <template
        v-if="hasHeader"
        #header
      >
        <slot name="header">
          <div
            v-if="title || description"
            class="space-y-1.5"
          >
            <h1
              v-if="title"
              class="text-2xl font-bold"
            >
              {{ title }}
            </h1>
            <p
              v-if="description"
              class="text-sm leading-6 text-text-muted"
            >
              {{ description }}
            </p>
          </div>
        </slot>
      </template>

      <div :class="bodyClass">
        <slot />
      </div>

      <template
        v-if="hasFooter"
        #footer
      >
        <slot
          v-if="$slots.footer"
          name="footer"
        />

        <DialogActions
          v-else
          :align="actionsAlign"
          :full-width="actionsFullWidth"
        >
          <UButton
            v-for="action in actions"
            :key="action.id"
            type="button"
            :color="getActionColor(action)"
            :disabled="toValue(action.disabled)"
            :loading="toValue(action.loading)"
            @click="triggerAction(action, $event)"
          >
            <span>{{ action.label }}</span>
            <ShortcutHint
              v-if="action.shortcut"
              :keys="[action.shortcut]"
              :tone="getShortcutClass(action)"
            />
          </UButton>
        </DialogActions>
      </template>
    </UCard>
  </UModal>
</template>
