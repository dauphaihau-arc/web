<script setup lang="ts">
import { MARKET_REGION_EMOJIS, MarketCurrencies } from '@arc/enums/market'
import BaseDialog from '@arc/ui/primitives/dialog/base-dialog.vue'
import DialogActions from '@arc/ui/primitives/dialog/dialog-actions.vue'
import { useUserPreferenceForm } from './use-user-preference-form'
import type { PreferenceState } from './preference-options'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { useUpdateCurrentUser } from '~/shared/server-state/me/update-current-user.mutation'
import { useGetMarketConfig } from '~/shared/server-state/market/config.query'
import type { FormSubmitEvent } from '#ui/types'
import type { AuthPreferences } from '~/shared/api/auth/contracts/auth-user.contract'

const marketSensitiveQueryKeys = new Set([
  'get-products',
  'get-detail-product-by-slug',
  'get-categories',
  'get-root-categories',
  'get-attributes-by-category',
  'get-cart',
  'guest-checkout-session',
])

const marketStore = useMarketStore()
const queryClient = useQueryClient()
const isOpenDialog = ref(false)
const formRef = ref()
const isSubmittingPreferences = ref(false)

const { data: currentUserData } = useGetCurrentUser()

const {
  mutateAsync: updateUserPreferences,
  isPending: isPendingUpdateUserPreferences,
} = useUpdateCurrentUser()

const isDialogLocked = computed(() => {
  return isPendingUpdateUserPreferences.value || isSubmittingPreferences.value
})

const {
  data: marketConfig,
  isPending: isPendingGetMarketConfig,
} = useGetMarketConfig({
  enabled: true,
})

const currentUserPreferences = computed(() => {
  return currentUserData.value?.user?.preferences || marketStore.guestPreferences || undefined
})

const selectMenuUi = {
  container: 'z-[60]',
}

const currencySelectMenuUi = {
  ...selectMenuUi,
  select: '!normal-case',
  option: { base: '!normal-case' },
}

const {
  currencyOptions,
  regionOptions,
  selectedCurrencyOption,
  state,
} = useUserPreferenceForm({
  currentUserPreferences,
  marketConfig,
})

function buildPreferences({ currency, language, region }: PreferenceState): AuthPreferences {
  return {
    currency,
    language,
    region,
  }
}

const onSubmit = async (event: FormSubmitEvent<PreferenceState>) => {
  if (isSubmittingPreferences.value) {
    return
  }

  isSubmittingPreferences.value = true
  const preferences = buildPreferences(event.data)

  try {
    if (currentUserData.value?.user) {
      await updateUserPreferences({
        preferences,
      })
    }

    marketStore.guestPreferences = preferences

    isOpenDialog.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })

    await queryClient.invalidateQueries({
      predicate: query => marketSensitiveQueryKeys.has(String(query.queryKey[0])),
      refetchType: 'active',
    })
  }
  finally {
    isSubmittingPreferences.value = false
  }
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
      :prevent-close="isDialogLocked"
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
      <UForm
        ref="formRef"
        :state="state"
        @submit="onSubmit"
      >
        <div class="mb-8 space-y-5">
          <UFormGroup
            label="Region"
            name="region"
            required
            class="mb-4"
          >
            <USelectMenu
              v-model="state.region"
              :disabled="isDialogLocked || isPendingGetMarketConfig"
              size="xl"
              :options="regionOptions"
              :ui-menu="selectMenuUi"
            />
          </UFormGroup>

          <!-- <UFormGroup
              label="Language"
              name="language"
              required
              class="mb-4"
            >
              <USelectMenu
                v-model="state.language"
                disabled
                size="xl"
                :options="languageOptions"
              />
            </UFormGroup> -->

          <UFormGroup
            label="Currency"
            name="currency"
            required
            class="mb-4"
          >
            <USelectMenu
              v-model="state.currency"
              data-testid="market-preferences-currency"
              searchable
              size="xl"
              :disabled="isDialogLocked"
              :options="currencyOptions"
              value-attribute="id"
              option-attribute="displayLabel"
              :ui-menu="currencySelectMenuUi"
            />
          </UFormGroup>
        </div>
      </UForm>

      <template #footer>
        <DialogActions>
          <UButton
            :disabled="isDialogLocked"
            size="md"
            color="gray"
            @click="isOpenDialog = false"
          >
            Cancel
          </UButton>
          <UButton
            data-testid="market-preferences-save"
            :loading="isDialogLocked"
            :disabled="isDialogLocked"
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
