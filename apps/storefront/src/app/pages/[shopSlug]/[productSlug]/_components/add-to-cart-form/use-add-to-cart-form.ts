import { computed, reactive, watch } from 'vue';
import type { FormError } from '#ui/types';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';
import { getProductOptionMode } from '~/domains/product/utils/product-options';

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
type ProductOption = AddToCartProduct['options'][number];
type ProductOptionValue = ProductOption['values'][number];

interface VariantSelectOption {
  label: string
  value: string
  disabled: boolean
}

interface UseAddToCartFormOptions {
  product: Ref<AddToCartProduct>
  inventorySelectedModel: Ref<Inventory | undefined>
}

export function useAddToCartForm({
  product,
  inventorySelectedModel,
}: UseAddToCartFormOptions) {
  const stateSubmit = reactive<StateSubmit>({
    quantity: 1,
    variantOption: '',
    variantSubOption: '',
  });

  const optionMode = computed(() => getProductOptionMode(product.value));

  function hasInventoryStock(variantId: string) {
    return product.value.inventory.some(inventory =>
      inventory.product_variant_id === variantId && inventory.stock > 0,
    );
  }

  function variantIncludesSelection(variant: AddToCartProduct['variants'][number], option: ProductOption, value: ProductOptionValue) {
    return variant.selections.some(selection =>
      selection.option_id === option.id && selection.value_id === value.id,
    );
  }

  function hasAvailableVariant(option: ProductOption, value: ProductOptionValue, pairedOption: ProductOption | undefined, pairedValueName: string) {
    const pairedValue = pairedOption?.values.find(item => item.value === pairedValueName);

    return product.value.variants.some((variant) => {
      if (!variantIncludesSelection(variant, option, value) || !hasInventoryStock(variant.id)) {
        return false;
      }

      if (!pairedOption || !pairedValue) {
        return true;
      }

      return variantIncludesSelection(variant, pairedOption, pairedValue);
    });
  }

  function buildSelectOptions(option: ProductOption | undefined, pairedOption: ProductOption | undefined, pairedValueName: string): VariantSelectOption[] {
    if (!option) {
      return [];
    }

    return option.values.map((value) => {
      const disabled = !hasAvailableVariant(option, value, pairedOption, pairedValueName);

      return {
        label: disabled ? `${value.value} (Unavailable)` : value.value,
        value: value.value,
        disabled,
      };
    });
  }

  const variantOptions = computed(() => {
    return buildSelectOptions(
      product.value.options[0],
      optionMode.value === 'combine' ? product.value.options[1] : undefined,
      stateSubmit.variantSubOption,
    );
  });

  const subVariantOptions = computed(() => {
    if (optionMode.value !== 'combine') {
      return [];
    }

    return buildSelectOptions(
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

    const primaryOption = product.value.options[0];
    const secondaryOption = product.value.options[1];
    const selectedPrimaryValue = primaryOption?.values.find(value => value.value === stateSubmit.variantOption);
    const selectedSecondaryValue = secondaryOption?.values.find(value => value.value === stateSubmit.variantSubOption);

    return product.value.inventory.find((inventory) => {
      const variant = product.value.variants.find(item => item.id === inventory.product_variant_id);
      if (!variant || !primaryOption || !selectedPrimaryValue) return false;

      const hasPrimary = variant.selections.some(selection =>
        selection.option_id === primaryOption.id && selection.value_id === selectedPrimaryValue.id,
      );
      const hasSecondary = optionMode.value !== 'combine'
        || Boolean(secondaryOption && selectedSecondaryValue && variant.selections.some(selection =>
          selection.option_id === secondaryOption.id && selection.value_id === selectedSecondaryValue.id,
        ));

      return hasPrimary && hasSecondary;
    });
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

  return {
    decreaseQty,
    increaseQty,
    isOutOfStock,
    maxQuantity,
    resolvedInventorySelected,
    stateSubmit,
    subVariantOptions,
    optionMode,
    validateForm,
    variantOptions,
  };
}
