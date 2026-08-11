<script setup lang="ts">
import { MARKET_REGION_EMOJIS, MarketCurrencies } from '@arc/enums/market'
import BaseDialog from '@arc/ui/primitives/dialog/base-dialog.vue'
import DialogActions from '@arc/ui/primitives/dialog/dialog-actions.vue'
import MarketPreferencesForm from '~/app/components/market-preferences/market-preferences-form.vue'
import { useUpdateMarketPreferences } from '~/app/components/market-preferences/use-update-market-preferences'
import { useUserPreferenceForm } from '~/app/components/market-preferences/use-user-preference-form'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { useGetMarketConfig } from '~/domains/market/queries/config.query'

const marketStore = useMarketStore()
const isOpenDialog = ref(false)
const formRef = ref()

const { data: currentUserData } = useGetCurrentUser()

const {
  isSavingPreferences,
  submitPreferences,
} = useUpdateMarketPreferences()

const {
  data: marketConfig,
  isPending: isPendingGetMarketConfig,
} = useGetMarketConfig({
  enabled: true,
})

const currentUserPreferences = computed(() => {
  return currentUserData.value?.user?.preferences || marketStore.guestPreferences || undefined
})

const {
  currencyOptions,
  regionOptions,
  selectedCurrencyOption,
  state,
} = useUserPreferenceForm({
  currentUserPreferences,
  marketConfig,
})

const onSubmit = async () => {
  await submitPreferences(state)
  isOpenDialog.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <div
      data-testid="market-preferences-trigger"
      class="flex items-center gap-6"
      @click="isOpenDialog = true"
    >
      <div class="flex items-center gap-5">
        <div
          class="flex cursor-pointer items-center gap-3 rounded-md
             px-3 py-2 text-xs transition-all duration-200 hover:bg-customGray-200/50"
        >
          <div class="flex items-center gap-3 text-nowrap text-xs font-medium">
            <span>{{ MARKET_REGION_EMOJIS[state.region] }}</span>
            <span>{{ state.region }}</span>
          </div>
          <!-- <UDivider
            orientation="vertical"
            class="h-5 w-2"
          />
          <div class="flex items-center gap-2 text-nowrap font-medium">
            <UIcon
              name="i-heroicons-language"
              class="h-4"
            />
            {{ state.language.label }}
          </div> -->
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
      title="Update your settings"
      description="Set where you live, what language you speak and the currency you use."
    >
      <MarketPreferencesForm
        ref="formRef"
        :state="state"
        :region-options="regionOptions"
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
            Cancel
          </UButton>
          <UButton
            data-testid="market-preferences-save"
            :loading="isSavingPreferences"
            :disabled="isSavingPreferences"
            size="md"
            @click="formRef?.submit"
          >
            Save
          </UButton>
        </DialogActions>
      </template>
    </BaseDialog>
  </div>
</template>
