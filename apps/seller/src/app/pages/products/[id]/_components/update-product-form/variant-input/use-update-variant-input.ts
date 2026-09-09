// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { z } from 'zod';
import { ProductVariantTypes } from '@arc/enums/product';
import { productInventorySchema } from '@arc/schemas/product-inventory.schema';
import { log } from '@arc/lib';
import type { IOnChangeUpdateVariants } from '../use-update-product-form/update-product-form.types';
import type { ProductSkuConflict } from '../use-update-product-form/use-update-product-submit/product-section-state';
import {
  DEFAULT_UPDATE_VARIANT_COLUMNS,
  DUPLICATE_ERROR,
  REQUIRED_ERROR,
  REQUIRED_VARIANT_ERROR,
  VARIANT_GROUP_1_FALLBACK_LABEL,
  VARIANT_GROUP_2_FALLBACK_LABEL,
} from './update-variant-input.constants';
import {
  buildVariantEditorSnapshot,
  buildVariantEditorSubmission,
  createDefaultUpdateVariantTable,
  generateUpdateVariantOptionId,
  generateExpandedSku,
  hydrateUpdateVariantInput,
  mixUpdateVariantsTable,
  trackDeletedVariantOption,
} from './update-variant-input.mapper';
import type {
  UpdateVariantInputState,
  UpdateVariantOption,
  UpdateVariantTable,
  VariantEditorProduct,
} from './update-variant-input.types';

const updateVariantInventorySchema = productInventorySchema
  .pick({ amount: true, stock: true })
  .extend({ sku: z.string().optional() })
  .array();

type UseUpdateVariantInputOptions = {
  countValidate: Ref<number>
  product: Readonly<Ref<VariantEditorProduct>>
  skuConflicts?: Readonly<Ref<ProductSkuConflict[] | undefined>>
  emitChange: (value: IOnChangeUpdateVariants | null) => void
  emitVariantsUpdated: (value: boolean) => void
};

export function validateUpdateVariantInventoryRows(
  rows: Pick<UpdateVariantTable, 'amount' | 'stock' | 'sku'>[],
) {
  return updateVariantInventorySchema.safeParse(rows);
}

export function useUpdateVariantInput({
  countValidate,
  product,
  emitChange,
  emitVariantsUpdated,
  skuConflicts,
}: UseUpdateVariantInputOptions) {
  const initialEditorSnapshot = ref<string>();

  const state = reactive<UpdateVariantInputState>({
    isActiveSubVariant: false,
    variantOption: '',
    subVariantOption: '',
    errorVariantGroupName: '',
    errorSubVariantOption: '',
    errorVariantSubGroupName: '',
    errorVariantOption: '',
    variants: [],
    subVariants: [],
    variantIdsDelete: [],
    variantsCurrent: new Map(),
  });

  const variantsTable = ref<UpdateVariantTable[]>([createDefaultUpdateVariantTable()]);
  const rowsBeforeSubVariantOpen = ref<UpdateVariantTable[]>();

  function cloneVariantRows(rows: UpdateVariantTable[]) {
    return rows.map(row => ({ ...row }));
  }

  function restoreRowsBeforeSubVariantOpen() {
    if (!rowsBeforeSubVariantOpen.value) {
      return false;
    }

    variantsTable.value = cloneVariantRows(rowsBeforeSubVariantOpen.value);
    rowsBeforeSubVariantOpen.value = undefined;
    return true;
  }
  const columnsRef = ref(DEFAULT_UPDATE_VARIANT_COLUMNS.map(column => ({ ...column })));

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
    variantsTable.value = mixUpdateVariantsTable(state, variantsTable.value);
  }

  function collapseMixedVariantsTable() {
    variantsTable.value = state.variants.map((variant, index) => {
      const source = variantsTable.value.find(row =>
        row.variant_option_id === variant.id || row.variant_name === variant.variant_name,
      );

      return createDefaultUpdateVariantTable({
        id: index + 1,
        variant_option_id: variant.id,
        variant_name: variant.variant_name,
        productVariantId: null,
        optionId1: source?.optionId1,
        optionValueId1: source?.optionValueId1,
        inventoryId: null,
        currency: source?.currency,
        sourceSku: source?.sourceSku,
      });
    });
  }

  const addVariant = () => {
    const variantOption = {
      id: generateUpdateVariantOptionId(),
      variant_name: state.variantOption,
      errorMsg: '',
    };

    state.variants.push(variantOption);

    if (variantsTable.value.length === 1 && !variantsTable.value[0].variant_name) {
      const source = variantsTable.value[0];
      variantsTable.value[0].variant_option_id = variantOption.id;
      variantsTable.value[0].variant_name = state.variantOption;
      variantsTable.value[0].stock = 0;
      variantsTable.value[0].sku = generateExpandedSku(source.sourceSku ?? source.sku, state.variantOption);
      variantsTable.value[0].sourceSku = source.sourceSku ?? source.sku;
      state.variantOption = '';
      return;
    }

    if (!state.subVariants.length) {
      const source = variantsTable.value[0];
      const newVariantTable = createDefaultUpdateVariantTable({
        id: variantsTable.value.length + 1,
        variant_option_id: variantOption.id,
        variant_name: state.variantOption,
        amount: source.amount,
        stock: 0,
        sku: generateExpandedSku(source.sourceSku ?? source.sku, state.variantOption),
        sourceSku: source.sourceSku ?? source.sku,
        currency: source.currency,
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
      id: generateUpdateVariantOptionId(),
      variant_name: state.subVariantOption,
      errorMsg: '',
    };

    state.subVariants.push(subVariantOption);

    if (!variantsTable.value[0].sub_variant_name && variantsTable.value.length === 1 && !state.variants.length) {
      variantsTable.value[0].sub_variant_option_id = subVariantOption.id;
      variantsTable.value[0].sub_variant_name = state.subVariantOption;
      state.subVariantOption = '';
      return;
    }

    if (!state.variants.length) {
      variantsTable.value = state.subVariants.map((subVariant, index) =>
        createDefaultUpdateVariantTable({
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

  const removeVariant = ({ id, variant_name: variantName }: UpdateVariantOption) => {
    trackDeletedVariantOption(state, id);
    state.variants = state.variants.filter(variant => variant.id !== id);
    variantsTable.value = variantsTable.value.filter((variant) => {
      if (variant.variant_option_id) {
        return variant.variant_option_id !== id;
      }
      return variant.variant_name !== variantName;
    });
  };

  const removeSubVariant = ({ id, variant_name: variantName }: UpdateVariantOption) => {
    trackDeletedVariantOption(state, id);
    state.subVariants = state.subVariants.filter(variant => variant.id !== id);

    if (!state.subVariants.length && restoreRowsBeforeSubVariantOpen()) {
      state.isActiveSubVariant = false;
      columns.value = columns.value.filter(col => col.key !== 'sub_variant_name');
      delete state.variant_sub_group_name;
      return;
    }
    variantsTable.value = variantsTable.value.filter((variant) => {
      if (variant.sub_variant_option_id) {
        return variant.sub_variant_option_id !== id;
      }
      return variant.sub_variant_name !== variantName;
    });
  };

  const updateVariantName = (currentVariant: UpdateVariantOption, newVariantName: string) => {
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

  const updateSubVariantName = (currentVariant: UpdateVariantOption, newSubVariantName: string) => {
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

  const onChangeInputTable = (event: Event, row: UpdateVariantTable) => {
    const target = event.target as HTMLInputElement;
    const name = target.name;
    let value: string | number = target.value;

    if (name === 'amount' || name === 'stock') {
      value = Number(value);
    }
    if (row.id) {
      variantsTable.value[row.id - 1][name] = value;
      variantsTable.value[row.id - 1].isUpdated = true;
      if (name === 'sku') {
        variantsTable.value[row.id - 1].errorSku = '';
      }
    }
  };

  function openSubVariant() {
    if (!state.isActiveSubVariant) {
      rowsBeforeSubVariantOpen.value = cloneVariantRows(variantsTable.value);
    }
    state.isActiveSubVariant = true;

    columns.value = [
      columns.value[0],
      {
        key: 'sub_variant_name',
        label: state.variant_sub_group_name || VARIANT_GROUP_2_FALLBACK_LABEL,
      },
      ...columns.value.slice(1),
    ];

    if (state.variants.length) {
      variantsTable.value = state.variants.map((variant) => {
        const source = variantsTable.value.find(row =>
          row.variant_option_id === variant.id || row.variant_name === variant.variant_name,
        );

        return createDefaultUpdateVariantTable({
          variant_option_id: variant.id,
          variant_name: variant.variant_name,
          optionId1: source?.optionId1,
          optionValueId1: source?.optionValueId1,
          inventoryId: source?.inventoryId,
          amount: source?.amount,
          stock: source?.stock ?? 0,
          sku: source?.sku,
          sourceSku: source?.sourceSku ?? source?.sku,
          currency: source?.currency,
          sub_variant_name: '',
        });
      });
    }
    else {
      variantsTable.value[0].sub_variant_name = '';
    }
  }

  const closeSubVariant = () => {
    state.isActiveSubVariant = false;

    columns.value = columns.value.filter(col => col.key !== 'sub_variant_name');

    if (restoreRowsBeforeSubVariantOpen()) {
      return;
    }

    if (state.variants.length) {
      collapseMixedVariantsTable();
    }
    else {
      variantsTable.value[0].variant_name = '';
    }
  };

  function validateDuplicateOptions(options: UpdateVariantOption[]) {
    const variantNameMap = new Map<string, number>();
    let isAnyDuplicateVariantName = false;

    options.forEach((variant, index) => {
      variant.errorMsg = '';
      const isHasVariantName = variantNameMap.has(variant.variant_name);

      if (!isHasVariantName) {
        variantNameMap.set(variant.variant_name, index);
      }
      else {
        const indexInMap = variantNameMap.get(variant.variant_name);
        variant.errorMsg = DUPLICATE_ERROR;
        isAnyDuplicateVariantName = true;
        if (indexInMap || indexInMap === 0) {
          options[indexInMap].errorMsg = DUPLICATE_ERROR;
        }
      }
    });

    return isAnyDuplicateVariantName;
  }

  function validateInventoryRows() {
    const variantsTableForParse: Pick<UpdateVariantTable, 'amount' | 'stock' | 'sku'>[] = [];

    variantsTable.value.forEach((variantTable) => {
      variantTable.errorAmount = '';
      variantTable.errorStock = '';
      const { stock, amount, sku } = variantTable;
      variantsTableForParse.push({ stock, amount, sku });
    });

    const parsedVariantsTable = validateUpdateVariantInventoryRows(variantsTableForParse);

    if (!parsedVariantsTable.success) {
      parsedVariantsTable.error.issues.forEach((detail) => {
        const index = detail.path[0];
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

  function applySkuConflicts(conflicts: ProductSkuConflict[] = []) {
    variantsTable.value.forEach((row, index) => {
      row.errorSku = '';
      const clientRef = row.productVariantId ? undefined : `variant-${index + 1}`;
      const rowSku = row.sku?.trim().toLocaleLowerCase();
      const hasConflict = conflicts.some((conflict) => {
        const conflictSku = conflict.sku?.trim().toLocaleLowerCase();
        return (conflict.inventoryId && conflict.inventoryId === row.inventoryId)
          || (conflict.variantId && conflict.variantId === row.productVariantId)
          || (conflict.clientRef && conflict.clientRef === clientRef)
          || (conflictSku && conflictSku === rowSku);
      });

      if (hasConflict) {
        row.errorSku = 'SKU already used';
      }
    });
  }

  function canEmitEditorSubmission() {
    const hasUniqueNames = (options: UpdateVariantOption[]) => {
      const names = options.map(option => option.variant_name.trim());
      return names.every(Boolean) && new Set(names).size === names.length;
    };
    const inventoryResult = validateUpdateVariantInventoryRows(variantsTable.value);
    const checks = {
      groupName: Boolean(state.variant_group_name?.trim()),
      inventory: inventoryResult.success,
      optionNames: hasUniqueNames(state.variants),
      subGroupName: !state.isActiveSubVariant
        || Boolean(state.variant_sub_group_name?.trim()),
      subOptionNames: !state.isActiveSubVariant
        || hasUniqueNames(state.subVariants),
    };

    log.info('[update-variant-input] validity checks', {
      checks,
      failedChecks: Object.entries(checks)
        .filter(([, passed]) => !passed)
        .map(([name]) => name),
      inventoryIssues: inventoryResult.success ? [] : inventoryResult.error.issues,
    });

    return Object.values(checks).every(Boolean);
  }

  function emitData() {
    const variantSubmission = buildVariantEditorSubmission(state, variantsTable.value);

    if (state.isActiveSubVariant && state.variant_group_name && state.variant_sub_group_name) {
      emitChange({
        variant_type: ProductVariantTypes.COMBINE,
        variant_group_name: state.variant_group_name,
        variant_sub_group_name: state.variant_sub_group_name,
        variantSubmission,
      });
    }
    else if (state.variant_group_name) {
      emitChange({
        variant_type: ProductVariantTypes.SINGLE,
        variant_group_name: state.variant_group_name,
        variantSubmission,
      });
    }
  }

  watch(product, async (currentProduct, _previousProduct, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    initialEditorSnapshot.value = undefined;
    state.variantsCurrent.clear();
    state.isActiveSubVariant = false;
    state.subVariants = [];
    columns.value = DEFAULT_UPDATE_VARIANT_COLUMNS.map(column => ({ ...column }));
    rowsBeforeSubVariantOpen.value = undefined;


    variantsTable.value = hydrateUpdateVariantInput(currentProduct, state, openSubVariant);
    rowsBeforeSubVariantOpen.value = undefined;
    await nextTick();
    applySkuConflicts(skuConflicts?.value);
    if (cancelled) {
      return;
    }
    initialEditorSnapshot.value = buildVariantEditorSnapshot(state, variantsTable.value);
    emitVariantsUpdated(false);
  }, { immediate: true });

  watch(
    () => skuConflicts?.value,
    conflicts => applySkuConflicts(conflicts),
    { immediate: true },
  );

  watch(() => [state.variant_group_name, state.variant_sub_group_name], () => {
    columns.value[0].label = state.variant_group_name || VARIANT_GROUP_1_FALLBACK_LABEL;
    if (state.isActiveSubVariant) {
      columns.value[1].label = state.variant_sub_group_name || VARIANT_GROUP_2_FALLBACK_LABEL;
    }
  });

  watch(countValidate, () => {
    state.errorVariantGroupName = !state.variant_group_name ? REQUIRED_ERROR : '';
    state.errorVariantOption = state.variants.length === 0 ? REQUIRED_VARIANT_ERROR : '';
    if (state.isActiveSubVariant) {
      state.errorVariantSubGroupName = !state.variant_sub_group_name ? REQUIRED_ERROR : '';
      state.errorSubVariantOption = state.subVariants.length === 0 ? REQUIRED_VARIANT_ERROR : '';
    }

    const isAnyDuplicateVariantName = validateDuplicateOptions(state.variants);
    const isInventoryValid = validateInventoryRows();

    if (
      state.variants.length > 0
      && (state.isActiveSubVariant ? state.subVariants.length > 0 : true)
      && !isAnyDuplicateVariantName
      && isInventoryValid
    ) {
      emitData();
    }
    else {
      emitChange(null);
    }
  });

  watch(() => [state, variantsTable.value], () => {
    if (initialEditorSnapshot.value === undefined) {
      return;
    }

    emitVariantsUpdated(
      buildVariantEditorSnapshot(state, variantsTable.value) !== initialEditorSnapshot.value,
    );
    if (canEmitEditorSubmission()) {
      emitData();
    }
    else {
      emitChange(null);
    }
  }, { deep: true, flush: 'post' });

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
    onChangeInputTable,
    openSubVariant,
    removeSubVariant,
    removeVariant,
    rowsTable,
    state,
    updateSubVariantName,
    updateVariantName,
  };
}
