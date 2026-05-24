<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

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
  ui?: DialogUiConfig
}>(), {
  width: 'w-full sm:max-w-xl',
  bodyClass: 'min-h-0 flex-1 overflow-y-auto py-8 px-6',
  cardClass: 'flex max-h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden',
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
    padding: 'p-4',
    ...props.ui?.card?.header,
  },
  footer: {
    padding: 'px-8 py-4',
    ...props.ui?.card?.footer,
  },
}))

const hasHeader = computed(() => Boolean(slots.header || props.title || props.description))
const hasFooter = computed(() => Boolean(slots.footer))
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
              class="text-sm leading-6 text-gray-600"
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
        <slot name="footer" />
      </template>
    </UCard>
  </UModal>
</template>
