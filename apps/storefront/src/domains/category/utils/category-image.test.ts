import { describe, expect, it } from 'vitest';
import { CATEGORY_IMAGE_VARIANTS, resolveCategoryImageUrl } from './category-image';

const rootVariantUrl = 'https://cdn.example.com/categories/uuid/images/variants/root_2x3.webp';
const squareVariantUrl = 'https://cdn.example.com/categories/uuid/images/variants/recommended_1x1.webp';

describe('resolveCategoryImageUrl', () => {
  it('uses the field the API resolved for the requested variant', () => {
    const category = { imageUrl: rootVariantUrl, imageUrl1x1: squareVariantUrl };

    expect(resolveCategoryImageUrl(category, CATEGORY_IMAGE_VARIANTS.ROOT_2X3))
      .toBe(rootVariantUrl);
    expect(resolveCategoryImageUrl(category, CATEGORY_IMAGE_VARIANTS.RECOMMENDED_1X1))
      .toBe(squareVariantUrl);
  });

  it('falls back to the other variant when one was never generated', () => {
    expect(
      resolveCategoryImageUrl(
        { imageUrl: rootVariantUrl },
        CATEGORY_IMAGE_VARIANTS.RECOMMENDED_1X1,
      ),
    ).toBe(rootVariantUrl);

    expect(
      resolveCategoryImageUrl(
        { imageUrl1x1: squareVariantUrl },
        CATEGORY_IMAGE_VARIANTS.ROOT_2X3,
      ),
    ).toBe(squareVariantUrl);
  });

  it('returns undefined when the category has no image at all', () => {
    expect(resolveCategoryImageUrl({}, CATEGORY_IMAGE_VARIANTS.ROOT_2X3))
      .toBeUndefined();
  });
});
