import type { Category } from '@arc/models/category';
import { resolveStoragePublicUrl } from './storage-public-url';

export const CATEGORY_IMAGE_VARIANTS = {
  RECOMMENDED_1X1: 'recommended_1x1',
  ROOT_2X3: 'root_2x3',
} as const;

export type CategoryImageVariant =
  (typeof CATEGORY_IMAGE_VARIANTS)[keyof typeof CATEGORY_IMAGE_VARIANTS];

export function resolveCategoryImageUrl(
  category: Pick<Category, 'imageUrl' | 'imageStorageKey'>,
  assetHost: string | undefined,
  preferredVariant?: CategoryImageVariant
): string | undefined {
  const variantStorageKey = preferredVariant ?
    buildCategoryVariantStorageKey(category.imageStorageKey, preferredVariant) :
    undefined;

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
  variant: CategoryImageVariant
): string | undefined {
  if (!originalStorageKey) {
    return undefined;
  }

  const segments = originalStorageKey.split('/').filter(Boolean);
  const imageSegmentIndex = segments.lastIndexOf('images');
  const originalSegmentIndex = imageSegmentIndex + 1;

  if (
    imageSegmentIndex === -1 ||
    segments[originalSegmentIndex] !== 'original'
  ) {
    return undefined;
  }

  return [
    ...segments.slice(0, imageSegmentIndex + 1),
    'variants',
    `${variant}.webp`,
  ].join('/');
}
