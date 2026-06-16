import { computed, reactive, watch } from 'vue';
import { ProductVariantTypes } from '@arc/enums/product';
import type { FormError } from '#ui/types';
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract';

interface StateSubmit {
  quantity: number
  variantOption: string
  variantSubOption: string
}

type Inventory = GetDetailProductBySlugResponse['inventory'][number];

interface UseAddToCartFormOptions {
  product: Ref<GetDetailProductBySlugResponse>
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

  const variantOptions = computed(() => {
    return Array.from(
      new Set(
        product.value.inventory
          .map(inventory => inventory.option_value_1)
          .filter((value): value is string => Boolean(value))
      )
    );
  });

  const subVariantOptions = computed(() => {
    if (product.value.variant_type !== ProductVariantTypes.COMBINE || !stateSubmit.variantOption) {
      return [];
    }

    return Array.from(
      new Set(
        product.value.inventory
          .filter(inventory => inventory.option_value_1 === stateSubmit.variantOption)
          .map(inventory => inventory.option_value_2)
          .filter((value): value is string => Boolean(value))
      )
    );
  });

  const resolvedInventorySelected = computed(() => {
    const selectedInventoryId = inventorySelectedModel.value?.id;

    if (selectedInventoryId) {
      return product.value.inventory.find(inventory => inventory.id === selectedInventoryId) ??
        inventorySelectedModel.value;
    }

    if (product.value.variant_type === ProductVariantTypes.NONE) {
      return product.value.inventory[0];
    }

    if (product.value.variant_type === ProductVariantTypes.SINGLE) {
      return product.value.inventory.find(
        inventory => inventory.option_value_1 === stateSubmit.variantOption
      );
    }

    if (product.value.variant_type === ProductVariantTypes.COMBINE) {
      return product.value.inventory.find(
        inventory =>
          inventory.option_value_1 === stateSubmit.variantOption &&
          inventory.option_value_2 === stateSubmit.variantSubOption
      );
    }

    return undefined;
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

    if (product.value.variant_type !== ProductVariantTypes.NONE) {
      if (!stateValidate.variantOption) {
        errors.push({
          path: 'variantOption',
          message: 'Required',
        });
      }

      if (product.value.variant_type === ProductVariantTypes.COMBINE && !stateValidate.variantSubOption) {
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
      inventorySelectedModel.value = undefined;

      if (
        product.value.variant_type === ProductVariantTypes.COMBINE &&
        stateSubmit.variantSubOption &&
        !subVariantOptions.value.includes(stateSubmit.variantSubOption)
      ) {
        stateSubmit.variantSubOption = '';
      }
    }
  );

  watch(
    () => stateSubmit.variantSubOption,
    () => {
      stateSubmit.quantity = 1;
      inventorySelectedModel.value = undefined;
    }
  );

  watch(
    resolvedInventorySelected,
    (inventory) => {
      if (inventory) {
        inventorySelectedModel.value = inventory;
      }
    },
    { immediate: true }
  );

  watch(
    () => product.value.variant_type,
    (variantType) => {
      if (variantType === ProductVariantTypes.NONE) {
        inventorySelectedModel.value = product.value.inventory[0];
      }
    },
    { immediate: true }
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
    { immediate: true }
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
    }
  );

  return {
    decreaseQty,
    increaseQty,
    isOutOfStock,
    maxQuantity,
    resolvedInventorySelected,
    stateSubmit,
    subVariantOptions,
    validateForm,
    variantOptions,
  };
}
