<script setup lang="ts">
import AppIcon from '../primitives/app-icon.vue'

defineOptions({
  name: 'AppTimeline',
})

export type TimelineItemState = 'completed' | 'active' | 'pending' | 'failed'

export type TimelineOrientation = 'horizontal' | 'vertical'

export type TimelineColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export type TimelineSize = 'sm' | 'md'

export type TimelineItem = {
  key?: string
  date?: string
  title: string
  description?: string
  icon?: string
  value?: string | number
  state?: TimelineItemState
  badge?: string
}

type TimelineUiSlot = 'root' | 'item' | 'indicator' | 'separator' | 'wrapper' | 'date' | 'title' | 'description'

type ReachedColorClasses = {
  indicator: string
  separator: string
  ring: string
}

const props = withDefaults(
  defineProps<{
    items: TimelineItem[]
    orientation?: TimelineOrientation
    color?: TimelineColor
    size?: TimelineSize
    defaultValue?: string | number
    valueKey?: string
    reverse?: boolean
    ui?: Partial<Record<TimelineUiSlot, string>>
    ariaLabel?: string
  }>(),
  {
    orientation: 'vertical',
    color: 'primary',
    size: 'md',
    valueKey: 'value',
    reverse: false,
    ariaLabel: 'Timeline',
  },
)

/**
 * v4 semantics: one reached hue colors both completed and active indicators
 * (plus the separator leaving a completed/active item). Pending stays neutral;
 * failed is the repo extension with the danger palette.
 */
const reachedColorClasses: Record<TimelineColor, ReachedColorClasses> = {
  primary: {
    indicator: 'border-transparent bg-primary text-white',
    separator: 'bg-primary',
    ring: 'ring-2 ring-primary/25',
  },
  secondary: {
    indicator: 'border-transparent bg-text-subtle text-white',
    separator: 'bg-text-subtle',
    ring: 'ring-2 ring-text-subtle/25',
  },
  success: {
    indicator: 'border-transparent bg-emerald-500 text-white',
    separator: 'bg-emerald-500',
    ring: 'ring-2 ring-emerald-500/25',
  },
  info: {
    indicator: 'border-transparent bg-state-info-text text-white',
    separator: 'bg-state-info-text',
    ring: 'ring-2 ring-state-info-text/25',
  },
  warning: {
    indicator: 'border-transparent bg-amber-500 text-white',
    separator: 'bg-amber-500',
    ring: 'ring-2 ring-amber-500/25',
  },
  error: {
    indicator: 'border-transparent bg-red-500 text-white',
    separator: 'bg-red-500',
    ring: 'ring-2 ring-red-500/25',
  },
  neutral: {
    indicator: 'border-transparent bg-text-strong text-white',
    separator: 'bg-text-strong',
    ring: 'ring-2 ring-text-strong/25',
  },
}

type ResolvedTimelineItem = {
  item: TimelineItem
  index: number
  state: TimelineItemState
}

function itemValue(item: TimelineItem): unknown {
  return (item as TimelineItem & Record<string, unknown>)[props.valueKey]
}

const activeIndex = computed(() => {
  if (props.defaultValue === undefined || props.defaultValue === null) {
    return -1
  }

  const matched = props.items.findIndex(item => itemValue(item) === props.defaultValue)

  if (matched !== -1) {
    return matched
  }

  if (
    typeof props.defaultValue === 'number'
    && Number.isInteger(props.defaultValue)
    && props.defaultValue >= 0
    && props.defaultValue < props.items.length
  ) {
    return props.defaultValue
  }

  return -1
})

function derivedState(index: number): TimelineItemState {
  if (activeIndex.value === -1) {
    return 'pending'
  }

  if (index < activeIndex.value) {
    return 'completed'
  }

  return index === activeIndex.value ? 'active' : 'pending'
}

const resolvedItems = computed<ResolvedTimelineItem[]>(() => {
  const items = props.items.map((item, index) => ({
    item,
    index,
    state: item.state ?? derivedState(index),
  }))

  return props.reverse ? [...items].reverse() : items
})

const isHorizontal = computed(() => props.orientation === 'horizontal')

function indicatorClasses(state: TimelineItemState) {
  switch (state) {
    case 'completed':
      return reachedColorClasses[props.color].indicator
    case 'active':
      return `${reachedColorClasses[props.color].indicator} ${reachedColorClasses[props.color].ring}`
    case 'failed':
      return 'border-red-400 bg-red-400 text-white'
    case 'pending':
    default:
      return 'border-border-subtle bg-surface text-text-muted'
  }
}

function separatorClasses(state: TimelineItemState) {
  switch (state) {
    case 'completed':
    case 'active':
      return reachedColorClasses[props.color].separator
    case 'failed':
      return 'bg-red-400'
    case 'pending':
    default:
      return 'bg-border-subtle'
  }
}

function titleClasses(state: TimelineItemState) {
  switch (state) {
    case 'completed':
      return 'text-text-strong'
    case 'active':
      return 'font-semibold text-text-strong'
    case 'failed':
      return 'text-state-danger-text'
    case 'pending':
    default:
      return 'text-text-muted'
  }
}

function horizontalDescriptionClasses(state: TimelineItemState) {
  switch (state) {
    case 'active':
      return 'text-state-warning-text'
    case 'failed':
      return 'text-state-danger-text'
    case 'completed':
    case 'pending':
    default:
      return 'text-text-muted'
  }
}

function verticalDateClasses(state: TimelineItemState) {
  return state === 'pending' ? 'text-text-muted' : 'text-text-subtle'
}

function indicatorIcon(item: TimelineItem, state: TimelineItemState) {
  if (item.icon) {
    return item.icon
  }

  return state === 'completed' ? 'check' : undefined
}

const verticalSizeClasses = computed(() => {
  if (props.size === 'sm') {
    return {
      item: 'grid-cols-[3rem_minmax(0,1fr)_8rem] gap-x-3 gap-y-1 pb-6',
      line: 'left-[1.45rem] top-8 h-[calc(100%-1rem)]',
      indicatorWrap: 'pt-0.5',
      indicator: 'size-6',
      title: 'text-sm',
      body: 'text-sm leading-6',
      date: 'text-xs',
    } as const
  }

  return {
    item: 'grid-cols-[4rem_minmax(0,1fr)_12rem] gap-x-4 gap-y-1 pb-8',
    line: 'left-[1.95rem] top-9 h-[calc(100%-1.25rem)]',
    indicatorWrap: 'pt-1',
    indicator: 'size-8',
    title: 'text-[1rem]',
    body: 'text-md leading-7',
    date: 'text-[15px]',
  } as const
})

const horizontalSizeClasses = computed(() => {
  if (props.size === 'sm') {
    return {
      item: 'px-2',
      connector: 'top-4',
      indicator: 'size-8',
      icon: 'xs',
    } as const
  }

  return {
    item: 'px-2',
    connector: 'top-5',
    indicator: 'size-10',
    icon: 'sm',
  } as const
})
</script>

<template>
  <div
    v-if="isHorizontal"
    role="group"
    :aria-label="ariaLabel"
    class="w-full overflow-x-auto"
    :class="ui?.root"
  >
    <ol class="flex min-w-[36rem] items-start gap-1.5">
      <li
        v-for="(entry, index) in resolvedItems"
        :key="entry.item.key ?? entry.index"
        :aria-current="entry.state === 'active' ? 'step' : undefined"
        class="relative flex min-w-0 flex-1 flex-col items-center text-center"
        :class="[horizontalSizeClasses.item, ui?.item]"
      >
        <div
          v-if="index < resolvedItems.length - 1"
          class="absolute left-1/2 h-0.5 w-full -translate-y-1/2"
          :class="[horizontalSizeClasses.connector, separatorClasses(entry.state), ui?.separator]"
          aria-hidden="true"
        />

        <slot
          name="indicator"
          :item="entry.item"
          :index="index"
          :state="entry.state"
        >
          <span
            class="relative z-10 flex shrink-0 items-center justify-center rounded-full border"
            :class="[horizontalSizeClasses.indicator, indicatorClasses(entry.state), ui?.indicator]"
          >
            <AppIcon
              v-if="indicatorIcon(entry.item, entry.state)"
              :name="indicatorIcon(entry.item, entry.state)!"
              :size="horizontalSizeClasses.icon"
            />
          </span>
        </slot>

        <div
          class="mt-3 w-full min-w-0"
          :class="ui?.wrapper"
        >
          <slot
            name="title"
            :item="entry.item"
            :index="index"
            :state="entry.state"
          >
            <div
              class="text-sm leading-5"
              :class="[titleClasses(entry.state), ui?.title]"
            >
              {{ entry.item.title }}
            </div>
          </slot>

          <slot
            name="date"
            :item="entry.item"
            :index="index"
            :state="entry.state"
          >
            <div
              v-if="entry.item.date"
              class="mt-1 text-xs text-text-muted"
              :class="ui?.date"
            >
              {{ entry.item.date }}
            </div>
          </slot>

          <slot
            name="description"
            :item="entry.item"
            :index="index"
            :state="entry.state"
          >
            <div
              v-if="entry.item.description"
              class="mt-1 text-xs"
              :class="[horizontalDescriptionClasses(entry.state), ui?.description]"
            >
              {{ entry.item.description }}
            </div>
          </slot>

          <div
            v-if="entry.item.badge"
            class="mt-2"
          >
            <UBadge
              color="indigo"
              variant="soft"
              class="rounded-full px-3 py-1 text-xs font-medium"
            >
              {{ entry.item.badge }}
            </UBadge>
          </div>
        </div>
      </li>
    </ol>
  </div>

  <div
    v-else
    role="group"
    :aria-label="ariaLabel"
    :class="ui?.root"
  >
    <ol class="flex flex-col">
      <li
        v-for="(entry, index) in resolvedItems"
        :key="entry.item.key ?? entry.index"
        :aria-current="entry.state === 'active' ? 'step' : undefined"
        class="relative grid last:pb-0"
        :class="[verticalSizeClasses.item, ui?.item]"
      >
        <div
          v-if="index < resolvedItems.length - 1"
          class="absolute w-px"
          :class="[verticalSizeClasses.line, separatorClasses(entry.state), ui?.separator]"
          aria-hidden="true"
        />

        <slot
          name="indicator"
          :item="entry.item"
          :index="index"
          :state="entry.state"
        >
          <div
            class="relative z-10 flex justify-center"
            :class="verticalSizeClasses.indicatorWrap"
          >
            <div
              class="flex items-center justify-center rounded-full border"
              :class="[verticalSizeClasses.indicator, indicatorClasses(entry.state), ui?.indicator]"
            >
              <AppIcon
                v-if="indicatorIcon(entry.item, entry.state)"
                :name="indicatorIcon(entry.item, entry.state)!"
                size="xs"
              />
            </div>
          </div>
        </slot>

        <div
          class="min-w-0"
          :class="ui?.wrapper"
        >
          <slot
            name="title"
            :item="entry.item"
            :index="index"
            :state="entry.state"
          >
            <div
              class="font-semibold leading-none"
              :class="[verticalSizeClasses.title, titleClasses(entry.state), ui?.title]"
            >
              {{ entry.item.title }}
            </div>
          </slot>

          <slot
            name="description"
            :item="entry.item"
            :index="index"
            :state="entry.state"
          >
            <div
              v-if="entry.item.description"
              class="max-w-3xl text-text-muted"
              :class="[verticalSizeClasses.body, ui?.description]"
            >
              {{ entry.item.description }}
            </div>
          </slot>

          <div
            v-if="entry.item.badge"
            class="mt-4"
          >
            <UBadge
              color="indigo"
              variant="soft"
              class="rounded-full px-3 py-1 text-xs font-medium"
            >
              {{ entry.item.badge }}
            </UBadge>
          </div>
        </div>

        <slot
          name="date"
          :item="entry.item"
          :index="index"
          :state="entry.state"
        >
          <div
            v-if="entry.item.date"
            class="pt-1 text-right"
            :class="[verticalSizeClasses.date, verticalDateClasses(entry.state), ui?.date]"
          >
            {{ entry.item.date }}
          </div>
        </slot>
      </li>
    </ol>
  </div>
</template>
