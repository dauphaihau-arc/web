<script setup lang="ts">
import AppIcon from './app-icon.vue'

defineOptions({
  name: 'AppTimeline',
})

type TimelineItemState = 'completed' | 'current' | 'upcoming' | 'failed'

export type TimelineItem = {
  key: string
  title: string
  description: string
  meta?: string
  badge?: string
  icon: string
  state: TimelineItemState
}

const props = withDefaults(
  defineProps<{
    items: TimelineItem[]
    size?: 'md' | 'sm'
  }>(),
  {
    size: 'md',
  },
)

function stateClasses(state: TimelineItemState) {
  switch (state) {
    case 'current':
    case 'completed':
      return {
        dot: 'border-indigo-500 bg-indigo-500 text-white shadow-[0_12px_28px_rgba(79,70,229,0.24)]',
        line: 'bg-indigo-100',
        title: 'text-text-strong',
        body: 'text-text-muted',
      } as const
    case 'failed':
      return {
        dot: 'border-red-400 bg-red-400 text-white',
        line: 'bg-red-100',
        title: 'text-text-strong',
        body: 'text-text-muted',
      } as const
    case 'upcoming':
    default:
      return {
        dot: 'border-border-subtle bg-white text-text-muted',
        line: 'bg-border-subtle',
        title: 'text-text-muted',
        body: 'text-text-muted',
      } as const
  }
}

const sizeClasses = computed(() => {
  if (props.size === 'sm') {
    return {
      item: 'grid-cols-[3rem_minmax(0,1fr)_8rem] gap-x-3 gap-y-1 pb-6',
      line: 'left-[1.45rem] top-8 h-[calc(100%-1rem)]',
      iconWrap: 'pt-0.5',
      dot: 'size-6',
      title: 'text-sm',
      body: 'text-sm leading-6',
      meta: 'text-xs',
    } as const
  }

  return {
    item: 'grid-cols-[4rem_minmax(0,1fr)_12rem] gap-x-4 gap-y-1 pb-8',
    line: 'left-[1.95rem] top-9 h-[calc(100%-1.25rem)]',
    iconWrap: 'pt-1',
    dot: 'size-8',
    title: 'text-[1rem]',
    body: 'text-md leading-7',
    meta: 'text-[15px]',
  } as const
})
</script>

<template>
  <div class="space-y-0">
    <div
      v-for="(item, index) in items"
      :key="item.key"
      class="relative grid last:pb-0"
      :class="sizeClasses.item"
    >
      <div
        v-if="index < items.length - 1"
        class="absolute w-px"
        :class="[sizeClasses.line, stateClasses(item.state).line]"
      />

      <div
        class="relative z-10 flex justify-center"
        :class="sizeClasses.iconWrap"
      >
        <div
          class="flex items-center justify-center rounded-full border"
          :class="[sizeClasses.dot, stateClasses(item.state).dot]"
        >
          <AppIcon
            :name="item.icon"
            size="xs"
          />
        </div>
      </div>

      <div class="min-w-0">
        <div
          class="font-semibold leading-none"
          :class="[sizeClasses.title, stateClasses(item.state).title]"
        >
          {{ item.title }}
        </div>
        <div
          class="max-w-3xl"
          :class="[sizeClasses.body, stateClasses(item.state).body]"
        >
          {{ item.description }}
        </div>

        <div
          v-if="item.badge"
          class="mt-4"
        >
          <UBadge
            color="indigo"
            variant="soft"
            class="rounded-full px-3 py-1 text-xs font-medium"
          >
            {{ item.badge }}
          </UBadge>
        </div>
      </div>

      <div
        v-if="item.meta"
        class="pt-1 text-right text-sm"
        :class="[
          sizeClasses.meta,
          item.state === 'upcoming'
            ? 'text-text-muted'
            : 'text-text-subtle',
        ]"
      >
        {{ item.meta }}
      </div>
    </div>
  </div>
</template>
