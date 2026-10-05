<script setup lang="ts">
import dayjs from 'dayjs'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import PromotionScheduleOccurrenceField from './promotion-schedule-occurrence-field.vue'
import PromotionScheduleSuggestDateInput from './promotion-schedule-suggest-date-input.vue'
import {
  addDurationToLocal,
  PROMOTION_DURATION_PRESETS,
} from '../../utils/promotion-schedule-range'

const props = defineProps<{
  /** The IANA timezone the wall clock belongs to. */
  timezone: string
  /** Whether the schedule starts now or at a chosen local time. */
  startMode: 'now' | 'scheduled'
  disabled: boolean
  startIsAmbiguous: boolean
  endIsAmbiguous: boolean
}>()

const startLocal = defineModel<string>('startLocal', { required: true })
const endLocal = defineModel<string>('endLocal', { required: true })
const startOccurrence = defineModel<'earlier' | 'later' | undefined>('startOccurrence', { required: true })
const endOccurrence = defineModel<'earlier' | 'later' | undefined>('endOccurrence', { required: true })

const triggerFormat = 'D MMM HH:mm'

const open = ref(false)

/** Wall clock a preset or relative option counts from: the start when scheduled, else now. */
const anchorLocal = computed(() =>
  props.startMode === 'scheduled' ? startLocal.value : '')

const startLabel = computed(() =>
  props.startMode === 'scheduled' && startLocal.value
    ? dayjs(startLocal.value).format(triggerFormat)
    : 'Now')

const endLabel = computed(() =>
  endLocal.value ? dayjs(endLocal.value).format(triggerFormat) : '...')

/** The preset the current end already equals, so a click stays highlighted. */
const activePreset = computed(() => {
  if (!props.timezone) {
    return -1
  }

  return PROMOTION_DURATION_PRESETS.findIndex(preset =>
    addDurationToLocal(anchorLocal.value, props.timezone, preset.amount, preset.unit) === endLocal.value)
})

/** The form's verdict on the fields this control owns, shown under the trigger. */
const formErrors = inject<Ref<{ path: string, message: string }[]>>('form-errors', ref([]))
const scheduleError = computed(() =>
  formErrors.value.find(error =>
    ['start_local', 'end_local', 'start_occurrence', 'end_occurrence'].includes(error.path))?.message)

// A schedule the form rejected is edited inside the panel, so a fresh verdict
// opens it rather than leaving the seller with a hidden error.
watch(scheduleError, (message) => {
  if (message) {
    open.value = true
  }
})

function applyPreset(index: number) {
  const preset = PROMOTION_DURATION_PRESETS[index]

  if (!preset) {
    return
  }

  endLocal.value = addDurationToLocal(anchorLocal.value, props.timezone, preset.amount, preset.unit)
}
</script>

<template>
  <div>
    <UPopover
      v-model:open="open"
      :popper="{ placement: 'bottom-start' }"
      :ui="{ base: 'overflow-visible' }"
    >
      <UButton
        color="white"
        size="lg"
        :disabled="disabled"
        :ui="{ font: 'font-normal' }"
      >
        <span class="inline-flex items-center gap-2">
          <UIcon
            :name="ICON_NAME_BY_ALIAS['calendarDaysSolid']"
            class="size-5"
          />
          <span>{{ startLabel }}</span>
          <UIcon
            :name="ICON_NAME_BY_ALIAS['arrowRight']"
            class="size-4 stroke-2"
          />
          <span>{{ endLabel }}</span>
        </span>
      </UButton>

      <template #panel>
        <div class="flex gap-8 p-4">
          <div class="w-32 space-y-2 rounded-md bg-surface-muted p-1 py-2 text-text-subtle">
            <div
              v-for="(preset, index) in PROMOTION_DURATION_PRESETS"
              :key="preset.title"
              class="mx-1 cursor-pointer rounded-md px-2 py-1.5 hover:bg-surface"
              :class="[activePreset === index && 'bg-surface']"
              @click="() => applyPreset(index)"
            >
              {{ preset.title }}
            </div>
          </div>

          <div class="space-y-5">
            <template v-if="startMode === 'scheduled'">
              <UFormGroup
                label="From"
                name="start_local"
                required
              >
                <PromotionScheduleSuggestDateInput
                  v-model="startLocal"
                  :timezone="timezone"
                  :disabled="disabled"
                />
              </UFormGroup>

              <PromotionScheduleOccurrenceField
                v-if="startIsAmbiguous"
                v-model="startOccurrence"
                label="Start occurrence"
              />
            </template>

            <UFormGroup
              label="To"
              name="end_local"
              required
            >
              <PromotionScheduleSuggestDateInput
                v-model="endLocal"
                :timezone="timezone"
                :anchor-local="anchorLocal"
                :disabled="disabled"
              />
            </UFormGroup>

            <PromotionScheduleOccurrenceField
              v-if="endIsAmbiguous"
              v-model="endOccurrence"
              label="End occurrence"
            />
          </div>
        </div>
      </template>
    </UPopover>

    <p
      v-if="scheduleError"
      class="mt-1 text-sm text-red-500"
    >
      {{ scheduleError }}
    </p>
  </div>
</template>
