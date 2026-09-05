<script setup lang="ts" generic="TItem extends StepperItem = StepperItem">
import AppIcon from './app-icon.vue'
import type {
  StepperColor,
  StepperItem,
  StepperItemState,
  StepperItemValue,
  StepperOrientation,
  StepperSize,
  StepperSlotName,
  StepperSlotProps,
} from './stepper.types'

defineOptions({
  name: 'AppStepper',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  items: TItem[]
  as?: string
  size?: StepperSize
  color?: StepperColor
  orientation?: StepperOrientation
  valueKey?: string
  defaultValue?: StepperItemValue
  disabled?: boolean
  linear?: boolean
  ui?: Partial<Record<StepperSlotName, unknown>>
}>(), {
  as: 'div',
  size: 'md',
  color: 'primary',
  orientation: 'horizontal',
  valueKey: 'value',
  defaultValue: undefined,
  disabled: false,
  linear: true,
})

const emit = defineEmits<{
  next: [value: TItem]
  prev: [value: TItem]
}>()

const attrs = useAttrs()
const slots = useSlots()
const modelValue = defineModel<StepperItemValue>()
const uncontrolledValue = ref<StepperItemValue | undefined>(props.defaultValue)
const furthestVisitedIndex = ref(0)

const sizeClassByVariant = {
  xs: {
    trigger: 'size-6 text-xs',
    icon: 'size-3',
    title: 'text-xs',
    description: 'text-xs',
    wrapperHorizontal: 'mt-1.5',
    wrapperVertical: 'pt-0.5',
    verticalGap: 'gap-1.5',
    separatorHorizontal: 'start-[calc(50%+16px)] end-[calc(-50%+16px)]',
    separatorVertical: 'start-3 top-8 -bottom-2.5',
  },
  sm: {
    trigger: 'size-8 text-sm',
    icon: 'size-4',
    title: 'text-xs',
    description: 'text-xs',
    wrapperHorizontal: 'mt-2',
    wrapperVertical: 'pt-1',
    verticalGap: 'gap-2',
    separatorHorizontal: 'start-[calc(50%+20px)] end-[calc(-50%+20px)]',
    separatorVertical: 'start-4 top-10 -bottom-3',
  },
  md: {
    trigger: 'size-10 text-base',
    icon: 'size-5',
    title: 'text-sm',
    description: 'text-sm',
    wrapperHorizontal: 'mt-2.5',
    wrapperVertical: 'pt-1.5',
    verticalGap: 'gap-2.5',
    separatorHorizontal: 'start-[calc(50%+28px)] end-[calc(-50%+28px)]',
    separatorVertical: 'start-5 top-12 -bottom-3',
  },
  lg: {
    trigger: 'size-12 text-lg',
    icon: 'size-6',
    title: 'text-base',
    description: 'text-base',
    wrapperHorizontal: 'mt-3',
    wrapperVertical: 'pt-2',
    verticalGap: 'gap-3',
    separatorHorizontal: 'start-[calc(50%+32px)] end-[calc(-50%+32px)]',
    separatorVertical: 'start-6 top-14 -bottom-3.5',
  },
  xl: {
    trigger: 'size-14 text-xl',
    icon: 'size-7',
    title: 'text-lg',
    description: 'text-lg',
    wrapperHorizontal: 'mt-3.5',
    wrapperVertical: 'pt-2.5',
    verticalGap: 'gap-3.5',
    separatorHorizontal: 'start-[calc(50%+36px)] end-[calc(-50%+36px)]',
    separatorVertical: 'start-7 top-16 -bottom-4',
  },
} as const satisfies Record<StepperSize, Record<string, string>>

const colorClassByVariant = {
  primary: {
    active: 'border-indigo-600 bg-indigo-600 text-white outline-indigo-600/20',
    completed: 'border-indigo-600 bg-indigo-600 text-white',
    separator: 'bg-indigo-600',
  },
  secondary: {
    active: 'border-purple-600 bg-purple-600 text-white outline-purple-600/20',
    completed: 'border-purple-600 bg-purple-600 text-white',
    separator: 'bg-purple-600',
  },
  success: {
    active: 'border-emerald-600 bg-emerald-600 text-white outline-emerald-600/20',
    completed: 'border-emerald-600 bg-emerald-600 text-white',
    separator: 'bg-emerald-600',
  },
  info: {
    active: 'border-sky-600 bg-sky-600 text-white outline-sky-600/20',
    completed: 'border-sky-600 bg-sky-600 text-white',
    separator: 'bg-sky-600',
  },
  warning: {
    active: 'border-amber-500 bg-amber-500 text-white outline-amber-500/20',
    completed: 'border-amber-500 bg-amber-500 text-white',
    separator: 'bg-amber-500',
  },
  error: {
    active: 'border-red-600 bg-red-600 text-white outline-red-600/20',
    completed: 'border-red-600 bg-red-600 text-white',
    separator: 'bg-red-600',
  },
  neutral: {
    active: 'border-text-strong bg-text-strong text-white outline-text-strong/20',
    completed: 'border-text-strong bg-text-strong text-white',
    separator: 'bg-text-strong',
  },
} as const satisfies Record<StepperColor, Record<string, string>>

const forwardedAttrs = computed(() => {
  const { class: _class, ...restAttrs } = attrs
  return restAttrs
})

const activeValue = computed(() => modelValue.value ?? uncontrolledValue.value)

const activeIndex = computed(() => {
  const index = props.items.findIndex((item, itemIndex) => getItemValue(item, itemIndex) === activeValue.value)
  return index === -1 ? 0 : index
})

const hasPrev = computed(() => activeIndex.value > 0)
const hasNext = computed(() => activeIndex.value < props.items.length - 1)

const rootClasses = computed(() => {
  return props.orientation === 'horizontal'
    ? ['flex flex-col gap-4', props.ui?.root, attrs.class]
    : ['flex gap-4', props.ui?.root, attrs.class]
})

const headerClasses = computed(() => {
  return props.orientation === 'horizontal'
    ? ['flex w-full', props.ui?.header]
    : ['flex flex-col gap-4', props.ui?.header]
})

watch(activeIndex, (index) => {
  if (index > furthestVisitedIndex.value) {
    furthestVisitedIndex.value = index
  }
}, { immediate: true })

function getPathValue(source: unknown, path: string) {
  if (!source || typeof source !== 'object') {
    return undefined
  }

  return path.split('.').reduce<unknown>((value, segment) => {
    if (!value || typeof value !== 'object') {
      return undefined
    }

    return (value as Record<string, unknown>)[segment]
  }, source)
}

function getItemValue(item: TItem, index: number): StepperItemValue {
  const value = getPathValue(item, props.valueKey)

  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }

  return index
}

function getItemState(index: number): StepperItemState {
  if (index < activeIndex.value) {
    return 'completed'
  }

  if (index === activeIndex.value) {
    return 'active'
  }

  return 'upcoming'
}

function isItemDisabled(item: TItem, index: number) {
  return Boolean(props.disabled || item.disabled || (props.linear && index > furthestVisitedIndex.value + 1))
}

function getSlotProps(item: TItem, index: number): StepperSlotProps<TItem> {
  const state = getItemState(index)

  return {
    item,
    index,
    value: getItemValue(item, index),
    state,
    active: state === 'active',
    completed: state === 'completed',
    disabled: isItemDisabled(item, index),
  }
}

function getIndicatorClasses(item: TItem, index: number) {
  const state = getItemState(index)
  const colorClasses = colorClassByVariant[props.color]

  return [
    'rounded-full border font-semibold leading-none transition-colors focus-visible:outline focus-visible:outline-4',
    'flex items-center justify-center',
    sizeClassByVariant[props.size].trigger,
    state === 'active' && colorClasses.active,
    state === 'completed' && colorClasses.completed,
    state === 'upcoming' && 'border-border-subtle bg-white text-text-muted',
    isItemDisabled(item, index) && 'cursor-not-allowed opacity-60',
    props.ui?.indicator,
    item.ui?.indicator,
  ]
}

function getSeparatorClasses(index: number) {
  const isCompleted = index < activeIndex.value

  return [
    'absolute rounded-full transition-colors',
    props.orientation === 'horizontal'
      ? ['top-5 h-0.5', sizeClassByVariant[props.size].separatorHorizontal]
      : ['w-0.5', sizeClassByVariant[props.size].separatorVertical],
    isCompleted ? colorClassByVariant[props.color].separator : 'bg-border-subtle',
    props.disabled && 'opacity-60',
    props.ui?.separator,
    props.items[index]?.ui?.separator,
  ]
}

function selectItem(item: TItem, index: number) {
  if (isItemDisabled(item, index)) {
    return
  }

  const nextValue = getItemValue(item, index)
  uncontrolledValue.value = nextValue
  modelValue.value = nextValue
}

function next() {
  if (!hasNext.value) {
    return
  }

  const item = props.items[activeIndex.value + 1]

  if (!item) {
    return
  }

  selectItem(item, activeIndex.value + 1)
  emit('next', item)
}

function prev() {
  if (!hasPrev.value) {
    return
  }

  const item = props.items[activeIndex.value - 1]

  if (!item) {
    return
  }

  selectItem(item, activeIndex.value - 1)
  emit('prev', item)
}

defineExpose({
  next,
  prev,
  hasNext,
  hasPrev,
})
</script>

<template>
  <component
    :is="as"
    v-bind="forwardedAttrs"
    :class="rootClasses"
  >
    <div :class="headerClasses">
      <div
        v-for="(item, index) in items"
        :key="getItemValue(item, index)"
        :data-state="getItemState(index)"
        :data-disabled="isItemDisabled(item, index) || undefined"
        :class="[
          orientation === 'horizontal'
            ? 'group relative w-full text-center'
            : ['group relative flex text-start', sizeClassByVariant[size].verticalGap],
          props.ui?.item,
          item.ui?.item,
          item.class,
        ]"
      >
        <div
          :class="[
            orientation === 'horizontal' ? 'relative flex justify-center' : 'relative shrink-0',
            props.ui?.container,
            item.ui?.container,
          ]"
        >
          <button
            type="button"
            :disabled="isItemDisabled(item, index)"
            :aria-current="getItemState(index) === 'active' ? 'step' : undefined"
            :class="[
              'relative z-10 align-middle',
              props.ui?.trigger,
              item.ui?.trigger,
            ]"
            @click="selectItem(item, index)"
          >
            <span :class="getIndicatorClasses(item, index)">
              <slot
                name="indicator"
                v-bind="getSlotProps(item, index)"
              >
                <AppIcon
                  v-if="item.icon"
                  :name="item.icon"
                  :class="[
                    sizeClassByVariant[size].icon,
                    props.ui?.icon,
                    item.ui?.icon,
                  ]"
                />
                <span v-else>{{ index + 1 }}</span>
              </slot>
            </span>
          </button>

          <span
            v-if="index < items.length - 1"
            aria-hidden="true"
            :class="getSeparatorClasses(index)"
          />
        </div>

        <div
          :class="[
            orientation === 'horizontal'
              ? sizeClassByVariant[size].wrapperHorizontal
              : sizeClassByVariant[size].wrapperVertical,
            props.ui?.wrapper,
            item.ui?.wrapper,
          ]"
        >
          <slot
            name="wrapper"
            v-bind="getSlotProps(item, index)"
          >
            <div
              v-if="item.title || slots.title"
              :class="[
                'font-medium',
                getItemState(index) === 'upcoming' ? 'text-text-muted' : 'text-text-strong',
                sizeClassByVariant[size].title,
                props.ui?.title,
                item.ui?.title,
              ]"
            >
              <slot
                name="title"
                v-bind="getSlotProps(item, index)"
              >
                {{ item.title }}
              </slot>
            </div>

            <div
              v-if="item.description || slots.description"
              :class="[
                'text-text-muted text-wrap',
                sizeClassByVariant[size].description,
                props.ui?.description,
                item.ui?.description,
              ]"
            >
              <slot
                name="description"
                v-bind="getSlotProps(item, index)"
              >
                {{ item.description }}
              </slot>
            </div>
          </slot>
        </div>
      </div>
    </div>

    <div
      v-if="items[activeIndex]?.content || slots.content || items[activeIndex]?.slot"
      :class="['size-full', props.ui?.content]"
    >
      <slot
        :name="items[activeIndex]?.slot || 'content'"
        v-bind="getSlotProps(items[activeIndex], activeIndex)"
      >
        {{ items[activeIndex]?.content }}
      </slot>
    </div>
  </component>
</template>
