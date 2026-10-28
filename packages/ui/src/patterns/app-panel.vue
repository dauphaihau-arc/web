<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  as?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  tone?: 'default' | 'muted' | 'danger'
  rounded?: 'panel' | 'dialog'
  shadow?: 'none' | 'sm'
}>(), {
  as: 'div',
  padding: 'md',
  tone: 'default',
  rounded: 'panel',
  shadow: 'sm',
})

const attrs = useAttrs()

const paddingClass = computed(() => {
  switch (props.padding) {
    case 'none':
      return ''
    case 'sm':
      return 'p-4'
    case 'lg':
      return 'p-8'
    default:
      return 'p-5'
  }
})

const toneClass = computed(() => {
  switch (props.tone) {
    case 'muted':
      return 'border border-border-subtle bg-surface-muted text-text-subtle'
    case 'danger':
      return 'border border-state-danger-border bg-state-danger-surface text-state-danger-text'
    default:
      return 'border border-border-subtle bg-surface text-text-subtle'
  }
})

const roundedClass = computed(() => props.rounded === 'dialog' ? 'rounded-dialog' : 'rounded-panel')
const shadowClass = computed(() => props.shadow === 'none' ? '' : 'shadow-sm')
</script>

<template>
  <component
    :is="as"
    v-bind="attrs"
    :class="[roundedClass, toneClass, shadowClass, paddingClass, attrs.class]"
  >
    <slot />
  </component>
</template>
