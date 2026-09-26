<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import {
  ShippingDestinationScopes,
  ShippingProfileReadinessLabels,
  ShippingProfileStatuses,
} from '@arc/enums/shipping'
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract'
import { SHIPPING_PROFILE_PICKER_QUERY, useShopShippingProfiles } from '~/domains/shop/queries/shipping-profiles.query'
import FormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'

withDefaults(defineProps<{
  disabled?: boolean
  fallbackProfileName?: string
}>(), {
  disabled: false,
  fallbackProfileName: '',
})

const emit = defineEmits<{
  create: []
  edit: [profile: ShippingProfileResource]
}>()

const model = defineModel<string | undefined>()
const { data, isPending } = useShopShippingProfiles(ref(SHIPPING_PROFILE_PICKER_QUERY))

const profiles = computed(() => data.value?.results ?? [])
const statusRank: Record<string, number> = {
  [ShippingProfileStatuses.ACTIVE]: 0,
  [ShippingProfileStatuses.DRAFT]: 1,
  [ShippingProfileStatuses.ARCHIVED]: 2,
}

const profileOptions = computed(() => [...profiles.value]
  .sort((left, right) => statusRank[left.status] - statusRank[right.status] || left.name.localeCompare(right.name))
  .map(profile => ({
    label: `${profile.name} · ${profile.status}${profile.checkout_ready ? '' : ' · not checkout-ready'}${profile.is_default ? ' · default' : ''}`,
    value: profile.id,
    disabled: profile.status === ShippingProfileStatuses.ARCHIVED,
  })))

const selectedProfile = computed(() => profiles.value.find(profile => profile.id === model.value))

function rateDestination(rate: ShippingProfileResource['rates'][number]) {
  if (rate.destination_scope === ShippingDestinationScopes.COUNTRY) {
    return rate.destination_country ?? 'Country'
  }
  return 'Everywhere else'
}

function rateFee(rate: ShippingProfileResource['rates'][number], profile: ShippingProfileResource) {
  const isFree = rate.one_item_fee_minor === 0 && rate.additional_item_fee_minor === 0
  if (isFree) {
    return 'Free shipping'
  }

  return `${formatMinorCurrency(rate.one_item_fee_minor, profile.currency)} first item · ${formatMinorCurrency(rate.additional_item_fee_minor, profile.currency)} additional`
}

function rateDelivery(rate: ShippingProfileResource['rates'][number]) {
  if (rate.delivery_time_min_days === undefined || rate.delivery_time_max_days === undefined) {
    return 'Delivery time not set'
  }

  return `${rate.delivery_time_min_days}–${rate.delivery_time_max_days} days in transit`
}

function processingTimeLabel(profile: ShippingProfileResource) {
  if (profile.processing_time_min_days === undefined || profile.processing_time_max_days === undefined) {
    return 'Processing time not set'
  }

  return `Processing ${profile.processing_time_min_days}–${profile.processing_time_max_days} days`
}
</script>

<template>
  <section
    id="product-shipping"
    class="scroll-mt-24"
  >
    <FormGroupCard>
      <template #title>
        Shipping
      </template>
      <template #subtitle>
        Assign one reusable Shipping Profile. Editing a profile changes future quotes and delivery estimates for every assigned product.
      </template>
      <template #content>
        <div class="form-field-constrained space-y-4">
          <slot name="before-content" />
          <UFormGroup
            label="Shipping Profile"
            name="shipping_profile_id"
            :required="true"
          >
            <USelectMenu
              v-model="model"
              searchable
              :loading="isPending"
              :disabled="disabled"
              :options="profileOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Select a Shipping Profile"
              size="lg"
            />
          </UFormGroup>

          <div
            v-if="selectedProfile"
            class="rounded-lg border border-border-subtle p-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="font-semibold text-text-strong">
                  {{ selectedProfile.name }}
                </div>
                <div class="flex items-center gap-2">
                  <div class="text-sm capitalize text-text-muted">
                    {{ selectedProfile.status }} · {{ selectedProfile.currency }} · {{ processingTimeLabel(selectedProfile) }}
                  </div>
                  <StatusBadge
                    v-if="selectedProfile.is_default"
                    color="blue"
                  >
                    Default
                  </StatusBadge>
                </div>
              </div>
              <UButton
                type="button"
                color="gray"
                variant="solid"
                :disabled="disabled"
                @click="emit('edit', selectedProfile)"
              >
                Edit profile
              </UButton>
            </div>

            <ul
              v-if="selectedProfile.rates.length"
              class="mt-3 space-y-2 text-sm"
            >
              <li
                v-for="rate in selectedProfile.rates"
                :key="rate.id"
                class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{{ rateDestination(rate) }}</span>
                <span class="text-text-muted">
                  {{ rateFee(rate, selectedProfile) }} · {{ rateDelivery(rate) }}
                </span>
              </li>
            </ul>
            <p
              v-else
              class="mt-3 text-sm text-text-muted"
            >
              No destination rates configured.
            </p>

            <UAlert
              v-if="!selectedProfile.checkout_ready"
              class="mt-3"
              color="yellow"
              variant="subtle"
              title="Not checkout-ready"
              :description="selectedProfile.readiness_issues.map(issue => ShippingProfileReadinessLabels[issue]).join(' · ')"
            />
          </div>
          <UAlert
            v-else-if="model"
            color="yellow"
            variant="subtle"
            title="Profile unavailable"
            :description="fallbackProfileName ? `${fallbackProfileName} is no longer available for assignment.` : 'Select another Shipping Profile.'"
          />

          <div class="flex flex-wrap gap-3">
            <UButton
              type="button"
              color="gray"
              :disabled="disabled"
              @click="emit('create')"
            >
              Create new Shipping Profile
            </UButton>
          </div>
        </div>
      </template>
    </FormGroupCard>
  </section>
</template>
