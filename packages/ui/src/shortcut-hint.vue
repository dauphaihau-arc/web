<script setup lang="ts">
const { metaSymbol } = useShortcuts()

const props = withDefaults(defineProps<{
  keys: string[]
  tone?: 'neutral' | 'inverted' | 'overlay'
  separator?: 'plus' | 'none'
  size?: 'xs' | 'sm' | 'md'
}>(), {
  tone: 'neutral',
  separator: 'plus',
  size: 'sm',
})

const normalizedKeys = computed(() => props.keys.flatMap((key) => {
  if (key !== 'meta_enter') {
    return [key]
  }

  return [metaSymbol.value, 'Enter']
}))

const baseClass = computed(() => {
  if (props.tone === 'inverted') {
    return 'border-white/15 bg-white/20 text-white'
  }

  if (props.tone === 'overlay') {
    return 'border-transparent bg-white/20 text-inherit'
  }

  return 'border-transparent bg-surface-keycap text-text-subtle'
})

const separatorToneClass = computed(() => {
  if (props.tone === 'inverted') {
    return 'text-white/80'
  }

  if (props.tone === 'overlay') {
    return 'text-inherit opacity-80'
  }

  return 'text-text-muted'
})

const containerClass = computed(() =>
  props.size === 'md' ? 'gap-2' : props.size === 'xs' ? 'gap-1' : 'gap-1.5',
)

const keyClass = computed(() =>
  props.size === 'md'
    ? 'rounded-md border px-2.5 py-1 text-sm font-medium'
    : props.size === 'xs'
      ? 'rounded-sm border px-1.5 py-px text-[10px] font-medium'
      : 'rounded-md border px-1.5 py-0.5 text-xs font-medium',
)

const separatorClass = computed(() =>
  props.size === 'md'
    ? 'text-sm font-medium'
    : props.size === 'xs'
      ? 'text-[10px] font-medium'
      : 'text-xs font-medium',
)
</script>

<template>
  <span
    :class="containerClass"
    class="inline-flex items-center"
  >
    <template
      v-for="(key, index) in normalizedKeys"
      :key="`${key}-${index}`"
    >
      <span
        :class="[baseClass, keyClass]"
      >
        {{ key === 'escape' ? 'Esc' : key }}
      </span>
      <span
        v-if="props.separator === 'plus' && index < normalizedKeys.length - 1"
        :class="[separatorToneClass, separatorClass]"
      >
        +
      </span>
    </template>
  </span>
</template>
