import { describe, expect, it } from 'vitest';
import { ProductStates, ProductVariantTypes } from '@arc/enums/product';
import { normalizeDetailShopProductResponse } from './detail-shop-product.normalizer';

describe('normalizeDetailShopProductResponse', () => {
  it('preserves the category name from shop product detail responses', () => {
    const response = {
      id: 'product-1',
      public_id: 'public-product-1',
      shop_id: 'shop-1',
      shop_public_id: 'public-shop-1',
      state: ProductStates.ACTIVE,
      category_id: 'category-1',
      category: {
        id: 'category-1',
        name: 'Sneakers',
      },
      title: 'Zoom Cortez x sacai',
      slug: 'zoom-cortez-x-sacai',
      description: 'A sneaker.',
      who_made: 'someone_else',
      is_digital: false,
      non_taxable: false,
      variant_type: ProductVariantTypes.SINGLE,
      variant_group_name: 'Size',
      images: [],
      attributes: [],
      variants: [],
      inventory: [],
    };

    expect(normalizeDetailShopProductResponse(response).product.category).toEqual({
      id: 'category-1',
      name: 'Sneakers',
    });
  });
});
