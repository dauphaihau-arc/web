import { ProductVariantTypes } from '@arc/enums/product';
import type { DetailShopProductResponse, ShopProductDetailApiResponse } from '../contracts/read.contract';

export function getProductVariantType(options: readonly unknown[] | undefined) {
  const count = options?.length ?? 0;

  if (count === 0) return ProductVariantTypes.NONE;
  if (count === 1) return ProductVariantTypes.SINGLE;
  return ProductVariantTypes.COMBINE;
}

export function getVariantSelectionValues(
  variant: { name?: string, selections?: Array<{ option_id: string, value_id: string }> },
  options: DetailShopProductResponse['product']['options'] | NonNullable<ShopProductDetailApiResponse['options']>,
) {
  const valueById = new Map<string, string>();

  options.forEach((option) => {
    option.values.forEach((value) => {
      valueById.set(value.id, value.value);
    });
  });

  return (variant.selections ?? [])
    .map(selection => valueById.get(selection.value_id))
    .filter((value): value is string => Boolean(value));
}
