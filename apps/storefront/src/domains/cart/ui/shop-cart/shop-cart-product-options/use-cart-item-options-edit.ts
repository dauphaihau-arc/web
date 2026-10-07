import {
  computed, ref, watch, type Ref,
} from 'vue';
import { useUpdateCart } from '~/domains/cart/mutations/update-cart.mutation';
import { useCartStore } from '~/domains/cart/stores/cart.store';
import { applyPricedCartUpdate } from '~/domains/cart/utils/apply-priced-cart-update';
import { buildCartAdjustments } from '~/domains/cart/utils/cart-adjustments';
import { resolveCartVariantMerge } from '~/domains/cart/utils/cart-variant-merge';
import { useGetDetailProductBySlug } from '~/domains/product/queries/detail-by-slug.query';
import {
  buildVariantSelectOptions,
  getProductOptionMode,
  resolveInventoryBySelection,
} from '~/domains/product/utils/product-options';
import { getBackendErrorCode, getBackendErrorMessage } from '~/shared/utils/backend-error';
import { toastCustom } from '~/shared/config/toast';
import type { CartProductItem } from '~/domains/cart/api/cart.shared';
import type { GetCartResponse, UpdateCartRequest } from '~/domains/cart/api/contracts/cart.contract';

/**
 * Editing one cart line's variant. Resolves the product's option selects and
 * the inventory the current selection maps to, and reports whether that change
 * replaces the line or merges it into a sibling shop line that already holds the
 * variant. Owns the single write path — one PATCH that also carries the shop's
 * promo codes — plus the panel error raised when a merge overflows stock.
 *
 * The product's detail loads lazily: the query is enabled by the picker being
 * open, and its cached payload is served on later opens.
 */
export function useCartItemOptionsEdit(input: {
  productCart: Ref<CartProductItem>
  siblingItems: Ref<CartProductItem[]>
}) {
  const cartStore = useCartStore();
  const queryClient = useQueryClient();
  const toast = useToast();

  const open = ref(false);
  const selectedValues = ref<string[]>([]);
  const panelError = ref('');

  const {
    mutateAsync: updateCart,
    isPending: isPendingUpdate,
  } = useUpdateCart({ onError: undefined });

  const {
    data: dataProduct,
    isPending: isPendingProduct,
    isError: isErrorProduct,
  } = useGetDetailProductBySlug(
    input.productCart.value.product.shop.slug,
    input.productCart.value.product.slug,
    undefined,
    open,
  );

  const product = computed(() => dataProduct.value);
  const optionMode = computed(() => (product.value ? getProductOptionMode(product.value) : 'none'));

  const selectedOptionsLabel = computed(() =>
    input.productCart.value.inventory.selected_options
      .map(option => `${option.option_name}: ${option.value}`)
      .join(', '));

  const variantOptions = computed(() => {
    if (!product.value) {
      return [];
    }

    return buildVariantSelectOptions(
      product.value,
      product.value.options[0],
      optionMode.value === 'combine' ? product.value.options[1] : undefined,
      selectedValues.value[1] ?? '',
    );
  });

  const subVariantOptions = computed(() => {
    if (!product.value || optionMode.value !== 'combine') {
      return [];
    }

    return buildVariantSelectOptions(
      product.value,
      product.value.options[1],
      product.value.options[0],
      selectedValues.value[0] ?? '',
    );
  });

  const targetInventory = computed(() => (product.value
    ? resolveInventoryBySelection(product.value, selectedValues.value)
    : undefined));

  const mergeState = computed(() => resolveCartVariantMerge({
    siblingItems: input.siblingItems.value,
    selfItemId: input.productCart.value.id,
    targetInventoryId: targetInventory.value?.id,
    movedQuantity: input.productCart.value.quantity,
    availableStock: targetInventory.value?.stock,
  }));

  const canApply = computed(() =>
    Boolean(targetInventory.value)
    && targetInventory.value?.id !== input.productCart.value.inventory.id
    && !mergeState.value.exceedsStock
    && !isPendingUpdate.value);

  const canApplyReduced = computed(() =>
    Boolean(targetInventory.value)
    && targetInventory.value?.id !== input.productCart.value.inventory.id
    && mergeState.value.exceedsStock
    && mergeState.value.maxAddableQuantity > 0
    && !isPendingUpdate.value);

  /** Mirrors the cart's own values into the selects on open and after each write. */
  watch(
    [product, open, () => input.productCart.value.inventory.id],
    () => {
      if (!product.value) {
        return;
      }

      selectedValues.value = product.value.options.map((option) => {
        const current = input.productCart.value.inventory.selected_options.find(item =>
          (item.option_id && item.option_id === option.id) || item.option_name === option.name,
        );

        return current?.value ?? '';
      });
    },
    { immediate: true },
  );

  watch(selectedValues, () => {
    panelError.value = '';
  });

  function cancel() {
    panelError.value = '';
    open.value = false;
  }

  async function apply(replacementQuantity?: number) {
    const target = targetInventory.value;

    if (!target || target.id === input.productCart.value.inventory.id) {
      open.value = false;
      return;
    }

    const quantity = replacementQuantity ?? input.productCart.value.quantity;
    const body: UpdateCartRequest = {
      inventory_id: input.productCart.value.inventory.id,
      replace_with_inventory_id: target.id,
      quantity,
    };

    const adjustments = buildCartAdjustments(cartStore.additionInfoShopCarts);
    if (adjustments.length > 0) {
      body.addition_info_shop_carts = adjustments;
    }

    const mergingItem = mergeState.value.mergeItem;
    const mergedTotal = (mergingItem?.quantity ?? 0) + quantity;

    try {
      const data = await updateCart(body);

      queryClient.setQueryData<GetCartResponse>(
        ['get-cart', 'my-cart'],
        oldData => applyPricedCartUpdate(oldData, data),
      );
      panelError.value = '';
      open.value = false;
      toast.add({
        ...toastCustom.success,
        title: mergingItem
          ? `Merged into your existing line — ${mergedTotal} total`
          : 'Product options updated',
      });
    }
    catch (error) {
      // Stock can drop between the picker's snapshot and the write; the panel
      // states that instead of closing behind a toast.
      if (getBackendErrorCode(error) === 'CART_QUANTITY_EXCEEDS_STOCK') {
        panelError.value = 'Not enough stock to merge into that line. Reduce the quantity and try again.';
        return;
      }

      toast.add({
        ...toastCustom.error,
        title: getBackendErrorMessage(error) ?? 'Update product options failed',
      });
    }
  }

  return {
    open,
    panelError,
    product,
    isPendingProduct,
    isErrorProduct,
    optionMode,
    selectedOptionsLabel,
    selectedValues,
    variantOptions,
    subVariantOptions,
    mergeState,
    canApply,
    canApplyReduced,
    isPendingUpdate,
    cancel,
    apply,
  };
}
