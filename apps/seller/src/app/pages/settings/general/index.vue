<script setup lang="ts">
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import WrapperFormRow from '~/shared/ui/wrapper-form-row.vue'
import WrapperFormRows from '~/shared/ui/wrapper-form-rows.vue'
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

/**
 * The stored value is the source of truth, so it also resets the field after a
 * successful save and after a failed one.
 */
watch(savedTimezone, (value) => {
  timezone.value = value
}, { immediate: true })

/**
 * Selecting a timezone saves immediately. The select is disabled while the
 * request is in flight so responses cannot land out of order.
 */
async function onTimezoneChange(value: string) {
  if (!value || value === savedTimezone.value) {
    return
  }

  try {
    await saveSettings({ timezone: value })
    toast.add({
      ...toastCustom.success,
      title: 'Store timezone updated',
    })
  }
  catch (error) {
    timezone.value = savedTimezone.value
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
      <WrapperFormRows>
        <WrapperFormRow
          label="Shop timezone"
          description="Set the timezone new sales are created in."
        >
          <USelectMenu
            v-model="timezone"
            :options="timezoneOptions"
            :disabled="isSaving"
            :loading="isSaving"
            searchable
            size="lg"
            class="w-full md:ms-auto md:max-w-52"
            @update:model-value="onTimezoneChange"
          />
        </WrapperFormRow>
      </WrapperFormRows>
    </template>
  </LayoutShopWrapperContent>
</template>
