<script setup lang="ts">
import RadioGroupInput from '@arc/ui/primitives/radio-group-input.vue'
import WrapperFormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'
import { PROMOTION_START_MODE_OPTIONS } from './promotion.constants'
import PromotionScheduleOccurrenceField from './promotion-schedule-occurrence-field.vue'

defineProps<{
  /** What the schedule belongs to, e.g. "sale" or "promo code". */
  subject: string
  disabled: boolean
  startIsAmbiguous: boolean
  endIsAmbiguous: boolean
  timezoneOptions: string[]
  storeTimezone: string
  isStoreTimezone: boolean
  isPickerOpen: boolean
  changeTimezone: () => void
}>()

const startMode = defineModel<'now' | 'scheduled'>('startMode', { required: true })
const startLocal = defineModel<string>('startLocal', { required: true })
const endLocal = defineModel<string>('endLocal', { required: true })
const startOccurrence = defineModel<'earlier' | 'later' | undefined>('startOccurrence', { required: true })
const endOccurrence = defineModel<'earlier' | 'later' | undefined>('endOccurrence', { required: true })
const timezone = defineModel<string>('timezone', { required: true })
</script>

<template>
  <WrapperFormGroupCard>
    <template #title>
      Schedule
    </template>
    <template #content>
      <div class="space-y-5">
        <UFormGroup
          :label="`When should the ${subject} start?`"
          name="start_mode"
          class="grid grid-cols-4 gap-10"
          :ui="{ container: 'col-span-3' }"
        >
          <RadioGroupInput
            v-model="startMode"
            :options="PROMOTION_START_MODE_OPTIONS"
            :disabled="disabled"
            row
          />
        </UFormGroup>

        <UFormGroup
          v-if="startMode === 'scheduled'"
          label="Start"
          name="start_local"
          required
          class="grid grid-cols-4 gap-10"
          :ui="{ container: 'col-span-3' }"
        >
          <UInput
            v-model="startLocal"
            type="datetime-local"
            size="lg"
            class="w-64"
          />
          <PromotionScheduleOccurrenceField
            v-if="startIsAmbiguous"
            v-model="startOccurrence"
            label="Start occurrence"
          />
        </UFormGroup>

        <UFormGroup
          label="End"
          name="end_local"
          :description="`The ${subject} is active up to, but not including, this local time.`"
          required
          class="grid grid-cols-4 gap-10"
          :ui="{ container: 'col-span-3' }"
        >
          <UInput
            v-model="endLocal"
            type="datetime-local"
            size="lg"
            class="w-64"
          />
          <PromotionScheduleOccurrenceField
            v-if="endIsAmbiguous"
            v-model="endOccurrence"
            label="End occurrence"
          />
        </UFormGroup>

        <UFormGroup
          label="Timezone"
          name="timezone"
          required
          class="grid grid-cols-4 gap-10"
          :ui="{ container: 'col-span-3' }"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm">
              {{ timezone || 'Loading store timezone…' }}
            </span>
            <UBadge
              v-if="isStoreTimezone"
              color="gray"
              variant="soft"
              size="xs"
            >
              Store default
            </UBadge>
            <UBadge
              v-else-if="timezone"
              color="primary"
              variant="soft"
              size="xs"
            >
              Custom for this {{ subject }}
            </UBadge>
            <UButton
              v-if="!isPickerOpen"
              color="gray"
              variant="link"
              size="xs"
              @click="changeTimezone"
            >
              Change timezone
            </UButton>
          </div>
          <p
            v-if="isStoreTimezone"
            class="mt-1 text-sm text-text-muted"
          >
            Scheduled in your store timezone. It is saved with this {{ subject }}, so travelling
            does not reinterpret the schedule.
          </p>
          <p
            v-else-if="timezone"
            class="mt-1 text-sm text-text-muted"
          >
            Saved with this {{ subject }} only. Your store timezone is {{ storeTimezone }}.
          </p>
          <USelectMenu
            v-if="isPickerOpen"
            v-model="timezone"
            :options="timezoneOptions"
            searchable
            size="lg"
            class="mt-2 w-96"
          />
        </UFormGroup>
      </div>
    </template>
  </WrapperFormGroupCard>
</template>
