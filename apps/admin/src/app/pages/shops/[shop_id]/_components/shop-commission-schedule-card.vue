<script setup lang="ts">
import { PERMISSIONS } from '@arc/schemas/api/auth/permissions.generated'
import { readApiError } from '~/shared/lib/api-error'
import { useRecordCommissionSchedule } from '~/domains/finance/mutations/record-commission-schedule.mutation'
import { useAdminCommissionSchedule } from '~/domains/finance/queries/commission-schedule.query'
import type { AdminShopCurrentCommissionSchedule } from '~/domains/finance/api/contracts/admin-finance.contract'
import {
  formatCommissionPercent,
  parseCommissionPercentToBasisPoints,
} from '~/domains/finance/utils/finance-presentation'
import { usePermissions } from '~/shared/composables/use-permissions'
import { formatFinanceDateTime, toDateTimeLocalValue } from './finance-presentation'

const props = defineProps<{
  shopId: string
}>()

const { can } = usePermissions()
const canManageFinance = computed(() => can(PERMISSIONS.financeManage))

const rate = ref('')
const effectiveFrom = ref('')
const rateError = ref('')
const effectiveFromError = ref('')
const formError = ref('')
const hasUserEdited = ref(false)

/**
 * The form starts from the schedule in force, so recording a replacement is an
 * edit rather than a from-scratch entry. Only the initial value (and a schedule
 * that changed server-side after a successful save) is written into the
 * inputs; anything the operator typed stays untouched.
 */
const { data: currentSchedule } = useAdminCommissionSchedule(() => props.shopId)

let appliedSchedule = ''

function scheduleSignature(schedule: AdminShopCurrentCommissionSchedule) {
  return `${schedule.effective_from}:${schedule.rate_basis_points}`
}

function applySchedule(schedule: AdminShopCurrentCommissionSchedule) {
  appliedSchedule = scheduleSignature(schedule)
  rate.value = (schedule.rate_basis_points / 100).toFixed(2)
  effectiveFrom.value = toDateTimeLocalValue(schedule.effective_from)
}

watch(currentSchedule, (response) => {
  const schedule = response?.schedule

  if (!schedule || scheduleSignature(schedule) === appliedSchedule) {
    return
  }

  if (!hasUserEdited.value) {
    applySchedule(schedule)
    return
  }

  // The operator's edits win until they are saved; remember the server value
  // so only a genuinely newer schedule replaces the form afterwards.
  appliedSchedule = scheduleSignature(schedule)
}, { immediate: true })

const { mutateAsync, isPending, data: recorded } = useRecordCommissionSchedule(() => props.shopId)

const recordedRate = computed(() => (recorded.value ? formatCommissionPercent(recorded.value.rate_basis_points) : ''))

function clearErrors() {
  rateError.value = ''
  effectiveFromError.value = ''
  formError.value = ''
}

function validateRate() {
  if (rate.value.trim() === '') {
    rateError.value = 'Enter a commission rate.'
    return null
  }

  const basisPoints = parseCommissionPercentToBasisPoints(rate.value)

  if (basisPoints === null) {
    rateError.value = 'Enter a rate between 0 and 100 with at most two decimals.'
    return null
  }

  return basisPoints
}

function validateEffectiveFrom() {
  if (!effectiveFrom.value) {
    effectiveFromError.value = 'Choose when the rate takes effect.'
    return null
  }

  const instant = new Date(effectiveFrom.value)

  if (Number.isNaN(instant.getTime())) {
    effectiveFromError.value = 'Choose a valid date and time.'
    return null
  }

  return instant.toISOString()
}

async function submit() {
  clearErrors()

  const basisPoints = validateRate()
  const effectiveFromIso = validateEffectiveFrom()

  if (basisPoints === null || effectiveFromIso === null) {
    return
  }

  try {
    // What the form was last seeded from, so a save that leaves the schedule
    // in force untouched (a future start) keeps the operator's input.
    const seededFrom = appliedSchedule

    await mutateAsync({
      effective_from: effectiveFromIso,
      rate_basis_points: basisPoints,
    })

    // The mutation waits for the invalidated schedule read, so this is the
    // schedule actually in force after the save.
    hasUserEdited.value = false
    const inForce = currentSchedule.value?.schedule

    if (inForce && scheduleSignature(inForce) !== seededFrom) {
      applySchedule(inForce)
    }
  }
  catch (error) {
    const apiError = readApiError(error)

    // The range is a domain rule, not a request-shape rule, so the API reports
    // it as its own code rather than through the validation `fields`.
    if (apiError.code === 'INVALID_COMMISSION_RATE') {
      rateError.value = 'Enter a rate between 0 and 100.'
      return
    }

    formError.value = apiError.message ?? 'Could not record the commission schedule.'
  }
}
</script>

<template>
  <UCard>
    <div class="font-semibold">
      Commission schedule
    </div>
    <p class="mt-1 text-sm text-text-subtle">
      The rate the platform keeps from this shop's sales, from the moment it takes effect.
    </p>

    <form
      v-if="canManageFinance"
      class="mt-4 space-y-4"
      @submit.prevent="submit"
    >
      <UFormGroup
        label="Commission rate"
        :error="rateError"
      >
        <UInput
          v-model="rate"
          type="text"
          inputmode="decimal"
          placeholder="15.00"
          class="!w-36"
          :disabled="isPending"
          @update:model-value="hasUserEdited = true"
        >
          <template #trailing>
            <span class="text-xs text-text-subtle">%</span>
          </template>
        </UInput>
      </UFormGroup>

      <UFormGroup
        label="Effective from"
        :error="effectiveFromError"
      >
        <UInput
          v-model="effectiveFrom"
          type="datetime-local"
          class="!w-56"
          :disabled="isPending"
          @update:model-value="hasUserEdited = true"
        />
      </UFormGroup>

      <p
        v-if="formError"
        class="text-sm text-state-danger-text"
      >
        {{ formError }}
      </p>

      <UButton
        type="submit"
        :loading="isPending"
        :disabled="isPending"
      >
        Record schedule
      </UButton>
    </form>

    <p
      v-else
      class="mt-4 text-sm text-text-subtle"
    >
      Ask a platform administrator for finance access.
    </p>

    <div
      v-if="recorded"
      class="mt-4 rounded-md bg-surface-subtle p-3 text-sm text-text-muted"
    >
      Recorded
      <span class="font-semibold text-text-strong">{{ recordedRate }}</span>
      effective {{ formatFinanceDateTime(recorded.effective_from) }}.
    </div>
  </UCard>
</template>
