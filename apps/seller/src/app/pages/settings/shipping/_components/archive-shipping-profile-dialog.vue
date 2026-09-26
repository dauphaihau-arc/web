<script setup lang="ts">
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract'
import { useArchiveShippingProfile } from '~/domains/shop/mutations/shipping-profile.mutation'
import { readShippingProfileApiError } from '~/domains/shop/ui/shipping-profile/shipping-profile-api-error'
import { toastCustom } from '~/shared/config/toast'

const props = defineProps<{
  profile: ShippingProfileResource
}>()

const emit = defineEmits<{
  archived: [profile: ShippingProfileResource]
}>()

const modal = useModal()
const toast = useToast()
const archiveError = ref('')
const { mutateAsync: archiveProfile, isPending } = useArchiveShippingProfile()

async function confirmArchive() {
  archiveError.value = ''
  try {
    const archived = await archiveProfile(props.profile.id)
    toast.add({ ...toastCustom.success, title: 'Shipping profile archived' })
    emit('archived', archived)
    await modal.close()
  }
  catch (error) {
    const apiError = readShippingProfileApiError(error)
    const count = apiError.assignedProductCount
    archiveError.value = count == null
      ? apiError.message ?? 'Unable to archive this Shipping Profile.'
      : `${apiError.message ?? 'This Shipping Profile is still in use.'} Assigned products: ${count}.`
  }
}

const actions = computed(() => [
  {
    id: 'cancel',
    label: 'Cancel',
    variant: 'secondary' as const,
    disabled: isPending,
    run: () => modal.close(),
  },
  {
    id: 'archive',
    label: 'Archive profile',
    variant: 'danger' as const,
    loading: isPending,
    run: confirmArchive,
  },
])
</script>

<template>
  <BaseDialog :actions="actions">
    <div class="space-y-4">
      <div>
        <h2 class="text-xl font-semibold text-text-strong">
          Archive {{ profile.name }}?
        </h2>
        <p class="mt-1 text-sm text-text-muted">
          Archived profiles cannot be assigned to products or used for new shipping quotes.
        </p>
      </div>
      <UAlert
        v-if="archiveError"
        color="red"
        variant="subtle"
        title="Archive blocked"
        :description="archiveError"
      />
      <dl class="grid grid-cols-2 gap-3 rounded-lg border border-border-subtle p-4 text-sm">
        <div>
          <dt class="text-text-muted">
            Assigned products
          </dt>
          <dd class="font-medium">
            {{ profile.assigned_product_count }}
          </dd>
        </div>
        <div>
          <dt class="text-text-muted">
            Published products
          </dt>
          <dd class="font-medium">
            {{ profile.published_product_count }}
          </dd>
        </div>
      </dl>
    </div>
  </BaseDialog>
</template>
