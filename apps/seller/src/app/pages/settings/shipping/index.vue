<script setup lang="ts">
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import ShippingProfilesTable from './_components/shipping-profiles-table.vue'
import ShippingProfileListViewTabs from './_components/shipping-profile-list-view-tabs.vue'
import {
  SHIPPING_PROFILE_LIST_VIEWS,
  SHIPPING_PROFILE_LIST_VIEW_STATUSES,
  type ShippingProfileListView,
} from './_components/shipping-profile-list-views'
import ShippingProfileEditorDialog from '~/domains/shop/ui/shipping-profile/shipping-profile-editor-dialog.vue'
import ArchiveShippingProfileDialog from './_components/archive-shipping-profile-dialog.vue'
import { useShopShippingProfiles } from '~/domains/shop/queries/shipping-profiles.query'
import { useSetDefaultShippingProfile } from '~/domains/shop/mutations/shipping-profile.mutation'
import { useGetMyShop } from '~/domains/shop/queries/my-shop.query'
import { toastCustom } from '~/shared/config/toast'
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const pageCount = 20
const page = ref(1)
/**
 * `All` means every listable state — active and draft — following the seller
 * product list. Archived profiles are retained but are not part of the working
 * list, so they have their own view.
 */
const listView = ref<ShippingProfileListView>(SHIPPING_PROFILE_LIST_VIEWS.ALL)
const listStatuses = computed(() => SHIPPING_PROFILE_LIST_VIEW_STATUSES[listView.value])

const modal = useModal()
const toast = useToast()
const { mutateAsync: setDefaultProfile } = useSetDefaultShippingProfile()
const { data, isPending, refetch } = useShopShippingProfiles(computed(() => ({
  page: page.value,
  limit: pageCount,
  status: listStatuses.value,
})))
const { data: myShop } = useGetMyShop()
const profiles = computed(() => data.value?.results ?? [])
const totalProfiles = computed(() => data.value?.total_results ?? 0)

watch(listView, () => {
  page.value = 1
})

/**
 * Archiving the last profile of a page leaves it empty, so step back to the
 * previous page instead of showing a blank table.
 */
watch([() => data.value?.total_results, isPending], ([total, pending]) => {
  if (pending || page.value === 1 || typeof total !== 'number') {
    return
  }

  const lastPage = Math.max(1, Math.ceil(total / pageCount))

  if (page.value > lastPage) {
    page.value = lastPage
  }
})

function openEditor(profile?: ShippingProfileResource) {
  modal.open(ShippingProfileEditorDialog, {
    profile,
    shopCurrency: myShop.value?.currency,
    onSaved: () => refetch(),
  })
}

function openArchive(profile: ShippingProfileResource) {
  modal.open(ArchiveShippingProfileDialog, {
    profile,
    onArchived: () => refetch(),
  })
}

/**
 * The default designation only decides what the Product create form offers; it
 * never assigns a profile to a Product.
 */
async function changeDefault(profile: ShippingProfileResource, isDefault: boolean) {
  try {
    await setDefaultProfile({ id: profile.id, isDefault })
    toast.add({
      ...toastCustom.success,
      title: isDefault ? 'Default shipping profile updated' : 'Default shipping profile cleared',
    })
    await refetch()
  }
  catch {
    toast.add({
      ...toastCustom.error,
      title: 'Unable to update the default shipping profile',
    })
  }
}
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Shipping Profiles
    </template>
    <template #description>
      Create reusable Shipping Profiles and assign them to products.
    </template>
    <template #actions>
      <UButton @click="openEditor()">
        Create Shipping Profile
      </UButton>
    </template>
    <template #content>
      <ShippingProfileListViewTabs
        v-model="listView"
        :counts="data?.status_counts"
      />
      <ShippingProfilesTable
        v-model:page="page"
        :profiles="profiles"
        :loading="isPending"
        :page-count="pageCount"
        :total="totalProfiles"
        @edit="openEditor"
        @archive="openArchive"
        @set-default="profile => changeDefault(profile, true)"
        @clear-default="profile => changeDefault(profile, false)"
      />
    </template>
  </LayoutShopWrapperContent>
</template>
