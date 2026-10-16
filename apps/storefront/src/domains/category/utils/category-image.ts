import type { Category } from '@arc/models/category';
import { resolveStoragePublicUrl } from '~/shared/utils/storage-public-url';

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

export function resolveCategoryImageUrl(
  category: Pick<Category, 'imageUrl' | 'imageStorageKey'>,
  assetHost: string | undefined,
  preferredVariant?: CategoryImageVariant,
): string | undefined {
  const variantStorageKey = preferredVariant
    ? buildCategoryVariantStorageKey(category.imageStorageKey, preferredVariant)
    : undefined;

  const variantUrl = resolveStoragePublicUrl({
    storageKey: variantStorageKey,
    assetHost,
  });

  if (variantUrl) {
    return variantUrl;
  }

  return resolveStoragePublicUrl({
    url: category.imageUrl,
    storageKey: category.imageStorageKey,
    assetHost,
  });
}

function buildCategoryVariantStorageKey(
  originalStorageKey: string | undefined,
  variant: CategoryImageVariant,
): string | undefined {
  if (!originalStorageKey) {
    return undefined;
  }

  const segments = originalStorageKey.split('/').filter(Boolean);
  const imageSegmentIndex = segments.lastIndexOf('images');
  const originalSegmentIndex = imageSegmentIndex + 1;

  if (
    imageSegmentIndex === -1
    || segments[originalSegmentIndex] !== 'original'
  ) {
    return undefined;
  }

  return [
    ...segments.slice(0, imageSegmentIndex + 1),
    'variants',
    `${variant}.webp`,
  ].join('/');
}
