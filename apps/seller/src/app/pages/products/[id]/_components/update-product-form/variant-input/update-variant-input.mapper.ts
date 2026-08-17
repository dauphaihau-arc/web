// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/naming-convention */
import { ProductVariantTypes } from '@arc/enums/product';
import type {
  UpdateProductBody,
  UpdateVariantOptions,
} from '~/domains/shop/api/product/contracts/form.contract';
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
          variant_name: variant.variant_name || '',
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
        variant => variant.variant_name === stateVariant.variant_name
          && variant.sub_variant_name === stateSubVariant.variant_name,
      );

      newVariantsTable.push({
        id,
        variant_name: stateVariant.variant_name || '',
        sub_variant_name: stateSubVariant.variant_name || '',
        subVariantId: state.variantsCurrent.get(stateSubVariant.variant_name),
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

export function buildUpdateVariantChangePayload(
  state: UpdateVariantInputState,
  variantsTable: UpdateVariantTable[],
): UpdateProductBody {
  const variant_inventories: UpdateProductBody['variant_inventories'] = [];
  const new_single_variants: UpdateProductBody['new_single_variants'] = [];
  const update_variants: UpdateProductBody['update_variants'] = [];
  let new_combine_variants: UpdateProductBody['new_combine_variants'] = [];

  if (state.isActiveSubVariant) {
    new_combine_variants = Object.entries<UpdateVariantOptions[]>(
      variantsTable
        .filter(variant => !variant.inventoryId)
        .reduce((acc, variant) => {
          const {
            amount, sku, stock, variant_name: variantName, sub_variant_name: subVariantName, subVariantId,
          } = variant;

          if (!acc[variantName]) {
            acc[variantName] = [];
          }
          acc[variantName].push({
            amount,
            sku,
            stock,
            variant: subVariantId,
            variant_name: subVariantName,
          });
          return acc;
        }, {}),
    ).map(([variantName, variantOptions]) => ({
      variant_name: variantName,
      variant_options: variantOptions,
    }));
  }

  variantsTable.forEach((variant) => {
    const {
      isUpdated, inventoryId, amount, stock, sku, variant_name: variantName,
    } = variant;

    if (!amount) {
      return;
    }

    if (isUpdated && inventoryId) {
      variant_inventories.push({
        id: inventoryId,
        amount,
        stock,
        sku: sku || '',
      });
    }
    if (!state.isActiveSubVariant && !inventoryId) {
      new_single_variants.push({
        variant_name: variantName,
        amount,
        stock,
        sku: sku || '',
      });
    }
  });

  state.variants.forEach((variant) => {
    if (state.variantsCurrent.has(variant.id)) {
      if (state.variantsCurrent.get(variant.id) !== variant.variant_name) {
        update_variants.push({
          id: variant.id,
          variant_name: variant.variant_name,
        });
      }
    }
  });

  if (state.isActiveSubVariant) {
    state.subVariants.forEach((variant) => {
      if (
        state.variantsCurrent.has(variant.id)
        && state.variantsCurrent.get(variant.id) !== variant.variant_name
      ) {
        update_variants.push({
          id: variant.id,
          variant_name: variant.variant_name,
        });
      }
    });
  }

  if (state.variantIdsDelete.length > 0) {
    state.variantIdsDelete.forEach((id) => {
      if (state.variantsCurrent.has(id)) {
        update_variants.push({ id });
      }
    });
  }

  return {
    update_variants,
    variant_inventories,
    new_single_variants,
    new_combine_variants,
  };
}
