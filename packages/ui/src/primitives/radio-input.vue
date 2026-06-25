<script
    setup lang="ts"
    generic="
    TValue extends string | number | boolean,
    TModel extends TValue | Record<string, any>
"
>
const props = defineProps<{
  label: TValue
  help?: string
  value: TModel
  disabled?: boolean
  name?: string
  wrapperClass?: string
  labelClass?: string
  radioClass?: string
}>()

const model = defineModel<TModel>({
  required: true,
})

const slots = useSlots()

const clickRadio = () => {
  if (props.disabled) return
  model.value = props.value
}

const isChecked = computed(() => {
  return model.value === props.value
})
</script>

<template>
  <div
    :class="['flex items-center', props.wrapperClass]"
    @click="clickRadio"
  >
    <div class="grid h-6 place-items-center">
      <input
        :checked="isChecked"
        :disabled="disabled"
        :name="props.name"
        :value="props.value"
        type="radio"
        class="
        col-start-1
        row-start-1 size-4
        shrink-0 appearance-none rounded-full border
      "
        :class="[
          isChecked && 'border-primary bg-primary',
          props.radioClass,
        ]"
      >
      <div
        v-if="isChecked"
        class="col-start-1 row-start-1 size-1.5 rounded-full bg-white"
      />
    </div>
    <div class="ms-1.5 flex flex-col">
      <slot
        v-if="slots.label"
        name="label"
      />
      <div v-else>
        <label :class="['text-sm font-medium text-text-subtle', props.labelClass]">
          {{ props.label }}
        </label>
        <div
          v-if="props.help"
          class="text-sm text-text-muted"
        >
          {{ props.help }}
        </div>
      </div>
    </div>
  </div>
</template>
