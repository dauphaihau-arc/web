import type { Ref } from 'vue';
import { ProductVariantTypes } from '@arc/enums/product';
import { productInventorySchema } from '@arc/schemas/product-inventory.schema';
import type {
  StateCombineVariant,
  StateSingleVariant,
} from '~/domains/shop/api/product/contracts/form.contract';
import {
  DEFAULT_VARIANT_COLUMNS,
  DUPLICATE_ERROR,
  REQUIRED_ERROR,
  REQUIRED_VARIANT_ERROR,
  VARIANT_GROUP_1_FALLBACK_LABEL,
  VARIANT_GROUP_2_FALLBACK_LABEL,
} from './variant-input.constants';
import {
  buildCombineVariantOptions,
  buildSingleVariantOptions,
  createDefaultVariantTable,
  generateVariantOptionId,
  mixVariantsTable,
} from './variant-input.mapper';
import type {
  VariantInputState,
  VariantOption,
  VariantTable,
} from './variant-input.types';

type UseVariantInputOptions = {
  countValidate: Ref<number>
  singleVariantModel: Ref<StateSingleVariant>
  combineVariantModel: Ref<StateCombineVariant>
  variantTypeModel: Ref<ProductVariantTypes>
};

export function useVariantInput({
  countValidate,
  singleVariantModel,
  combineVariantModel,
  variantTypeModel,
}: UseVariantInputOptions) {
  const state = reactive<VariantInputState>({
    variant_group_name: '',
    variant_sub_group_name: '',
    isActiveSubVariant: false,
    variantOption: '',
    errorVariantGroupName: '',
    errorSubVariantOption: '',
    errorVariantSubGroupName: '',
    errorVariantOption: '',
    subVariantOption: '',
    variants: [],
    subVariants: [],
  });

  const variantsTable = ref<VariantTable[]>([createDefaultVariantTable()]);
  const columnsRef = ref(DEFAULT_VARIANT_COLUMNS.map(column => ({ ...column })));

  const columns = computed({
    get() {
      return columnsRef.value;
    },
    set(nextColumns) {
      columnsRef.value = nextColumns;
    },
  });

  const rowsTable = computed(() => variantsTable.value);

  function remapMixedVariantsTable() {
    variantsTable.value = mixVariantsTable(state, variantsTable.value);
  }

  const addVariant = () => {
    const variantOption = {
      id: generateVariantOptionId(),
      variant_name: state.variantOption,
      errorMsg: '',
    };

    state.variants.push(variantOption);

    if (variantsTable.value.length === 1 && !variantsTable.value[0].variant_name) {
      variantsTable.value[0].variant_option_id = variantOption.id;
      variantsTable.value[0].variant_name = state.variantOption;
      state.variantOption = '';
      return;
    }

    if (!state.subVariants.length) {
      const newVariantTable = createDefaultVariantTable({
        id: variantsTable.value.length + 1,
        variant_option_id: variantOption.id,
        variant_name: state.variantOption,
      });

      if (state.isActiveSubVariant) {
        newVariantTable.sub_variant_name = '';
      }
      variantsTable.value.push(newVariantTable);
      state.variantOption = '';
      return;
    }

    remapMixedVariantsTable();
    state.variantOption = '';
  };

  const addSubVariant = () => {
    const subVariantOption = {
      id: generateVariantOptionId(),
      variant_name: state.subVariantOption,
      errorMsg: '',
    };

    state.subVariants.push(subVariantOption);

    if (!variantsTable.value[0].sub_variant_name && variantsTable.value.length === 1) {
      variantsTable.value[0].sub_variant_option_id = subVariantOption.id;
      variantsTable.value[0].sub_variant_name = state.subVariantOption;
      state.subVariantOption = '';
      return;
    }

    if (!state.variants.length) {
      variantsTable.value = state.subVariants.map((subVariant, index) =>
        createDefaultVariantTable({
          id: index + 1,
          sub_variant_option_id: subVariant.id,
          sub_variant_name: subVariant.variant_name,
        }),
      );
      state.subVariantOption = '';
      return;
    }

    remapMixedVariantsTable();
    state.subVariantOption = '';
  };

  const removeVariant = ({ id, variant_name: variantName }: VariantOption) => {
    state.variants = state.variants.filter(variant => variant.id !== id);
    variantsTable.value = variantsTable.value.filter((variant) => {
      if (variant.variant_option_id) {
        return variant.variant_option_id !== id;
      }
      return variant.variant_name !== variantName;
    });
  };

  const removeSubVariant = ({ id, variant_name: variantName }: VariantOption) => {
    state.subVariants = state.subVariants.filter(variant => variant.id !== id);
    variantsTable.value = variantsTable.value.filter((variant) => {
      if (variant.sub_variant_option_id) {
        return variant.sub_variant_option_id !== id;
      }
      return variant.sub_variant_name !== variantName;
    });
  };

  const updateVariantName = (currentVariant: VariantOption, newVariantName: string) => {
    const { id, variant_name: variantName } = currentVariant;

    state.variants = state.variants.map((variant) => {
      if (variant.id === id) {
        return { ...variant, variant_name: newVariantName };
      }
      return variant;
    });

    variantsTable.value = variantsTable.value.map((variant) => {
      if (variant.variant_option_id === id || (!variant.variant_option_id && variant.variant_name === variantName)) {
        return { ...variant, variant_name: newVariantName };
      }
      return variant;
    });
  };

  const updateSubVariantName = (currentVariant: VariantOption, newSubVariantName: string) => {
    const { id, variant_name: variantName } = currentVariant;

    state.subVariants = state.subVariants.map((variant) => {
      if (variant.id === id) {
        return { ...variant, variant_name: newSubVariantName };
      }
      return variant;
    });

    variantsTable.value = variantsTable.value.map((variant) => {
      if (variant.sub_variant_option_id === id || (!variant.sub_variant_option_id && variant.sub_variant_name === variantName)) {
        return { ...variant, sub_variant_name: newSubVariantName };
      }
      return variant;
    });
  };

  const openSubVariant = () => {
    state.isActiveSubVariant = true;
    variantTypeModel.value = ProductVariantTypes.COMBINE;

    columns.value = [
      columns.value[0],
      {
        key: 'sub_variant_name',
        label: VARIANT_GROUP_2_FALLBACK_LABEL,
      },
      ...columns.value.slice(1),
    ];

    if (state.variants.length) {
      variantsTable.value = state.variants.map((variant) => {
        return createDefaultVariantTable({
          variant_option_id: variant.id,
          variant_name: variant.variant_name,
          sub_variant_name: '',
        });
      });
    }
    else {
      variantsTable.value[0].sub_variant_name = '';
    }
  };

  const closeSubVariant = () => {
    state.isActiveSubVariant = false;
    variantTypeModel.value = ProductVariantTypes.SINGLE;

    columns.value = columns.value.filter(col => col.key !== 'sub_variant_name');

    if (state.variants.length) {
      variantsTable.value = state.variants.map((variant, index) => {
        return createDefaultVariantTable({
          id: index + 1,
          variant_option_id: variant.id,
          variant_name: variant.variant_name,
        });
      });
    }
    else {
      variantsTable.value[0].variant_name = '';
    }
  };

  function validateDuplicateOptions(options: VariantOption[], showErrors = true) {
    const variantNameMap = new Map<string, number>();
    let isAnyDuplicateVariantName = false;

    options.forEach((variant, index) => {
      if (showErrors) {
        variant.errorMsg = '';
      }
      const isHasVariantName = variantNameMap.has(variant.variant_name);

      if (!isHasVariantName) {
        variantNameMap.set(variant.variant_name, index);
      }
      else {
        const indexInMap = variantNameMap.get(variant.variant_name);
        if (showErrors) {
          variant.errorMsg = DUPLICATE_ERROR;
        }
        isAnyDuplicateVariantName = true;
        if (indexInMap || indexInMap === 0) {
          if (showErrors) {
            options[indexInMap].errorMsg = DUPLICATE_ERROR;
          }
        }
      }
    });

    return isAnyDuplicateVariantName;
  }

  function validateInventoryRows(showErrors = true) {
    const variantsTableForParse: Pick<VariantTable, 'amount' | 'stock' | 'sku'>[] = [];

    variantsTable.value.forEach((variantTable) => {
      if (showErrors) {
        variantTable.errorAmount = '';
        variantTable.errorStock = '';
      }
      const { stock, amount, sku } = variantTable;
      variantsTableForParse.push({ stock, amount, sku });
    });

    const parsedVariantsTable = productInventorySchema
      .pick({ amount: true, stock: true, sku: true })
      .array()
      .safeParse(variantsTableForParse);

    if (showErrors && !parsedVariantsTable.success) {
      parsedVariantsTable.error.issues.forEach((detail) => {
        const index = detail.path[0] as number;
        const name = detail.path[1];
        if (name === 'amount') {
          variantsTable.value[index].errorAmount = detail.message;
        }
        if (name === 'stock') {
          variantsTable.value[index].errorStock = detail.message;
        }
      });
    }

    return parsedVariantsTable.success;
  }

  function emitData() {
    if (state.isActiveSubVariant) {
      singleVariantModel.value.variant_options = undefined;
      combineVariantModel.value.variant_group_name = state.variant_group_name;
      combineVariantModel.value.variant_sub_group_name = state.variant_sub_group_name;
      combineVariantModel.value.variant_options = buildCombineVariantOptions(variantsTable.value);
    }
    else {
      combineVariantModel.value.variant_options = undefined;
      singleVariantModel.value.variant_group_name = state.variant_group_name;
      singleVariantModel.value.variant_options = buildSingleVariantOptions(variantsTable.value);
    }
  }

  function syncVariantData(showErrors = false) {
    if (showErrors) {
      state.errorVariantGroupName = !state.variant_group_name ? REQUIRED_ERROR : '';
      state.errorVariantOption = state.variants.length === 0 ? REQUIRED_VARIANT_ERROR : '';
      if (state.isActiveSubVariant) {
        state.errorVariantSubGroupName = !state.variant_sub_group_name ? REQUIRED_ERROR : '';
        state.errorSubVariantOption = state.subVariants.length === 0 ? REQUIRED_VARIANT_ERROR : '';
      }
    }

    const isAnyDuplicateVariantName = validateDuplicateOptions(state.variants, showErrors);
    const isInventoryValid = validateInventoryRows(showErrors);

    if (
      state.variants.length > 0
      && (state.isActiveSubVariant ? state.subVariants.length > 0 : true)
      && !isAnyDuplicateVariantName
      && isInventoryValid
    ) {
      emitData();
      return;
    }

    singleVariantModel.value.variant_options = undefined;
    combineVariantModel.value.variant_options = undefined;
  }

  watch(() => [state.variant_group_name, state.variant_sub_group_name], () => {
    columns.value[0].label = state.variant_group_name || VARIANT_GROUP_1_FALLBACK_LABEL;
    if (state.isActiveSubVariant) {
      columns.value[1].label = state.variant_sub_group_name || VARIANT_GROUP_2_FALLBACK_LABEL;
    }
  });

  watch(countValidate, () => syncVariantData(true), { flush: 'sync' });

  watchDebounced(
    () => [
      state.variant_group_name,
      state.variant_sub_group_name,
      state.isActiveSubVariant,
      state.variants,
      state.subVariants,
      variantsTable.value,
    ],
    () => syncVariantData(),
    { debounce: 300, maxWait: 1000, deep: true },
  );

  watchDebounced(
    () => state.variantOption,
    () => {
      state.errorVariantOption = '';
      if (state.variants.length > 0) {
        state.variants.forEach((variant) => {
          variant.errorMsg = '';
          if (variant.variant_name === state.variantOption) {
            variant.errorMsg = DUPLICATE_ERROR;
            state.errorVariantOption = DUPLICATE_ERROR;
          }
        });
      }
    },
    { debounce: 500, maxWait: 1000 },
  );

  watchDebounced(
    () => state.subVariantOption,
    () => {
      state.errorSubVariantOption = '';
      if (state.subVariants.length > 0) {
        state.subVariants.forEach((variant) => {
          variant.errorMsg = '';
          if (variant.variant_name === state.subVariantOption) {
            variant.errorMsg = DUPLICATE_ERROR;
            state.errorSubVariantOption = DUPLICATE_ERROR;
          }
        });
      }
    },
    { debounce: 500, maxWait: 1000 },
  );

  return {
    addSubVariant,
    addVariant,
    closeSubVariant,
    columns,
    openSubVariant,
    removeSubVariant,
    removeVariant,
    rowsTable,
    state,
    updateSubVariantName,
    updateVariantName,
  };
}
