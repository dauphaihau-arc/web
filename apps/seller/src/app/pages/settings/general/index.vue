<script setup lang="ts">
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import WrapperFormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'
import { useGetMyShop } from '~/domains/shop/queries/my-shop.query'
import { useUpdateShopSettings } from '~/domains/shop/mutations/update-shop-settings.mutation'
import { supportedTimeZones } from '~/domains/shop/utils/zoned-local-date-time'
import { toastCustom } from '~/shared/config/toast'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const toast = useToast()
const { data: myShop } = useGetMyShop()
const { mutateAsync: saveSettings, isPending: isSaving } = useUpdateShopSettings()

const timezoneOptions = supportedTimeZones()
const timezone = ref<string>()
const savedTimezone = computed(() => myShop.value?.timezone ?? 'UTC')
const isDirty = computed(() => Boolean(timezone.value) && timezone.value !== savedTimezone.value)

/**
 * The stored value is the source of truth, so it also resets the field after a
 * successful save.
 */
watch(savedTimezone, (value) => {
  timezone.value = value
}, { immediate: true })

async function save() {
  if (!timezone.value) {
    return
  }

  try {
    await saveSettings({ timezone: timezone.value })
    toast.add({
      ...toastCustom.success,
      title: 'Store timezone updated',
    })
  }
  catch (error) {
    toast.add({
      ...toastCustom.error,
      title: 'Could not update the store timezone',
      description: error instanceof Error ? error.message : undefined,
    })
  }
}
</script>

<template>
  <LayoutShopWrapperContent size="form">
    <template #title>
      General
    </template>
    <template #description>
      General settings that apply to your whole store.
    </template>
    <template #content>
      <WrapperFormGroupCard>
        <template #title>
          Timezone
        </template>
        <template #content>
          <UFormGroup
            label="Store timezone"
            name="timezone"
            description="New sales default to this timezone instead of the timezone of whoever is signed in. Each sale keeps the timezone it was created with, so changing this never reschedules a sale you already created."
          >
            <USelectMenu
              v-model="timezone"
              :options="timezoneOptions"
              searchable
              size="lg"
              class="w-96"
            />
          </UFormGroup>
          <UButton
            class="mt-5"
            :loading="isSaving"
            :disabled="!isDirty || isSaving"
            @click="save"
          >
            Save timezone
          </UButton>
        </template>
      </WrapperFormGroupCard>
    </template>
  </LayoutShopWrapperContent>
</template>
