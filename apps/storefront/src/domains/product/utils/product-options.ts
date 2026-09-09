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
