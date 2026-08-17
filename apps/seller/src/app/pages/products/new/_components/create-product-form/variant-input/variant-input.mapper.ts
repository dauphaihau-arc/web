import type { NoUndefinedField } from '@arc/contracts/utils';
import type {
  VariantOption as ProductVariantOption,
} from '~/domains/shop/api/product/contracts/form.contract';
import type { VariantInputState, VariantTable } from './variant-input.types';
import { DEFAULT_VARIANT_TABLE } from './variant-input.constants';

export function generateVariantOptionId() {
  return new Date().getTime();
}

export function createDefaultVariantTable(overrides: Partial<VariantTable> = {}): VariantTable {
  return {
    ...DEFAULT_VARIANT_TABLE,
    ...overrides,
  };
}

export function mixVariantsTable(
  state: Pick<VariantInputState, 'variants' | 'subVariants'>,
  variantsTable: VariantTable[],
) {
  let id = 0;
  const newVariantsTable: VariantTable[] = [];

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

export function buildSingleVariantOptions(variantsTable: VariantTable[]) {
  return variantsTable.map((variantTable) => {
    const {
      amount, sku, stock, variant_name: variantName,
    } = variantTable as NoUndefinedField<VariantTable>;

    return {
      amount,
      sku,
      stock,
      variant_name: variantName,
    };
  });
}

export function buildCombineVariantOptions(variantsTable: VariantTable[]) {
  const variantsTableAsObj = variantsTable.reduce((acc, variant) => {
    const {
      amount, sku, stock, variant_name: variantName, sub_variant_name: subVariantName,
    } = variant as NoUndefinedField<VariantTable>;

    if (!acc[variantName]) {
      acc[variantName] = [];
    }

    acc[variantName].push({
      amount,
      sku,
      stock,
      variant_name: subVariantName,
    });

    return acc;
  }, {} as Record<NonNullable<ProductVariantOption['variant_name']>, Pick<NoUndefinedField<VariantTable>, 'amount' | 'sku' | 'stock' | 'variant_name'>[]>);

  return Object.entries(variantsTableAsObj).map(([variantName, variantOptions]) => ({
    variant_name: variantName,
    variant_options: variantOptions,
  }));
}
