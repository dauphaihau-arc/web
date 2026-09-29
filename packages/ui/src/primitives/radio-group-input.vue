<script
    setup lang="ts"
    generic="
    TValue extends string | number | boolean,
    TOption extends TValue | Record<string, any>
"
>
import RadioInput from './radio-input.vue'

const props = defineProps<{
  options: TOption[]
  disabled?: boolean
  valueAttribute?: keyof TOption
  optionAttribute?: keyof TOption
  row?: boolean
  direction?: 'horizontal' | 'vertical'
  /**
   * Forces vertical spacing between options. When omitted, spacing is added
   * only if at least one option carries a description, since multi-line rows
   * need the breathing room while single-line rows read better tight.
   */
  gap?: boolean
  name?: string
  ui?: {
    fieldset?: string
    container?: string
  }
  uiRadio?: {
    wrapper?: string
    label?: string
  }
}>()

const radioSelectedModel = defineModel<TValue>({
  required: true,
})

const slots = useSlots()
const generatedName = `radio-group-${useId()}`

function optionToValue(opt: TOption) {
  if (typeof opt === 'object') {
    if (props.valueAttribute) {
      return opt[props.valueAttribute]
    }
    else if (Object.hasOwn(opt, 'value')) {
      return opt.value
    }
    return ''
  }
  return opt
}

function optionToLabel(opt: TOption) {
  if (typeof opt === 'object') {
    if (props.optionAttribute) {
      return opt[props.optionAttribute] as TValue
    }
    if (Object.hasOwn(opt, 'label')) {
      return opt.label as TValue
    }
  }
  return optionToValue(opt) as TValue
}

function optionToHelp(opt: TOption) {
  if (typeof opt === 'object') {
    if (Object.hasOwn(opt, 'description')) {
      return String(opt.description ?? '')
    }
    if (Object.hasOwn(opt, 'help')) {
      return String(opt.help ?? '')
    }
  }
  return ''
}

const hasDescription = computed(() => {
  return props.options.some(opt => optionToHelp(opt) !== '')
})

// `props.gap` is `false` whenever the attribute is omitted (Vue boolean casting),
// so this must OR rather than nullish-coalesce.
const hasVerticalGap = computed(() => props.gap || hasDescription.value)

const direction = computed(() => {
  if (props.direction) {
    return props.direction
  }
  return props.row ? 'horizontal' : 'vertical'
})
</script>

<template>
  <fieldset :class="props.ui?.fieldset">
    <div
      :class="[
        direction === 'horizontal'
          ? 'flex flex-row flex-wrap gap-x-8 gap-y-3'
          : ['flex flex-col', hasVerticalGap && 'gap-3'],
        props.ui?.container,
      ]"
    >
      <div
        v-for="(opt, idx) in props.options"
        :key="`${String(optionToValue(opt))}-${idx}`"
      >
        <RadioInput
          v-model="radioSelectedModel"
          :value="optionToValue(opt)"
          :label="optionToLabel(opt)"
          :help="optionToHelp(opt)"
          :disabled="props.disabled"
          :name="props.name ?? generatedName"
          :wrapper-class="props.uiRadio?.wrapper"
          :label-class="props.uiRadio?.label"
          :radio-class="direction === 'horizontal' ? 'mb-0' : undefined"
        >
          <template
            v-if="slots.label"
            #label
          >
            <slot
              name="label"
              :option="opt"
            />
          </template>
        </RadioInput>
      </div>
    </div>
  </fieldset>
</template>
