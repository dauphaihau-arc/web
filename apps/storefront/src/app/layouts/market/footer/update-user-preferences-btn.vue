<script setup lang="ts">
import { MARKET_REGION_EMOJIS, MarketCurrencies, type StorefrontLanguages } from '@arc/enums/market'
import BaseDialog from '@arc/ui/patterns/dialog/base-dialog.vue'
import DialogActions from '@arc/ui/patterns/dialog/dialog-actions.vue'
import MarketPreferencesForm from '~/domains/market/ui/preferences/market-preferences-form.vue'
import { defaultLanguageOption, localeToLanguageOption, urlLocaleToFormLanguage, withUrlLanguageOption } from '~/domains/market/ui/preferences/preference-options'
import { useLanguageNavigation } from '~/shared/composables/use-language-navigation'
import { useUpdateMarketPreferences } from '~/domains/market/ui/preferences/use-update-market-preferences'
import { useUserPreferenceForm } from '~/domains/market/ui/preferences/use-user-preference-form'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { useGetMarketConfig } from '~/domains/market/queries/config.query'

const { locale } = useI18n()

const marketStore = useMarketStore()
const isOpenDialog = ref(false)
const formRef = ref()

const { data: currentUserData } = useGetCurrentUser()

const {
  isSavingPreferences,
  submitPreferences,
} = useUpdateMarketPreferences()

const {
  navigateToLanguage,
} = useLanguageNavigation()

const {
  data: marketConfig,
  isPending: isPendingGetMarketConfig,
} = useGetMarketConfig({
  enabled: true,
})

const currentUserPreferences = computed(() => {
  return currentUserData.value?.user?.preferences || marketStore.guestPreferences || undefined
})

const urlLanguage = computed<StorefrontLanguages>(() => urlLocaleToFormLanguage(locale.value))

const {
  currencyOptions,
  languageOptions,
  regionOptions,
  selectedCurrencyOption,
  state,
} = useUserPreferenceForm({
  currentUserPreferences,
  marketConfig,
  // While the dialog is open the URL locale wins over the stored preference.
  languageOverride: computed(() => isOpenDialog.value ? urlLanguage.value : undefined),
})

// The language control must stay usable even when the selected market does not
// advertise the language the URL is currently rendered in.
const dialogLanguageOptions = computed(() => {
  return withUrlLanguageOption(languageOptions.value, locale.value)
})

const selectedLanguageOption = computed(() => {
  return localeToLanguageOption(state.language) ?? defaultLanguageOption
})

function openDialog() {
  state.language = urlLanguage.value
  isOpenDialog.value = true
}

// Hydrating stored preferences can land after the dialog opened; the URL
// locale still has to be the language shown there.
watch(currentUserPreferences, () => {
  if (isOpenDialog.value) {
    state.language = urlLanguage.value
  }
})

const onSubmit = async () => {
  const language = state.language
  const languageChanged = language !== urlLanguage.value

  await submitPreferences(state)
  isOpenDialog.value = false

  if (languageChanged) {
    await navigateToLanguage(language)
    return
  }

  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <div
      data-testid="market-preferences-trigger"
      class="-ml-3 flex items-center gap-6 lg:ml-0"
      @click="openDialog"
    >
      <div class="flex items-center gap-5">
        <div
          class="flex cursor-pointer items-center gap-3 rounded-md
             px-3 py-2 text-xs transition-all duration-200 hover:bg-surface-control"
        >
          <div class="flex items-center gap-3 text-nowrap text-xs font-medium">
            <span>{{ MARKET_REGION_EMOJIS[state.region] }}</span>
            <span>{{ state.region }}</span>
          </div>
          <UDivider
            orientation="vertical"
            class="h-5 w-2"
          />
          <div class="flex items-center gap-2 text-nowrap font-medium">
            <AppIcon
              name="languages"
              class="h-4"
            />
            {{ selectedLanguageOption.label }}
          </div>
          <UDivider
            orientation="vertical"
            class="h-5 w-2"
          />
          <div class="text-nowrap font-medium">
            {{ selectedCurrencyOption.symbol }}
            ({{ MarketCurrencies[state.currency] }})
          </div>
        </div>
      </div>
    </div>

    <BaseDialog
      v-model="isOpenDialog"
      data-testid="market-preferences-dialog"
      :prevent-close="isSavingPreferences"
      body-class="space-y-6 p-8"
      card-class="overflow-visible"
      :ui="{
        modal: {
          margin: '!mb-72',
        },
        card: {
          body: {
            base: 'flex min-h-0 flex-1 flex-col overflow-visible',
          },
        },
      }"
      :title="$t('preferences.title')"
      :description="$t('preferences.description')"
    >
      <MarketPreferencesForm
        ref="formRef"
        :state="state"
        :region-options="regionOptions"
        :language-options="dialogLanguageOptions"
        :currency-options="currencyOptions"
        :disabled="isSavingPreferences"
        :is-pending-market-config="isPendingGetMarketConfig"
        body-class="mb-8 space-y-5"
        @submit="onSubmit"
      />

      <template #footer>
        <DialogActions>
          <UButton
            :disabled="isSavingPreferences"
            size="md"
            color="gray"
            @click="isOpenDialog = false"
          >
            {{ $t('common.cancel') }}
          </UButton>
          <UButton
            data-testid="market-preferences-save"
            :loading="isSavingPreferences"
            :disabled="isSavingPreferences"
            size="md"
            @click="formRef?.submit"
          >
            {{ $t('common.save') }}
          </UButton>
        </DialogActions>
      </template>
    </BaseDialog>
  </div>
</template>
