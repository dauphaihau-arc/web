import { FetchError } from 'ofetch';
import { computed, reactive, watch } from 'vue';
import type { FormError } from '#ui/types';
import type { AddProductToCartRequest, AddProductToCartResponse } from '~/domains/cart/api/contracts/cart.contract';
import { useAddProductToCart } from '~/domains/cart/mutations/add-product.mutation';
import { applyPricedCartUpdate } from '~/domains/cart/utils/apply-priced-cart-update';
import { getAddToCartFailureCopy, resolveAddToCartFailure } from '~/domains/cart/utils/cart-error';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';
import { getBackendErrorMessage } from '~/shared/utils/backend-error';
import { reportApiError } from '~/shared/utils/api-error-copy';
import { useErrorCopy } from '~/shared/composables/use-error-copy';
import { routes } from '~/shared/navigation/routes';
import { useLocalizedRoute } from '~/shared/composables/use-localized-route';
import { toastCustom } from '~/shared/config/toast';
import {
  buildVariantSelectOptions,
  getProductOptionMode,
  resolveInventoryBySelection,
} from '~/domains/product/utils/product-options';
import { resolveShippingPreviewKind } from '~/shared/utils/shipping-unavailable';

interface StateSubmit {
  quantity: number
  variantOption: string
  variantSubOption: string
}

type Inventory = GetDetailProductBySlugResponse['inventory'][number];
type AddToCartProduct = Pick<
  GetDetailProductBySlugResponse,
  'inventory' | 'options' | 'variants'
> & {
  shipping?: GetDetailProductBySlugResponse['shipping']
};

type Translate = (key: string, named?: Record<string, string | number>) => string;

interface UseAddToCartFormOptions {
  product: Ref<AddToCartProduct>
  inventorySelectedModel: Ref<Inventory | undefined>
  /**
   * Locale translator supplied by the form component. The composable can be
   * exercised outside a component setup (unit tests), where `useI18n` has no
   * instance, so the caller owns locale resolution and this falls back to the
   * key itself.
   */
  translate?: Translate
}

export function useAddToCartForm({
  product,
  inventorySelectedModel,
  translate = key => key,
}: UseAddToCartFormOptions) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const errorT = useErrorCopy();
  const { localizePath } = useLocalizedRoute();

  const {
    mutateAsync: addProductToCart,
    isPending: isPendingAddProductToCart,
  } = useAddProductToCart({ showErrorToast: false });

  const stateSubmit = reactive<StateSubmit>({
    quantity: 1,
    variantOption: '',
    variantSubOption: '',
  });

  const optionMode = computed(() => getProductOptionMode(product.value));

  const variantOptions = computed(() => buildVariantSelectOptions(
    product.value,
    product.value.options[0],
    optionMode.value === 'combine' ? product.value.options[1] : undefined,
    stateSubmit.variantSubOption,
  ));

  const subVariantOptions = computed(() => {
    if (optionMode.value !== 'combine') {
      return [];
    }

    return buildVariantSelectOptions(
      product.value,
      product.value.options[1],
      product.value.options[0],
      stateSubmit.variantOption,
    );
  });

  function resolveInventoryFromCurrentProduct() {
    const currentSelection = inventorySelectedModel.value;

    if (!currentSelection) {
      return undefined;
    }

    const inventoryById = product.value.inventory.find(inventory => inventory.id === currentSelection.id);

    if (inventoryById) {
      return inventoryById;
    }

    if (optionMode.value === 'none') {
      return product.value.inventory[0];
    }

    return product.value.inventory.find((inventory) => {
      const variant = product.value.variants.find(item => item.id === inventory.product_variant_id);
      return variant?.id === currentSelection.product_variant_id;
    });
  }

  const resolvedInventorySelected = computed(() => {
    const resolvedFromCurrentProduct = resolveInventoryFromCurrentProduct();

    if (resolvedFromCurrentProduct) {
      return resolvedFromCurrentProduct;
    }

    if (optionMode.value === 'none') {
      return product.value.inventory[0];
    }

    return resolveInventoryBySelection(product.value, [
      stateSubmit.variantOption,
      stateSubmit.variantSubOption,
    ]);
  });

  const maxQuantity = computed(() => {
    if (resolvedInventorySelected.value) {
      return resolvedInventorySelected.value.stock;
    }

    return product.value.inventory.reduce((acc, inventory) => acc + inventory.stock, 0);
  });

  const isOutOfStock = computed(() => maxQuantity.value <= 0);

  /**
   * A destination or currency preview failure is recoverable from the buyer's
   * side, so only an internal/unclassified failure blocks the purchase.
   */
  const isPurchaseBlocked = computed(
    () => resolveShippingPreviewKind(product.value.shipping?.preview) === 'unavailable',
  );

  const decreaseQty = () => {
    if (stateSubmit.quantity <= 1) {
      stateSubmit.quantity = 1;
      return;
    }

    stateSubmit.quantity--;
  };

  const increaseQty = () => {
    if (maxQuantity.value <= 0 || stateSubmit.quantity >= maxQuantity.value) {
      return;
    }

    stateSubmit.quantity++;
  };

  const validateForm = (stateValidate: StateSubmit): FormError[] => {
    const errors: FormError[] = [];

    if (optionMode.value !== 'none') {
      if (!stateValidate.variantOption) {
        errors.push({
          path: 'variantOption',
          message: translate('catalog.form.required'),
        });
      }

      if (optionMode.value === 'combine' && !stateValidate.variantSubOption) {
        errors.push({
          path: 'variantSubOption',
          message: translate('catalog.form.required'),
        });
      }
    }

    return errors;
  };

  watch(
    () => stateSubmit.variantOption,
    () => {
      stateSubmit.quantity = 1;
    },
  );

  watch(
    () => stateSubmit.variantSubOption,
    () => {
      stateSubmit.quantity = 1;
    },
  );

  watch(
    resolvedInventorySelected,
    (inventory) => {
      inventorySelectedModel.value = inventory;
    },
    { immediate: true },
  );

  watch(
    optionMode,
    (variantType) => {
      if (variantType === 'none') {
        inventorySelectedModel.value = product.value.inventory[0];
      }
    },
    { immediate: true },
  );

  watch(
    maxQuantity,
    (nextMaxQuantity) => {
      if (nextMaxQuantity <= 0) {
        stateSubmit.quantity = 1;
        return;
      }

      if (stateSubmit.quantity > nextMaxQuantity) {
        stateSubmit.quantity = nextMaxQuantity;
      }
    },
    { immediate: true },
  );

  watch(
    () => stateSubmit.quantity,
    (nextQuantity) => {
      if (!Number.isFinite(nextQuantity) || nextQuantity <= 1) {
        stateSubmit.quantity = 1;
        return;
      }

      if (maxQuantity.value > 0 && nextQuantity > maxQuantity.value) {
        stateSubmit.quantity = maxQuantity.value;
      }
    },
  );

  /**
   * The form's single write path. Buy Now creates a temp cart and hands off to
   * checkout; otherwise the product joins the active cart, whose cached order is
   * preserved so the added line lands last instead of jumping to the top.
   */
  async function submit(input: { quantity: number, isBuyNow: boolean }) {
    if (isPurchaseBlocked.value) {
      toast.add({
        ...toastCustom.error,
        title: translate('catalog.toasts.shippingUnavailable'),
      });
      return;
    }

    const inventory = resolvedInventorySelected.value;

    if (!inventory?.id) {
      return;
    }

    if (inventory.stock <= 0) {
      toast.add({
        ...toastCustom.error,
        title: translate('catalog.toasts.outOfStock'),
      });
      return;
    }

    const body: AddProductToCartRequest = {
      inventory_id: inventory.id,
      quantity: input.quantity,
    };

    try {
      if (input.isBuyNow) {
        body.is_temp = true;
        const response = await addProductToCart(body);

        if (response.cart === null || !response.cart?.id) {
          toast.add({
            ...toastCustom.error,
            title: translate('catalog.toasts.unableCheckout'),
          });
          return;
        }

        queryClient.setQueryData<AddProductToCartResponse>(
          ['get-cart', response.cart.id],
          oldData => applyPricedCartUpdate(oldData, response) ?? response,
        );
        // eslint-disable-next-line id-length -- `c` is the checkout route's cart param.
        navigateTo(localizePath(routes.checkout({ c: response.cart.id })));
        return;
      }

      const response = await addProductToCart(body);

      if (response.cart === null) {
        toast.add({
          ...toastCustom.error,
          title: translate('catalog.toasts.addFailed'),
        });
        return;
      }

      queryClient.setQueryData<AddProductToCartResponse>(
        ['get-cart', 'my-cart'],
        oldData => applyPricedCartUpdate(oldData, response) ?? response,
      );
      toast.add({
        ...toastCustom.success,
        title: translate('catalog.toasts.added'),
      });
    }
    catch (error) {
      const failure = resolveAddToCartFailure(error);
      const failureCopy = getAddToCartFailureCopy(failure, { isBuyNow: input.isBuyNow, t: errorT });
      const backendMessage = getBackendErrorMessage(error);
      const requestFailedDescription = error instanceof FetchError && !backendMessage
        ? translate('catalog.toasts.requestFailed', {
          status: error.status ?? translate('catalog.toasts.unknownStatus'),
        })
        : undefined;

      reportApiError(error, 'add-to-cart');

      toast.add({
        ...toastCustom.error,
        title: failureCopy.title,
        description: failureCopy.description ?? requestFailedDescription,
      });
    }
  }

  return {
    decreaseQty,
    increaseQty,
    isOutOfStock,
    isPendingAddProductToCart,
    isPurchaseBlocked,
    maxQuantity,
    resolvedInventorySelected,
    stateSubmit,
    subVariantOptions,
    optionMode,
    submit,
    validateForm,
    variantOptions,
  };
}
