<script lang="ts" setup>
import MarketCurrencySelect from '~/domains/market/ui/preferences/market-currency-select.vue'
import MarketRegionSelect from '~/domains/market/ui/preferences/market-region-select.vue'
import WrapperFormRow from '@arc/ui/patterns/form/wrapper-form-row.vue'
import WrapperFormRows from '@arc/ui/patterns/form/wrapper-form-rows.vue'
import type { PreferenceState } from '~/domains/market/ui/preferences/preference-options'
import { useUpdateMarketPreferences } from '~/domains/market/ui/preferences/use-update-market-preferences'
import { useUserPreferenceForm } from '~/domains/market/ui/preferences/use-user-preference-form'
import { useGetMarketConfig } from '~/domains/market/queries/config.query'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { toastCustom } from '~/shared/config/toast'
import { useWebPushNotifications } from '~/domains/me/composables/use-web-push-notifications'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const { data: currentUser } = useGetCurrentUser()
const toast = useToast()
const marketStore = useMarketStore()
const preferencesFormRef = ref()
const {
  status,
  permission,
  isSupported,
  isEnabled,
  syncStatusFromBrowser,
  enable,
  disable,
} = useWebPushNotifications()

const isPending = ref(false)

const {
  data: marketConfig,
  isPending: isPendingGetMarketConfig,
} = useGetMarketConfig({
  enabled: true,
})

const currentUserPreferences = computed(() => {
  return currentUser.value?.user?.preferences || marketStore.guestPreferences || undefined
})

const {
  currencyOptions,
  regionOptions,
  state: preferenceState,
} = useUserPreferenceForm({
  currentUserPreferences,
  marketConfig,
})

const {
  isSavingPreferences,
  submitPreferences,
} = useUpdateMarketPreferences()

type PreferenceBaseline = Pick<PreferenceState, 'region' | 'currency'>

const preferenceBaseline = ref<PreferenceBaseline | null>(null)

function snapshotPreferenceBaseline() {
  preferenceBaseline.value = {
    region: preferenceState.region,
    currency: preferenceState.currency,
  }
}

const isDirty = computed(() => {
  if (!preferenceBaseline.value || isPendingGetMarketConfig.value) {
    return false
  }

  return preferenceState.region !== preferenceBaseline.value.region
    || preferenceState.currency !== preferenceBaseline.value.currency
})

// `useUserPreferenceForm` hydrates from `currentUserPreferences` and normalises
// `currency`/`language` through watchers, so the baseline must be captured after
// that hydration flush rather than from the setup-time snapshot.
watch(currentUserPreferences, () => {
  snapshotPreferenceBaseline()
}, { immediate: true, flush: 'post' })

async function saveMarketPreferences(event: FormSubmitEvent<PreferenceState>) {
  try {
    await submitPreferences(event.data)
    snapshotPreferenceBaseline()
    toast.add({
      ...toastCustom.success,
      title: 'Preferences updated',
    })
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: error instanceof Error ? error.message : 'Failed to update preferences',
    })
  }
}

async function onNotificationToggle(next: boolean) {
  if (isPending.value || !isSupported.value || next === isEnabled.value) {
    return
  }

  isPending.value = true

  try {
    if (next) {
      const enabled = await enable()
      if (enabled) {
        toast.add({
          ...toastCustom.success,
          title: 'Browser notifications enabled',
        })
      }
    }
    else {
      await disable()
      toast.add({
        ...toastCustom.success,
        title: 'Browser notifications disabled',
      })
    }
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: error instanceof Error ? error.message : 'Failed to update browser notifications',
    })
  }
  finally {
    isPending.value = false
    await syncStatusFromBrowser()
  }
}

onMounted(() => {
  void syncStatusFromBrowser()
})
</script>

<template>
  <div>
    <h3 class="text-2xl font-medium">
      Account
    </h3>
    <div class="mt-3 space-y-3">
      <UCard>
        <div class="space-y-3">
          <div>
            <div class="font-medium">
              Name
            </div>
            <div class="font-light text-text-subtle">
              {{ currentUser?.user?.display_name }}
            </div>
          </div>
          <div>
            <div class="font-medium">
              Email
            </div>
            <div class="font-light text-text-subtle">
              {{ currentUser?.user?.email }}
            </div>
          </div>
        </div>
      </UCard>

      <UForm
        ref="preferencesFormRef"
        :state="preferenceState"
        @submit="saveMarketPreferences"
      >
        <WrapperFormRows>
          <template #title>
            Market preferences
          </template>
          <template #subtitle>
            Choose the region and currency used for storefront browsing.
          </template>
          <WrapperFormRow
            label="Region"
            description="Used for storefront browsing and product availability."
          >
            <MarketRegionSelect
              v-model="preferenceState.region"
              aria-label="Region"
              :options="regionOptions"
              :disabled="isSavingPreferences"
              :pending="isPendingGetMarketConfig"
              size="lg"
              class="w-full md:ms-auto md:max-w-52"
            />
          </WrapperFormRow>

          <WrapperFormRow
            label="Currency"
            description="Prices and totals are shown in this currency."
          >
            <MarketCurrencySelect
              v-model="preferenceState.currency"
              aria-label="Currency"
              :options="currencyOptions"
              :disabled="isSavingPreferences"
              size="lg"
              class="w-full md:ms-auto md:max-w-64"
            />
          </WrapperFormRow>

          <div class="flex justify-end pt-5">
            <UButton
              class="w-full sm:w-auto"
              :loading="isSavingPreferences"
              :disabled="!isDirty || isSavingPreferences"
              @click="preferencesFormRef?.submit"
            >
              Save preferences
            </UButton>
          </div>
        </WrapperFormRows>
      </UForm>

      <WrapperFormRows>
        <WrapperFormRow
          label="Browser notifications"
          description="Receive order updates as browser notifications when this device is subscribed."
        >
          <div class="flex flex-col items-end gap-1">
            <UToggle
              aria-label="Browser notifications"
              :model-value="isEnabled"
              :loading="isPending || status === 'syncing'"
              :disabled="!isSupported || permission === 'denied' || isPending || status === 'syncing'"
              @update:model-value="onNotificationToggle"
            />
            <p
              v-if="permission === 'denied'"
              class="text-right text-xs text-state-danger-text"
            >
              Browser permission is blocked. Re-enable notifications in your browser settings first.
            </p>
          </div>
        </WrapperFormRow>
      </WrapperFormRows>
    </div>
  </div>
</template>
