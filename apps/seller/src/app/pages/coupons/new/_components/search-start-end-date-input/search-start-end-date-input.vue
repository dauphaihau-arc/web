<script setup lang="ts">
import dayjs from 'dayjs'
import SuggestDateInput from './suggest-date-input.vue'

type State = {
  startDate: dayjs.Dayjs
  endDate: dayjs.Dayjs | null
}

const startDateModel = defineModel<Date | string>('startDate')
const endDateModel = defineModel<Date | string | undefined>('endDate')

const formatDisplayOnBtn = 'D MMM HH:mm'

const hintDurationOptions = [
  {
    title: '1 hour',
    duration: dayjs().diff(dayjs().add(1, 'hour'), 'minute'),
    startDate: dayjs(),
    endDate: dayjs().add(1, 'hour'),
  },
  {
    title: '24 hours',
    duration: dayjs().diff(dayjs().add(1, 'day'), 'minute'),
    startDate: dayjs(),
    endDate: dayjs().add(1, 'day'),
  },
  {
    title: '48 hours',
    duration: dayjs().diff(dayjs().add(2, 'day'), 'minute'),
    startDate: dayjs(),
    endDate: dayjs().add(2, 'day'),
  },
  {
    title: '7 days',
    duration: dayjs().diff(dayjs().add(7, 'day'), 'minute'),
    startDate: dayjs(),
    endDate: dayjs().add(7, 'day'),
  },
  {
    title: '30 days',
    duration: dayjs().diff(dayjs().add(30, 'day'), 'minute'),
    startDate: dayjs(),
    endDate: dayjs().add(30, 'day'),
  },
]

const hintDurationOptionsMap = new Map(hintDurationOptions.map((item, index) => [item.duration, index]))

const selectedHintDuration = ref<number | undefined>(0)

const state = reactive<State>({
  startDate: hintDurationOptions[0].startDate,
  endDate: hintDurationOptions[0].endDate,
})

onMounted(() => {
  startDateModel.value = state.startDate.toDate()
  if (state.endDate) {
    endDateModel.value = state.endDate.toDate()
  }
})

function onChangeDuration(idx: number) {
  selectedHintDuration.value = idx
  state.startDate = hintDurationOptions[idx].startDate
  state.endDate = hintDurationOptions[idx].endDate
  startDateModel.value = hintDurationOptions[idx].startDate.toDate()
  endDateModel.value = hintDurationOptions[idx].endDate.toDate()
}

watch(state, () => {
  const durationStartEnd = state.startDate.diff(state.endDate, 'minute')
  selectedHintDuration.value = hintDurationOptionsMap.get(durationStartEnd)

  if (state.endDate && state.endDate.isBefore(state.startDate)) {
    state.endDate = null
  }

  startDateModel.value = state.startDate.toDate()
  endDateModel.value = state.endDate ? state.endDate.toDate() : undefined
})
</script>

<template>
  <div class="flex gap-6">
    <UPopover
      :popper="{ placement: 'bottom-start' }"
      :ui="{ base: 'overflow-visible' }"
    >
      <UButton
        color="white"
        size="lg"
        trailing-icon="i-heroicons-chevron-down-20-solid"
        icon="i-heroicons-calendar-days-20-solid"
        :ui="{ font: 'font-normal' }"
      >
        {{ state.startDate?.format(formatDisplayOnBtn) }}
        <UIcon
          name="i-heroicons-arrow-right"
          class="size-4 stroke-2"
        />
        {{ state.endDate ? state.endDate.format(formatDisplayOnBtn): '...' }}
      </UButton>

      <template #panel>
        <div class="flex gap-8 p-4">
          <div class="w-32 space-y-2 rounded-md bg-zinc-100 p-1 py-2 text-zinc-600">
            <div
              v-for="(item, idx) of hintDurationOptions"
              :key="idx"
            >
              <div
                class="mx-1 cursor-pointer rounded-md px-2 py-1.5 hover:bg-zinc-200/50"
                :class="[selectedHintDuration === idx && 'bg-zinc-200/50']"
                @click="() => onChangeDuration(idx)"
              >
                {{ item.title }}
              </div>
            </div>
          </div>

          <div class="space-y-5">
            <UFormGroup label="From">
              <SuggestDateInput
                :key="selectedHintDuration"
                v-model="state.startDate"
              />
            </UFormGroup>

            <UFormGroup label="To">
              <SuggestDateInput
                :key="selectedHintDuration"
                v-model="state.endDate"
                :start-date="state.startDate"
              />
            </UFormGroup>
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>
