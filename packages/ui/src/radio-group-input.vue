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
  if (typeof opt === 'object' && Object.hasOwn(opt, 'help')) {
    return String(opt.help ?? '')
  }
  return ''
}

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
          ? 'flex flex-row flex-wrap gap-x-4 gap-y-3'
          : 'flex flex-col',
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
