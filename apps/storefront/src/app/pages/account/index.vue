<script lang="ts" setup>
import MarketCurrencySelect from '~/domains/market/ui/preferences/market-currency-select.vue'
import MarketLanguageSelect from '~/domains/market/ui/preferences/market-language-select.vue'
import MarketRegionSelect from '~/domains/market/ui/preferences/market-region-select.vue'
import WrapperFormRow from '@arc/ui/patterns/form/wrapper-form-row.vue'
import WrapperFormRows from '@arc/ui/patterns/form/wrapper-form-rows.vue'
import type { PreferenceState } from '~/domains/market/ui/preferences/preference-options'
import { urlLocaleToFormLanguage, withUrlLanguageOption } from '~/domains/market/ui/preferences/preference-options'
import { useLanguageNavigation } from '~/shared/composables/use-language-navigation'
import { useUpdateMarketPreferences } from '~/domains/market/ui/preferences/use-update-market-preferences'
import { useUserPreferenceForm } from '~/domains/market/ui/preferences/use-user-preference-form'
import { useGetMarketConfig } from '~/domains/market/queries/config.query'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { toastCustom } from '~/shared/config/toast'
import { useWebPushNotifications } from '~/domains/me/composables/use-web-push-notifications'
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const { data: currentUser } = useGetCurrentUser()
const toast = useToast()
const marketStore = useMarketStore()
const preferencesFormRef = ref()
const { locale } = useI18n()
const t = useAccountTranslator()
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

const urlLanguage = computed(() => urlLocaleToFormLanguage(locale.value))

const {
  currencyOptions,
  languageOptions,
  regionOptions,
  state: preferenceState,
} = useUserPreferenceForm({
  currentUserPreferences,
  marketConfig,
  languageOverride: computed(() => urlLanguage.value),
})

// Keep the URL language selectable even if the selected market does not
// advertise it; the account page always mirrors the rendered locale.
const accountLanguageOptions = computed(() => {
  return withUrlLanguageOption(languageOptions.value, locale.value)
})

const {
  isSavingPreferences,
  submitPreferences,
} = useUpdateMarketPreferences()

const {
  navigateToLanguage,
} = useLanguageNavigation()

type PreferenceBaseline = Pick<PreferenceState, 'region' | 'language' | 'currency'>

const preferenceBaseline = ref<PreferenceBaseline | null>(null)

function snapshotPreferenceBaseline() {
  preferenceBaseline.value = {
    region: preferenceState.region,
    language: preferenceState.language,
    currency: preferenceState.currency,
  }
}

const isDirty = computed(() => {
  if (!preferenceBaseline.value || isPendingGetMarketConfig.value) {
    return false
  }

  return preferenceState.region !== preferenceBaseline.value.region
    || preferenceState.language !== preferenceBaseline.value.language
    || preferenceState.currency !== preferenceBaseline.value.currency
})

// `useUserPreferenceForm` hydrates from `currentUserPreferences` and normalises
// `currency`/`language` through watchers, so the baseline must be captured after
// that hydration flush rather than from the setup-time snapshot.
watch(currentUserPreferences, () => {
  snapshotPreferenceBaseline()
}, { immediate: true, flush: 'post' })

async function saveMarketPreferences(_event: FormSubmitEvent<PreferenceState>) {
  try {
    const language = preferenceState.language
    const languageChanged = language !== urlLanguage.value

    await submitPreferences(preferenceState)
    snapshotPreferenceBaseline()

    if (languageChanged) {
      await navigateToLanguage(language)
      return
    }

    toast.add({
      ...toastCustom.success,
      title: t('account.profile.preferencesUpdatedToast'),
    })
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: error instanceof Error ? error.message : t('account.profile.preferencesFailedToast'),
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
          title: t('account.profile.notifications.enabledToast'),
        })
      }
    }
    else {
      await disable()
      toast.add({
        ...toastCustom.success,
        title: t('account.profile.notifications.disabledToast'),
      })
    }
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: error instanceof Error ? error.message : t('account.profile.notifications.failedToast'),
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
      {{ t('account.profile.title') }}
    </h3>
    <div class="mt-3 space-y-3">
      <UCard>
        <div class="space-y-3">
          <div>
            <div class="font-medium">
              {{ t('account.common.name') }}
            </div>
            <div class="font-light text-text-subtle">
              {{ currentUser?.user?.display_name }}
            </div>
          </div>
          <div>
            <div class="font-medium">
              {{ t('account.common.email') }}
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
            {{ t('account.profile.preferences.title') }}
          </template>
          <template #subtitle>
            {{ t('account.profile.preferences.description') }}
          </template>
          <WrapperFormRow
            :label="t('account.profile.preferences.region')"
            :description="t('account.profile.preferences.regionDescription')"
          >
            <MarketRegionSelect
              v-model="preferenceState.region"
              :aria-label="t('account.profile.preferences.region')"
              :options="regionOptions"
              :disabled="isSavingPreferences"
              :pending="isPendingGetMarketConfig"
              size="lg"
              class="w-full md:ms-auto md:max-w-52"
            />
          </WrapperFormRow>

          <WrapperFormRow
            :label="t('account.profile.preferences.language')"
            :description="t('account.profile.preferences.languageDescription')"
          >
            <MarketLanguageSelect
              v-model="preferenceState.language"
              :aria-label="t('account.profile.preferences.language')"
              :options="accountLanguageOptions"
              :disabled="isSavingPreferences"
              size="lg"
              class="w-full md:ms-auto md:max-w-52"
            />
          </WrapperFormRow>

          <WrapperFormRow
            :label="t('account.profile.preferences.currency')"
            :description="t('account.profile.preferences.currencyDescription')"
          >
            <MarketCurrencySelect
              v-model="preferenceState.currency"
              :aria-label="t('account.profile.preferences.currency')"
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
              {{ t('account.profile.preferences.save') }}
            </UButton>
          </div>
        </WrapperFormRows>
      </UForm>

      <WrapperFormRows>
        <WrapperFormRow
          :label="t('account.profile.notifications.label')"
          :description="t('account.profile.notifications.description')"
        >
          <div class="flex flex-col items-end gap-1">
            <UToggle
              :aria-label="t('account.profile.notifications.label')"
              :model-value="isEnabled"
              :loading="isPending || status === 'syncing'"
              :disabled="!isSupported || permission === 'denied' || isPending || status === 'syncing'"
              @update:model-value="onNotificationToggle"
            />
            <p
              v-if="permission === 'denied'"
              class="text-right text-xs text-state-danger-text"
            >
              {{ t('account.profile.notifications.blocked') }}
            </p>
          </div>
        </WrapperFormRow>
      </WrapperFormRows>
    </div>
  </div>
</template>
