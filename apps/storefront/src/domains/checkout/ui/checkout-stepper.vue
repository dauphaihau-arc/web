<script setup lang="ts">
/*
  use in checkout, cart, cart/checkout,  page
 */
const props = defineProps<{
  steps: string[]
  disabled: boolean
}>()

const model = defineModel<number>({
  required: true,
  default: 0,
})

const widthAddition = 17.2
const steps = props.steps
const widthPerStep = 100 / steps.length

const currentStep = computed(() => {
  if (model.value > steps.length) {
    return steps.length
  }
  return model.value
})

const valueProgress = computed(() => {
  return (widthPerStep + widthAddition) * currentStep.value
})

const clickStepDone = (index: number) => {
  if (props.disabled) return
  model.value = index
}
</script>

<template>
  <div
    :key="currentStep"
    class=""
  >
    <UProgress
      :ui="{
        progress: {
          background: '!bg-customGray-200',
        },
      }"
      :value="valueProgress"
      class="relative"
      size="sm"
    >
      <template #indicator="{ percent }">
        <div
          v-for="(title, index) of steps"
          :key="index"
          class="absolute text-right"
          :style="{ width: `${(widthPerStep + widthAddition) * (index)}%` }"
        >
          <div
            class="absolute bottom-[-14px] right-0 z-[2] flex size-3.5
            items-center justify-center sm:size-6"
          >
            <div v-if="(percent > (widthPerStep + widthAddition) * (index)) || currentStep === index + 1">
              <AppIcon
                name="check"
                class="done size-5"
                @click="() => clickStepDone(index)"
              />
            </div>

            <div
              v-else-if="currentStep === index"
              class="active"
              :class="[index === 0 && 'ml-[3px]', index === steps.length - 1 && 'mr-[4px]']"
            >
              {{ index + 1 }}
            </div>

            <div
              v-else
              class="inactive"
              :class="[index === steps.length - 1 && 'mr-[4px]']"
            >
              {{ index + 1 }}
            </div>

            <div
              :class="[
                'center-title whitespace-nowrap break-keep font-medium',
                currentStep === index + 1 || currentStep + 1 === index + 1 || currentStep > index + 1 ? 'text-primary' : 'text-customGray-900',
                (currentStep - 1 === index || currentStep > index + 1) && 'cursor-pointer',
              ]"
            >
              {{ title }}
            </div>
          </div>
        </div>
      </template>
    </UProgress>
  </div>
</template>

<style scoped lang="postcss">
.center-title {
  position: absolute;
  top: 180%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.base {
  @apply rounded-full w-[17px] h-[17px] ring-[3px]
  flex justify-center items-center text-sm font-semibold;
}

.done {
 @apply text-primary bg-white size-6 cursor-pointer;
}

.active {
  @apply base text-primary bg-white ring-primary;
}

.inactive {
 @apply base text-text-strong bg-customGray-200 ring-customGray-200;
}
</style>
