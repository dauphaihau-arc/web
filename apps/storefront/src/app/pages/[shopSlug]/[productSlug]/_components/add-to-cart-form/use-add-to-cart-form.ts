import { FetchError } from 'ofetch';
import { computed, reactive, watch } from 'vue';
import type { FormError } from '#ui/types';
import type { AddProductToCartRequest, AddProductToCartResponse } from '~/domains/cart/api/contracts/cart.contract';
import { useAddProductToCart } from '~/domains/cart/mutations/add-product.mutation';
import { applyPricedCartUpdate } from '~/domains/cart/utils/apply-priced-cart-update';
import { getAddToCartFailureCopy, resolveAddToCartFailure } from '~/domains/cart/utils/cart-error';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';
import { getBackendErrorMessage } from '~/shared/utils/backend-error';
import { routes } from '~/shared/navigation/routes';
import { toastCustom } from '~/shared/config/toast';
import {
  buildVariantSelectOptions,
  getProductOptionMode,
  resolveInventoryBySelection,
} from '~/domains/product/utils/product-options';

interface StateSubmit {
  quantity: number
  variantOption: string
  variantSubOption: string
}

type Inventory = GetDetailProductBySlugResponse['inventory'][number];
type AddToCartProduct = Pick<
  GetDetailProductBySlugResponse,
  'inventory' | 'options' | 'variants'
>;

interface UseAddToCartFormOptions {
  product: Ref<AddToCartProduct>
  inventorySelectedModel: Ref<Inventory | undefined>
}

export function useAddToCartForm({
  product,
  inventorySelectedModel,
}: UseAddToCartFormOptions) {
  const queryClient = useQueryClient();
  const toast = useToast();

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
          message: 'Required',
        });
      }

      if (optionMode.value === 'combine' && !stateValidate.variantSubOption) {
        errors.push({
          path: 'variantSubOption',
          message: 'Required',
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
    const inventory = resolvedInventorySelected.value;

    if (!inventory?.id) {
      return;
    }

    if (inventory.stock <= 0) {
      toast.add({
        ...toastCustom.error,
        title: 'Out of stock',
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
            title: 'Unable to start checkout',
          });
          return;
        }

        queryClient.setQueryData<AddProductToCartResponse>(
          ['get-cart', response.cart.id],
          oldData => applyPricedCartUpdate(oldData, response) ?? response,
        );
        // eslint-disable-next-line id-length -- `c` is the checkout route's cart param.
        navigateTo(routes.checkout({ c: response.cart.id }));
        return;
      }

      const response = await addProductToCart(body);

      if (response.cart === null) {
        toast.add({
          ...toastCustom.error,
          title: 'Add product to cart failed',
        });
        return;
      }

      queryClient.setQueryData<AddProductToCartResponse>(
        ['get-cart', 'my-cart'],
        oldData => applyPricedCartUpdate(oldData, response) ?? response,
      );
      toast.add({
        ...toastCustom.success,
        title: 'Added to cart',
      });
    }
    catch (error) {
      const failure = resolveAddToCartFailure(error);
      const failureCopy = getAddToCartFailureCopy(failure, { isBuyNow: input.isBuyNow });
      const backendMessage = getBackendErrorMessage(error);

      toast.add({
        ...toastCustom.error,
        title: failureCopy.title,
        description: failureCopy.description ??
          (error instanceof FetchError && !backendMessage
            ? `Request failed with status ${error.status ?? 'unknown'}`
            : undefined),
        ...(failure === 'unknown' && backendMessage
          ? { title: backendMessage }
          : {}),
        ...(error instanceof FetchError && !backendMessage && failure === 'unknown'
          ? { description: `Request failed with status ${error.status ?? 'unknown'}` }
          : {}),
      });
    }
  }

  return {
    decreaseQty,
    increaseQty,
    isOutOfStock,
    isPendingAddProductToCart,
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
