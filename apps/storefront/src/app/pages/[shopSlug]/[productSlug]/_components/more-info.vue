<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { formatMinorCurrency } from '@arc/utils'
import type { MyChatConversation } from '~/domains/me/api/chat/contracts/chat.contract'
import RegisterLoginDialog from '~/domains/auth/ui/login-register/register-login-dialog.vue'
import ChatConversationPanel from '~/domains/me/ui/chat/chat-conversation-panel.vue'
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract'
import { setPostAuthRedirect } from '~/domains/auth/utils/post-auth-redirect'
import { useCreateOrGetMyChatConversation } from '~/domains/me/mutations/chat/create-conversation.mutation'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { useGetCountries } from '~/domains/location/queries/countries.query'
import { useLocaleFormatters } from '~/domains/market/composables/use-locale-formatters'
import { useShippingPreviewCopy } from '~/domains/product/utils/use-shipping-preview-copy'
import { resolveShippingPreviewKind } from '~/shared/utils/shipping-unavailable'

const props = defineProps<{
  product?: GetDetailProductBySlugResponse
  isLoading?: boolean
}>()

const modal = useModal()
const route = useRoute()
const router = useRouter()
const marketStore = useMarketStore()
const isMarketPreferencesOpen = useState<boolean>('market-preferences-dialog-open', () => false)
const { formatDate } = useLocaleFormatters()
const { t } = useI18n()

const { data: currentUser } = useGetCurrentUser()

const {
  mutateAsync: createOrGetConversation,
  isPending: isOpeningChat,
} = useCreateOrGetMyChatConversation()

const isSellerChatOpen = ref(false)
const activeConversation = ref<MyChatConversation | null>(null)
const hasAttemptedAutoOpenChat = ref(false)

const items = computed(() => [
  {
    id: 'info',
    label: t('catalog.product.details'),
    defaultOpen: true,
    content: props.product?.description ?? '',
  },
  {
    id: 'shipping',
    label: t('catalog.product.shippingPolicies'),
    defaultOpen: true,
    content: '',
  },
  {
    id: 'seller',
    label: t('catalog.product.meetSellers'),
    defaultOpen: true,
    content: props.product?.shop.shop_name ?? '',
  },
])

const countryNameByCode = computed(() => new Map(
  (countriesResponse.value ?? [])
    .filter(country => country.code)
    .map(country => [country.code.toUpperCase(), country.name]),
))

function countryLabel(code?: string) {
  if (!code) {
    return ''
  }

  return countryNameByCode.value.get(code.toUpperCase()) ?? code
}

const shippingPreview = computed(() => props.product?.shipping?.preview)

const shippingUnavailableKind = computed(
  () => resolveShippingPreviewKind(shippingPreview.value),
)

const { detail: shippingPreviewDetail } = useShippingPreviewCopy(
  shippingPreview,
  computed(() => marketStore.previewCountryCode
    ? countryLabel(marketStore.previewCountryCode)
    : undefined),
)

const shippingFee = computed(() => {
  const preview = shippingPreview.value
  if (preview?.one_item_fee_minor === undefined || !preview.currency) {
    return ''
  }

  return formatMinorCurrency(preview.one_item_fee_minor, preview.currency)
})

const shippingFrom = computed(() => {
  const country = shippingPreview.value?.ship_from_country
  return country ? countryLabel(country) : ''
})

const deliveryDateRange = computed(() => {
  const estimate = shippingPreview.value?.estimate
  if (!estimate) {
    return ''
  }

  const dateAt = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return formatDate(date, { month: 'short', day: 'numeric' })
  }

  return `${dateAt(estimate.min_days)}-${dateAt(estimate.max_days)}`
})

const shippingCoverage = computed(() => {
  const destinations = props.product?.shipping?.destinations ?? []
  if (destinations.length === 0) {
    return []
  }

  const labels = destinations.map((destination) => {
    switch (destination.destination_scope) {
      case 'everywhere_else':
        return t('catalog.shipping.worldwide')
      case 'country':
        return destination.destination_country
          ? t('catalog.shipping.toCountry', { country: countryLabel(destination.destination_country) })
          : ''
      default:
        return ''
    }
  }).filter(label => label.length > 0)

  return [...new Set(labels)]
})

const { data: countriesResponse } = useGetCountries()

const shouldAutoOpenChat = computed(() => route.query.open_chat === '1')

const productChatRedirectPath = computed(() => {
  return router.resolve({
    path: route.path,
    query: {
      ...route.query,
      open_chat: '1',
    },
  }).fullPath
})

async function showSellerChat() {
  if (!props.product) {
    return
  }

  const conversation = await createOrGetConversation({
    shop_id: props.product.shop.id,
    product_id: props.product.id,
  })

  activeConversation.value = conversation
  isSellerChatOpen.value = true
}

async function openSellerChat() {
  if (!props.product) {
    return
  }

  if (!currentUser.value?.user) {
    setPostAuthRedirect(productChatRedirectPath.value)
    modal.open(RegisterLoginDialog)
    return
  }

  await showSellerChat()
}

watch(
  () => [currentUser.value?.user?.id, shouldAutoOpenChat.value] as const,
  async ([userId, autoOpenChat]) => {
    if (!userId || !autoOpenChat || hasAttemptedAutoOpenChat.value) {
      return
    }

    hasAttemptedAutoOpenChat.value = true
    await showSellerChat()
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="props.isLoading"
    class="space-y-4"
    aria-busy="true"
    aria-live="polite"
  >
    <div
      v-for="index in 3"
      :key="index"
      class="space-y-3 border-b border-border-subtle pb-6"
    >
      <div class="flex items-center justify-between">
        <USkeleton class="h-5 w-40 !bg-surface-skeleton" />
        <USkeleton class="size-5 rounded !bg-surface-skeleton" />
      </div>
      <USkeleton class="h-4 w-full !bg-surface-skeleton" />
      <USkeleton class="h-4 w-5/6 !bg-surface-skeleton" />
    </div>
  </div>

  <div v-else>
    <UAccordion
      color="gray"
      variant="ghost"
      size="sm"
      multiple
      :items="items"
      :ui="{
        wrapper: '-ml-2.5',
        item: {
          padding: 'pl-1 pb-8',
        },
        default: {
          class: 'text-base font-semibold',
        },
      }"
    >
      <template #item="{ item }">
        <div
          v-if="item.id === 'info'"
          class="whitespace-pre-line px-1 text-sm leading-6 text-text-subtle"
        >
          {{ item.content }}
        </div>

        <div
          v-else-if="item.id === 'shipping'"
          data-testid="product-shipping-section"
          class="space-y-2.5 px-1"
        >
          <template v-if="shippingPreview">
            <div
              v-if="shippingPreview.is_digital || !shippingPreview.available"
              class="flex gap-2 font-medium text-text-strong"
            >
              <AppIcon :name="shippingPreview.is_digital ? 'delivered' : 'info'" />
              {{ shippingPreviewDetail }}
            </div>
            <template v-else>
              <div
                v-if="deliveryDateRange"
                class="flex items-start gap-2"
              >
                <AppIcon
                  name="calendar"
                  class="mt-0.5"
                />
                <span>
                  {{ $t('catalog.shipping.orderTodayToGetBy') }}
                  <strong class="font-semibold text-text-strong">{{ deliveryDateRange }}</strong>
                </span>
              </div>
              <div
                v-if="shippingFee"
                class="flex items-start gap-2"
              >
                <AppIcon
                  name="delivered"
                  class="mt-0.5"
                />
                <span>
                  {{ $t('catalog.shipping.costToShip') }}
                  <strong class="font-semibold text-text-strong">{{ shippingFee }}</strong>
                </span>
              </div>
            </template>
            <div
              v-if="shippingFrom"
              class="flex items-start gap-2"
            >
              <AppIcon
                name="location"
                class="mt-0.5"
              />
              <span>
                {{ $t('catalog.shipping.shipsFrom') }}
                <strong class="font-semibold text-text-strong">{{ shippingFrom }}</strong>
              </span>
            </div>
          </template>
          <template v-else>
            <div
              v-for="line in shippingCoverage"
              :key="line"
              class="flex gap-2"
            >
              <AppIcon name="location" />
              {{ line }}
            </div>
            <div
              v-if="shippingCoverage.length === 0"
              class="flex gap-2 text-text-subtle"
            >
              <AppIcon name="location" />
              {{ $t('catalog.shipping.notAvailable') }}
            </div>
          </template>
          <UButton
            v-if="shippingUnavailableKind === 'destination'"
            data-testid="product-shipping-recovery"
            :padded="false"
            variant="link"
            size="sm"
            class="font-medium"
            @click="isMarketPreferencesOpen = true"
          >
            {{ $t('catalog.shipping.recovery.changeRegion') }}
          </UButton>
          <UButton
            v-else-if="shippingUnavailableKind === 'currency'"
            data-testid="product-shipping-recovery"
            :padded="false"
            variant="link"
            size="sm"
            class="font-medium"
            @click="isMarketPreferencesOpen = true"
          >
            {{ $t('catalog.shipping.recovery.changeCurrency') }}
          </UButton>
        </div>

        <div
          v-else-if="item.id === 'seller'"
          class="space-y-3 px-1"
        >
          <div class="text-sm text-text-subtle">
            {{ $t('catalog.seller.questions', { shop: props.product?.shop.shop_name }) }}
          </div>
          <UButton
            color="gray"
            :loading="isOpeningChat"
            @click="openSellerChat"
          >
            {{ $t('catalog.seller.message', { shop: props.product?.shop.shop_name }) }}
          </UButton>
        </div>

        <div
          v-else
          class="whitespace-pre-line px-1 text-sm leading-6 text-text-subtle"
        >
          {{ item.content }}
        </div>
      </template>
    </UAccordion>

    <Teleport to="body">
      <div
        v-if="isSellerChatOpen && activeConversation"
        class="fixed inset-0 z-50"
      >
        <div
          class="absolute inset-0"
          aria-hidden="true"
          @click="isSellerChatOpen = false"
        />

        <div class="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:w-[420px]">
          <div
            class="overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-overlay"
            @click.stop
          >
            <div class="flex items-center justify-between border-b border-border-subtle px-5 py-3">
              <div>
                <div class="text-sm font-semibold text-text-strong">
                  {{ props.product?.shop.shop_name }}
                </div>
                <div class="text-xs text-text-muted">
                  {{ $t('catalog.seller.chatSubtitle') }}
                </div>
              </div>

              <UButton
                color="gray"
                variant="ghost"
                :icon="ICON_NAME_BY_ALIAS['x']"
                :aria-label="$t('catalog.seller.closeChat')"
                class="-mr-2"
                @click="isSellerChatOpen = false"
              />
            </div>

            <div class="h-[min(70vh,640px)]">
              <ChatConversationPanel
                :conversation-id="activeConversation.id"
                :initial-conversation="activeConversation"
                :show-header="false"
                autofocus-composer
                :empty-state-text="$t('catalog.seller.loadingConversation')"
              />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
