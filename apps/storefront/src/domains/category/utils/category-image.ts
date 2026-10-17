import type { Category } from '@arc/models/category';

export const CATEGORY_IMAGE_VARIANTS = {
  RECOMMENDED_1X1: 'recommended_1x1',
  ROOT_2X3: 'root_2x3',
} as const;

export type CategoryImageVariant =
  (typeof CATEGORY_IMAGE_VARIANTS)[keyof typeof CATEGORY_IMAGE_VARIANTS];

/**
 * Intrinsic box of each variant, mirrored from the API image pipeline
 * (`CATEGORY_IMAGE_VARIANT_SPECS`). Keeping it next to the variant name lets
 * `<NuxtImg>` reserve the correct box before the file loads.
 */
export const CATEGORY_IMAGE_VARIANT_SIZES: Record<
  CategoryImageVariant,
  { width: number, height: number }
> = {
  [CATEGORY_IMAGE_VARIANTS.RECOMMENDED_1X1]: { width: 200, height: 200 },
  [CATEGORY_IMAGE_VARIANTS.ROOT_2X3]: { width: 420, height: 630 },
};

/**
 * Selects the URL the API resolved for the requested variant.
 *
 * `image_url` already points at the `root_2x3` variant, falling back to the
 * untouched original when no variant was generated. The 1:1 variant has its own
 * field, so this is the single place that maps a variant onto a response field.
 */
export function resolveCategoryImageUrl(
  category: Pick<Category, 'imageUrl' | 'imageUrl1x1'>,
  preferredVariant?: CategoryImageVariant,
): string | undefined {
  if (preferredVariant === CATEGORY_IMAGE_VARIANTS.RECOMMENDED_1X1) {
    return category.imageUrl1x1 ?? category.imageUrl;
  }

  return category.imageUrl ?? category.imageUrl1x1;
}
