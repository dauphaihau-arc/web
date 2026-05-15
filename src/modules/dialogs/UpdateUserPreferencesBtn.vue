<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import type { MARKET_REGIONS } from '~/shared/config/enums/market'
import {
  MARKET_CONFIG,
  MARKET_CURRENCIES,
  MARKET_LANGUAGES, MARKET_REGION_EMOJIS,
} from '~/shared/config/enums/market'
import type { UpdateUserBody } from '~/shared/types/user'
import { useGetCurrentUser, useUpdateUser } from '~/shared/services/user'
import { useGetCountries } from '~/shared/services/address'
import type { ElementType } from '~/shared/types/utils'

type State = {
  region: MARKET_REGIONS
  language: ElementType<typeof languageOpts>
  currency: ElementType<typeof currencyOpts>
}

const marketStore = useMarketStore()
const { data: dataUserAuth } = useGetCurrentUser()
const {
  mutateAsync: updateUser,
  isPending: isPendingUpdateUser,
} = useUpdateUser()

const {
  data: dataGetCountries,
  isPending: isPendingGetCountries,
  refetch: refetchGetCountries,
} = useGetCountries({
  enabled: false,
})

const isOpenDialog = ref(false)

const currencyOpts = [
  {
    id: MARKET_CURRENCIES.USD,
    label: '$ United States Dollar (USD)',
  },
  {
    id: MARKET_CURRENCIES.CAD,
    label: '$ Canadian Dollar (CAD)',
  },
  {
    id: MARKET_CURRENCIES.AUD,
    label: '$ Australian Dollar (AUD)',
  },
  {
    id: MARKET_CURRENCIES.EUR,
    label: '€ Euro (EUR)',
  },
  {
    id: MARKET_CURRENCIES.GBP,
    label: '£ British Pound (GBP)',
  },
  {
    id: MARKET_CURRENCIES.HKD,
    label: '$ Hong Kong Dollar (HKD)',
  },
  {
    id: MARKET_CURRENCIES.TWD,
    label: '$ Taiwan New Dollar (TWD)',
  },
  {
    id: MARKET_CURRENCIES.JPY,
    label: '¥ Japanese Yen (JPY)',
  },
  {
    id: MARKET_CURRENCIES.KRW,
    label: '₩ Korean Won (KRW)',
  },
  {
    id: MARKET_CURRENCIES.SGD,
    label: '$ Singapore Dollar (SGD)',
  },
  {
    id: MARKET_CURRENCIES.VND,
    label: '₫ Vietnamese Dong (VND)',
  },
]

const languageOpts = [
  {
    id: MARKET_LANGUAGES.EN,
    label: 'English (US)',
  },
  {
    id: MARKET_LANGUAGES.LA,
    label: 'Latin (LA)',
  },
  {
    id: MARKET_LANGUAGES.FR,
    label: 'Français (FR)',
  },
]

const regionOpts = computed(() => {
  if (dataGetCountries.value?.data) {
    return dataGetCountries.value.data.map(country => country.name)
  }
  return []
})

const state = reactive<State>({
  region: MARKET_CONFIG.BASE_REGION,
  language: languageOpts[0],
  currency: currencyOpts[0],
})

watch(() => [marketStore.guestPreferences, dataUserAuth.value?.user], () => {
  const userPreferences = marketStore.guestPreferences || dataUserAuth.value?.user?.market_preferences
  if (userPreferences) {
    const currencyOpt = currencyOpts.find(opt => opt.id === userPreferences.currency)
    if (currencyOpt) {
      state.currency = currencyOpt
    }
    state.region = userPreferences.region
  }
}, { immediate: true })

watch(isOpenDialog, async () => {
  if (isOpenDialog.value && regionOpts.value.length === 0) {
    refetchGetCountries()
  }
})

const onSubmit = async (event: FormSubmitEvent<State>) => {
  const { currency, language, region } = event.data

  const preferences: UpdateUserBody['market_preferences'] = {
    currency: currency.id,
    language: language.id,
    region,
  }

  if (dataUserAuth.value?.user) {
    await updateUser({
      market_preferences: preferences,
    })
  }
  else {
    marketStore.guestPreferences = preferences
  }

  isOpenDialog.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <div
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
          <UDivider
            orientation="vertical"
            class="h-5 w-2"
          />
          <div class="flex items-center gap-2 text-nowrap font-medium">
            <UIcon
              name="i-heroicons-language"
              class="h-4"
            />
            {{ state.language.label }}
          </div>
          <UDivider
            orientation="vertical"
            class="h-5 w-2"
          />
          <div class="text-nowrap font-medium">
            {{ state.currency.label.charAt(0) }}
            ({{ MARKET_CURRENCIES[state.currency.id] }})
          </div>
        </div>
      </div>
    </div>

    <UModal
      v-model="isOpenDialog"
      :ui="{
        margin: '!mb-72',
      }"
    >
      <div class="space-y-6 p-8">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold">
            Update your settings
          </h1>
          <p class="text-base text-customGray-950">
            Set where you live, what language you speak and the currency you use.
          </p>
        </div>

        <UForm
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
                :disabled="isPendingUpdateUser || isPendingGetCountries"
                size="xl"
                :options="regionOpts"
              />
            </UFormGroup>

            <UFormGroup
              label="Language"
              name="language"
              required
              class="mb-4"
            >
              <USelectMenu
                v-model="state.language"
                disabled
                size="xl"
                :options="languageOpts"
              />
            </UFormGroup>

            <UFormGroup
              label="Currency"
              name="currency"
              required
              class="mb-4"
            >
              <USelectMenu
                v-model="state.currency"
                size="xl"
                :disabled="isPendingUpdateUser"
                :options="currencyOpts"
                :ui-menu="{
                  select: '!normal-case',
                  option: { base: '!normal-case' },
                }"
              />
            </UFormGroup>
          </div>

          <div class="flex justify-end gap-3">
            <UButton
              :disabled="isPendingUpdateUser"
              size="lg"
              color="gray"
              @click="isOpenDialog = false"
            >
              Cancel
            </UButton>
            <UButton
              :loading="isPendingUpdateUser"
              size="lg"
              type="submit"
            >
              Save
            </UButton>
          </div>
        </UForm>
      </div>
    </UModal>
  </div>
</template>

<style scoped>

</style>
