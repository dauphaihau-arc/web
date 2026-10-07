import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';

export type ProductSelection = Pick<
  GetDetailProductBySlugResponse['variants'][number]['selections'][number],
  'option_id' | 'value_id'
>;

export function getProductOptionMode(product: Pick<GetDetailProductBySlugResponse, 'options'>) {
  if (product.options.length === 0) return 'none';
  if (product.options.length === 1) return 'single';
  return 'combine';
}

export function getInventorySelectionLabel(
  inventory: Pick<GetDetailProductBySlugResponse['inventory'][number], 'product_variant_id'> | undefined,
  product: Pick<GetDetailProductBySlugResponse, 'options' | 'variants'>,
) {
  const variant = product.variants.find(item => item.id === inventory?.product_variant_id);
  if (!variant || variant.selections.length === 0) return '';

  return variant.selections
    .map((selection) => {
      const option = product.options.find(item => item.id === selection.option_id);
      const value = option?.values.find(item => item.id === selection.value_id);
      return option && value ? `${option.name}: ${value.value}` : undefined;
    })
    .filter((value): value is string => Boolean(value))
    .join(', ');
}

type DetailProduct = Pick<GetDetailProductBySlugResponse, 'options' | 'variants' | 'inventory'>;
type ProductOption = DetailProduct['options'][number];
type ProductOptionValue = ProductOption['values'][number];

export interface VariantSelectOption {
  label: string
  value: string
  disabled: boolean
}

function variantIncludesSelection(
  variant: DetailProduct['variants'][number],
  option: ProductOption,
  value: ProductOptionValue,
) {
  return variant.selections.some(
    selection => selection.option_id === option.id && selection.value_id === value.id,
  );
}

/**
 * Builds the selectable values of one product option. A value is offered only
 * when some active variant pairs it with the already-selected value of the
 * paired option and that variant has stock; otherwise the value is returned
 * disabled so the shopper sees it exists but cannot pick it.
 */
export function buildVariantSelectOptions(
  product: DetailProduct,
  option: ProductOption | undefined,
  pairedOption: ProductOption | undefined,
  pairedValueName: string,
): VariantSelectOption[] {
  if (!option) {
    return [];
  }

  const pairedValue = pairedOption?.values.find(item => item.value === pairedValueName);

  return option.values.map((value) => {
    const available = product.variants.some((variant) => {
      if (!variantIncludesSelection(variant, option, value)) {
        return false;
      }

      const hasStock = product.inventory.some(inventory =>
        inventory.product_variant_id === variant.id && inventory.stock > 0,
      );

      if (!hasStock) {
        return false;
      }

      if (!pairedOption || !pairedValue) {
        return true;
      }

      return variantIncludesSelection(variant, pairedOption, pairedValue);
    });

    return {
      label: available ? value.value : `${value.value} (Unavailable)`,
      value: value.value,
      disabled: !available,
    };
  });
}

/**
 * Resolves the inventory row whose variant matches every option value name, in
 * option order. The add-to-cart form exposes at most the first two options, so
 * only those participate; any of them without a selection yields undefined.
 */
export function resolveInventoryBySelection(
  product: DetailProduct,
  selectionValues: string[],
): DetailProduct['inventory'][number] | undefined {
  const selectableOptions = product.options.slice(0, 2);
  const valueByOptionId = new Map<string, ProductOptionValue>();

  selectableOptions.forEach((option, index) => {
    const value = option.values.find(item => item.value === selectionValues[index]);
    if (value) {
      valueByOptionId.set(option.id, value);
    }
  });

  return product.inventory.find((inventory) => {
    const variant = product.variants.find(item => item.id === inventory.product_variant_id);
    if (!variant) {
      return false;
    }

    return selectableOptions.every((option) => {
      const value = valueByOptionId.get(option.id);
      if (!value) {
        return false;
      }

      return variantIncludesSelection(variant, option, value);
    });
  });
}
