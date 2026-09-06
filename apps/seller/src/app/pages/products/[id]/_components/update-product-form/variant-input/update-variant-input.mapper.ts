// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/naming-convention */
import { ProductVariantTypes } from '@arc/enums/product';
import type { VariantEditorSubmission } from '../update-product-form.types';
import type {
  UpdateVariantInputState,
  UpdateVariantTable,
  VariantEditorProduct,
} from './update-variant-input.types';
import { DEFAULT_UPDATE_VARIANT_TABLE } from './update-variant-input.constants';

export function generateUpdateVariantOptionId() {
  return new Date().getTime().toString();
}

export function createDefaultUpdateVariantTable(
  overrides: Partial<UpdateVariantTable> = {},
): UpdateVariantTable {
  return {
    ...DEFAULT_UPDATE_VARIANT_TABLE,
    ...overrides,
  };
}

export function hydrateUpdateVariantInput(
  product: VariantEditorProduct,
  state: UpdateVariantInputState,
  openSubVariant: () => void,
) {
  const { variant_type, variant_group_name: variantGroupName, variants } = product;

  state.variants = variants.map((variant) => {
    state.variantsCurrent.set(variant.id, variant.variant_name);
    state.variantsCurrent.set(variant.variant_name, variant.id);
    return {
      id: variant.id,
      variant_name: variant.variant_name,
      errorMsg: '',
    };
  });

  if (variant_type === ProductVariantTypes.SINGLE) {
    state.variant_group_name = variantGroupName;
    return variants.map((variant, index) => ({
      id: index + 1,
      variant_option_id: variant.id,
      inventoryId: variant.inventory.id,
      variant_name: variant.variant_name || '',
      amount: variant.inventory.amount,
      stock: variant.inventory.stock,
      sku: variant.inventory?.sku || '',
      isUpdated: false,
      errorAmount: '',
      errorStock: '',
    }));
  }

  if (variant_type === ProductVariantTypes.COMBINE) {
    state.variant_group_name = variantGroupName;
    state.variant_sub_group_name = product.variant_sub_group_name;
    openSubVariant();
    state.subVariants = variants[0].variant_options.map((variantOpt) => {
      state.variantsCurrent.set(variantOpt.variant.id, variantOpt.variant.variant_name);
      state.variantsCurrent.set(variantOpt.variant.variant_name, variantOpt.variant.id);
      return {
        id: variantOpt.variant.id,
        variant_name: variantOpt.variant.variant_name,
        errorMsg: '',
      };
    });

    let id = 0;
    const initVariantsTable: UpdateVariantTable[] = [];
    variants.forEach((variant) => {
      variant.variant_options.forEach((variantOpt) => {
        id++;
        initVariantsTable.push({
          id,
          variant_option_id: variant.id,
          variant_name: variant.variant_name || '',
          sub_variant_option_id: variantOpt.variant.id,
          sub_variant_name: variantOpt.variant.variant_name || '',
          subVariantId: variantOpt.variant.id,
          inventoryId: variantOpt.inventory.id,
          amount: variantOpt.inventory.amount,
          stock: variantOpt.inventory.stock,
          sku: variantOpt.inventory?.sku || '',
          errorAmount: '',
          errorStock: '',
        });
      });
    });

    return initVariantsTable;
  }

  return [createDefaultUpdateVariantTable()];
}

export function mixUpdateVariantsTable(
  state: Pick<UpdateVariantInputState, 'variants' | 'subVariants' | 'variantsCurrent'>,
  variantsTable: UpdateVariantTable[],
) {
  let id = 0;
  const newVariantsTable: UpdateVariantTable[] = [];

  state.variants.forEach((stateVariant) => {
    state.subVariants.forEach((stateSubVariant) => {
      id++;
      const result = variantsTable.find(
        variant => variant.variant_option_id === stateVariant.id
          && variant.sub_variant_option_id === stateSubVariant.id,
      ) ?? variantsTable.find(
        variant => variant.variant_name === stateVariant.variant_name
          && variant.sub_variant_name === stateSubVariant.variant_name,
      );

      newVariantsTable.push({
        id,
        variant_option_id: stateVariant.id,
        variant_name: stateVariant.variant_name || '',
        sub_variant_option_id: stateSubVariant.id,
        sub_variant_name: stateSubVariant.variant_name || '',
        subVariantId: state.variantsCurrent.has(stateSubVariant.id)
          ? stateSubVariant.id as string
          : null,
        inventoryId: result?.inventoryId || null,
        amount: result?.amount || undefined,
        stock: result?.stock || 0,
        sku: result?.sku || '',
        errorAmount: '',
        errorStock: '',
      });
    });
  });

  return newVariantsTable;
}

export function buildVariantEditorSnapshot(
  state: UpdateVariantInputState,
  variantsTable: UpdateVariantTable[],
) {
  return JSON.stringify({
    isActiveSubVariant: state.isActiveSubVariant,
    variantGroupName: state.variant_group_name ?? '',
    variantSubGroupName: state.variant_sub_group_name ?? '',
    variants: state.variants.map(({ id, variant_name: variantName }) => ({
      id,
      variantName,
    })),
    subVariants: state.subVariants.map(({ id, variant_name: variantName }) => ({
      id,
      variantName,
    })),
    variantIdsDelete: state.variantIdsDelete,
    inventory: variantsTable.map(row => ({
      id: row.id,
      variantOptionId: row.variant_option_id,
      subVariantOptionId: row.sub_variant_option_id,
      inventoryId: row.inventoryId,
      variantName: row.variant_name ?? '',
      subVariantName: row.sub_variant_name ?? '',
      amount: row.amount,
      stock: row.stock,
      sku: row.sku ?? '',
    })),
  });
}

export function buildVariantEditorSubmission(
  state: UpdateVariantInputState,
  variantsTable: UpdateVariantTable[],
): VariantEditorSubmission {
  return {
    variantType: state.isActiveSubVariant
      ? ProductVariantTypes.COMBINE
      : ProductVariantTypes.SINGLE,
    rows: variantsTable.map(row => ({
      optionValue1: row.variant_name ?? '',
      optionValue2: state.isActiveSubVariant
        ? row.sub_variant_name ?? ''
        : undefined,
      amount: row.amount!,
      stock: row.stock!,
      sku: row.sku || undefined,
    })),
  };
}
