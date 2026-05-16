<script setup lang="ts">
import dayjs from 'dayjs'
import type { Coupon } from '~/shared/types/coupon'

const emit = defineEmits<{ (e: 'onChangeDuration', value: Pick<Coupon, 'start_date' | 'end_date'>): void }>()

const selectedColor = 'indigo'

const state = reactive({
  start_date: dayjs().add(10, 'minutes').toDate(),
  end_date: dayjs().add(1, 'days').toDate(),
})

const labelStartDate = computed(() => state.start_date && state.start_date.toLocaleDateString('en-us', {
  weekday: 'long',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}))

const labelEndDate = computed(() => state.end_date.toLocaleDateString('en-us', {
  weekday: 'long',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}))

const attrs = ref([
  {
    key: 'today',
    highlight: {
      color: 'indigo',
      fillMode: 'solid',
    },
    dates: new Date(),
  },
])

const disabledDates = ref([
  {
    repeat: {
      weekdays: [4, 5],
    },
  },
])

watch(state, () => {
  emit('onChangeDuration', state)
})
</script>

<template>
  <div class="flex gap-6">
    <UPopover :popper="{ placement: 'bottom-start' }">
      <UButton
        size="lg"
        color="white"
        icon="i-heroicons-calendar-days-20-solid"
        :label="labelStartDate"
      />

      <template #panel="{ close }">
        <VDatePicker
          v-model="state.start_date"
          :color="selectedColor"
          :attributes="attrs"
          :disabled-dates="disabledDates"
          mode="dateTime"
          hide-time-header
          @close="close"
        />
      </template>
    </UPopover>

    <UPopover :popper="{ placement: 'bottom-start' }">
      <UButton
        size="lg"
        color="white"
        icon="i-heroicons-calendar-days-20-solid"
        :label="labelEndDate"
      />

      <template #panel="{ close }">
        <VDatePicker
          v-model="state.end_date"
          :color="selectedColor"
          :attributes="attrs"
          mode="dateTime"
          hide-time-header
          @close="close"
        />
      </template>
    </UPopover>
  </div>
</template>
