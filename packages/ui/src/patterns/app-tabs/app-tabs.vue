<script setup lang="ts">
import { nextTick, useId } from 'vue'
import type { CSSProperties } from 'vue'
import AppIcon from '../../primitives/app-icon.vue'

defineOptions({
  name: 'AppTabs',
})

export type AppTabsVariant = 'pill' | 'link'

export type AppTabsSize = 'xs' | 'sm' | 'md'

export type AppTabsOrientation = 'horizontal' | 'vertical'

export type AppTabsItem = {
  label?: string
  value?: string | number
  icon?: string
  badge?: string | number
  disabled?: boolean

  /** Named slot used for the panel body when `content` is enabled. */
  slot?: string
}

const props = withDefaults(
  defineProps<{
    items: AppTabsItem[]
    variant?: AppTabsVariant
    size?: AppTabsSize
    content?: boolean
    modelValue?: string | number
    defaultValue?: string | number
    orientation?: AppTabsOrientation
    ariaLabel?: string
  }>(),
  {
    variant: 'pill',
    size: 'sm',
    content: false,
    orientation: 'horizontal',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'change': [value: string | number]
}>()

const isControlled = computed(() => props.modelValue !== undefined)

function itemValue(item: AppTabsItem, index: number): string | number {
  return item.value ?? String(index)
}

function firstEnabledValue(): string | number | undefined {
  const index = props.items.findIndex(item => !item.disabled)

  return index === -1 ? undefined : itemValue(props.items[index], index)
}

const internalValue = ref<string | number | undefined>(props.defaultValue ?? firstEnabledValue())

// Late-arriving items (async data) still get a sensible uncontrolled selection.
watch(
  () => [props.items, props.defaultValue] as const,
  () => {
    if (isControlled.value || internalValue.value !== undefined) {
      return
    }

    internalValue.value = props.defaultValue ?? firstEnabledValue()
  },
  { deep: false },
)

const activeValue = computed<string | number | undefined>(() => (
  isControlled.value ? props.modelValue : internalValue.value
))

const activeIndex = computed(() => {
  if (activeValue.value === undefined) {
    return -1
  }

  return props.items.findIndex((item, index) => itemValue(item, index) === activeValue.value)
})

const focusableIndex = computed(() => {
  const index = activeIndex.value

  if (index !== -1 && !props.items[index]?.disabled) {
    return index
  }

  return props.items.findIndex(item => !item.disabled)
})

// Suppress the slide-in on first paint: the class flips one frame after mount,
// so the indicator appears in place and only subsequent changes animate.
const hasMounted = ref(false)

let mountFrame: number | undefined

onMounted(() => {
  mountFrame = requestAnimationFrame(() => {
    hasMounted.value = true
  })
})

onBeforeUnmount(() => {
  if (mountFrame !== undefined) {
    cancelAnimationFrame(mountFrame)
  }
})

// Tabs size to their content, so the indicator is measured from the rendered
// active tab instead of assuming equal-width segments.
type IndicatorRect = { left: number, top: number, width: number, height: number }

const listRef = ref<HTMLElement | null>(null)
const indicatorRect = ref<IndicatorRect | null>(null)

function measureIndicator() {
  const tab = activeIndex.value === -1 ? undefined : tabRefs.value[activeIndex.value]

  if (!tab) {
    indicatorRect.value = null

    return
  }

  indicatorRect.value = {
    left: tab.offsetLeft,
    top: tab.offsetTop,
    width: tab.offsetWidth,
    height: tab.offsetHeight,
  }
}

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  void nextTick(() => {
    measureIndicator()
    resizeObserver = new ResizeObserver(() => measureIndicator())

    if (listRef.value) {
      resizeObserver.observe(listRef.value)
    }
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(
  () => [activeIndex.value, props.items] as const,
  () => {
    void nextTick(measureIndicator)
  },
  { deep: true, flush: 'post' },
)

const indicatorStyle = computed<CSSProperties>(() => {
  if (!indicatorRect.value) {
    return { display: 'none' }
  }

  const { left, top, width, height } = indicatorRect.value

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  }
})

const indicatorClass = computed(() => [
  'pointer-events-none absolute rounded-md bg-primary-500 shadow-sm',
  hasMounted.value
    ? 'transition-all duration-200 ease-out motion-reduce:transition-none'
    : 'transition-none',
])

const uid = useId()

function tabId(index: number): string {
  return `${uid}-tab-${index}`
}

function panelId(index: number): string {
  return `${uid}-panel-${index}`
}

function panelSlotName(item: AppTabsItem, index: number): string {
  return String(item.slot ?? item.value ?? index)
}

function isActive(index: number): boolean {
  return index === activeIndex.value
}

const tabRefs = ref<Array<HTMLButtonElement | null>>([])

function setTabRef(index: number, el: unknown) {
  tabRefs.value[index] = el instanceof HTMLButtonElement ? el : null
}

function selectItem(index: number, focus = false) {
  const item = props.items[index]

  if (!item || item.disabled) {
    return
  }

  const value = itemValue(item, index)

  if (!isControlled.value) {
    internalValue.value = value
  }

  emit('update:modelValue', value)
  emit('change', value)

  if (focus) {
    void nextTick(() => tabRefs.value[index]?.focus())
  }
}

function enabledIndexes(): number[] {
  return props.items.reduce<number[]>((indexes, item, index) => {
    if (!item.disabled) {
      indexes.push(index)
    }

    return indexes
  }, [])
}

function moveFocus(fromIndex: number, step: 1 | -1) {
  const enabled = enabledIndexes()

  if (enabled.length === 0) {
    return
  }

  const position = enabled.indexOf(fromIndex)
  const nextPosition = position === -1
    ? (step === 1 ? 0 : enabled.length - 1)
    : (position + step + enabled.length) % enabled.length

  selectItem(enabled[nextPosition], true)
}

function focusEdge(edge: 'start' | 'end') {
  const enabled = enabledIndexes()

  if (enabled.length === 0) {
    return
  }

  selectItem(edge === 'start' ? enabled[0] : enabled[enabled.length - 1], true)
}

function onTabKeydown(event: KeyboardEvent, index: number) {
  const isVertical = props.orientation === 'vertical'
  const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
  const previousKey = isVertical ? 'ArrowUp' : 'ArrowLeft'

  if (event.key === nextKey) {
    event.preventDefault()
    moveFocus(index, 1)

    return
  }

  if (event.key === previousKey) {
    event.preventDefault()
    moveFocus(index, -1)

    return
  }

  if (event.key === 'Home') {
    event.preventDefault()
    focusEdge('start')

    return
  }

  if (event.key === 'End') {
    event.preventDefault()
    focusEdge('end')
  }
}

const listClass = computed(() => {
  const isVertical = props.orientation === 'vertical'
  const direction = isVertical ? 'flex-col' : 'flex-row'
  const display = isVertical ? 'flex w-full' : 'inline-flex'

  if (props.variant === 'pill') {
    return ['relative rounded-lg bg-surface-muted p-1', display, direction]
  }

  return [display, direction]
})

const sizeClasses: Record<AppTabsSize, string> = {
  xs: 'px-2 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
}

// Content-sized tabs collapse around short labels (All, Paid), which reads as
// ragged columns next to longer ones. A width floor keeps every pill in the
// track optically comparable without stretching the track itself.
const pillMinWidthClasses: Record<AppTabsSize, string> = {
  xs: 'min-w-16',
  sm: 'min-w-28',
  md: 'min-w-32',
}

const iconSizes: Record<AppTabsSize, 'xs' | 'sm'> = {
  xs: 'xs',
  sm: 'xs',
  md: 'sm',
}

const iconSize = computed(() => iconSizes[props.size])

function tabClass(index: number): string[] {
  const isVertical = props.orientation === 'vertical'
  const active = isActive(index)

  const classes = [
    'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
    sizeClasses[props.size],
  ]

  if (isVertical) {
    classes.push('w-full justify-start')
  }

  if (props.variant === 'pill') {
    classes.push(
      'z-10 rounded-md',
      pillMinWidthClasses[props.size],
      active
        ? 'text-white shadow-none'
        : 'text-text-subtle hover:text-text-strong',
    )

    return classes
  }

  classes.push(
    isVertical ? 'border-l-2' : 'border-b-2',
    active
      ? 'border-primary-500 text-text-strong'
      : 'border-border-subtle text-text-subtle hover:text-text-strong',
  )

  return classes
}

// A badge must stay visible on both the muted pill track and the selected
// (primary) pill, so the background flips with selection instead of using a
// single surface that matches one of them.
function badgeClass(index: number): string[] {
  return [
    'inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold leading-none text-text-subtle tabular-nums',
    isActive(index) ? 'bg-surface' : 'bg-surface-control',
  ]
}
</script>

<template>
  <div class="w-full">
    <div
      ref="listRef"
      role="tablist"
      :aria-orientation="orientation"
      :aria-label="ariaLabel"
      :class="listClass"
    >
      <span
        v-if="variant === 'pill' && activeIndex !== -1"
        aria-hidden="true"
        :class="indicatorClass"
        :style="indicatorStyle"
      />

      <button
        v-for="(item, index) in items"
        :id="tabId(index)"
        :key="`${itemValue(item, index)}`"
        :ref="(el) => setTabRef(index, el)"
        type="button"
        role="tab"
        :aria-selected="isActive(index)"
        :aria-controls="content && isActive(index) ? panelId(index) : undefined"
        :tabindex="index === focusableIndex ? 0 : -1"
        :disabled="item.disabled"
        :class="tabClass(index)"
        @click="selectItem(index)"
        @keydown="onTabKeydown($event, index)"
      >
        <AppIcon
          v-if="item.icon"
          :name="item.icon"
          :size="iconSize"
        />

        <span v-if="item.label">{{ item.label }}</span>

        <span
          v-if="item.badge !== undefined && item.badge !== ''"
          :class="badgeClass(index)"
        >
          {{ item.badge }}
        </span>
      </button>
    </div>

    <template v-if="content">
      <template
        v-for="(item, index) in items"
        :key="`panel-${itemValue(item, index)}`"
      >
        <div
          v-if="isActive(index)"
          :id="panelId(index)"
          role="tabpanel"
          :aria-labelledby="tabId(index)"
          tabindex="0"
          class="mt-3 outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <slot :name="panelSlotName(item, index)" />
        </div>
      </template>
    </template>
  </div>
</template>
