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
      options: [{
        id: 'option-size',
        name: 'Size',
        position: 1,
        values: [],
      }],
      images: [],
      attributes: [],
      variants: [],
      inventory: [],
    };

    expect(normalizeDetailShopProductResponse(response).product.category).toEqual({
      id: 'category-1',
      name: 'Sneakers',
    });
    expect(normalizeDetailShopProductResponse({
      ...response,
      tags: ['sneaker'],
    }).product.tags).toEqual(['sneaker']);
  });

  it('preserves inventory identity before pricing is assigned', () => {
    const response = {
      id: 'product-1',
      shop_id: 'shop-1',
      state: ProductStates.DRAFT,
      title: 'Sneaker',
      slug: 'sneaker',
      description: 'A sneaker.',
      who_made: 'someone_else',
      is_digital: false,
      non_taxable: false,
      options: [{
        id: 'option-color',
        name: 'Color',
        position: 1,
        values: [{ id: 'value-blue', value: 'Blue', position: 1 }],
      }],
      images: [],
      attributes: [],
      variants: [{
        id: 'variant-1',
        selections: [{ option_id: 'option-color', value_id: 'value-blue' }],
        lifecycle_state: 'active' as const,
        rank: 1,
      }],
      inventory: [{
        id: 'inventory-1',
        product_variant_id: 'variant-1',
        stock: 4,
        sku: 'BLUE-S',
      }],
    };

    expect(
      normalizeDetailShopProductResponse(response).product.variants[0].inventory,
    ).toMatchObject({
      id: 'inventory-1',
      stock: 4,
      sku: 'BLUE-S',
    });
  });

  it('derives editor variant rows from normalized option selections', () => {
    const response = {
      id: 'product-1',
      shop_id: 'shop-1',
      product_version: 4,
      state: ProductStates.DRAFT,
      title: 'Sneaker',
      slug: 'sneaker',
      description: 'A sneaker.',
      who_made: 'someone_else',
      is_digital: false,
      non_taxable: false,
      options: [{
        id: 'option-color',
        name: 'Color',
        position: 1,
        values: [{ id: 'value-blue', value: 'Blue', position: 1 }],
      }],
      images: [],
      attributes: [],
      variants: [{
        id: 'variant-1',
        selections: [{ option_id: 'option-color', value_id: 'value-blue' }],
        lifecycle_state: 'active' as const,
        rank: 1,
      }],
      inventory: [{
        id: 'inventory-1',
        product_variant_id: 'variant-1',
        stock: 4,
        sku: 'BLUE-S',
      }],
    };

    const product = normalizeDetailShopProductResponse(response).product;

    expect(product.variant_type).toBe(ProductVariantTypes.SINGLE);
    expect(product.variant_group_name).toBe('Color');
    expect(product.variants[0]).toMatchObject({
      id: 'variant-1',
      variant_name: 'Blue',
      selections: [{ option_id: 'option-color', value_id: 'value-blue' }],
      inventory: {
        id: 'inventory-1',
        stock: 4,
        sku: 'BLUE-S',
      },
    });
  });

  it('normalizes combined variants into option-value groups with leaf selections', () => {
    const response = {
      id: 'product-1',
      shop_id: 'shop-1',
      product_version: 4,
      state: ProductStates.ACTIVE,
      title: 'Sneaker',
      slug: 'sneaker',
      description: 'A sneaker.',
      who_made: 'someone_else',
      is_digital: false,
      non_taxable: false,
      options: [
        {
          id: 'option-size',
          name: 'Size',
          position: 1,
          values: [
            { id: 'value-large', value: 'Large', position: 2 },
            { id: 'value-small', value: 'Small', position: 1 },
          ],
        },
        {
          id: 'option-color',
          name: 'Color',
          position: 2,
          values: [
            { id: 'value-blue', value: 'Blue', position: 2 },
            { id: 'value-red', value: 'Red', position: 1 },
          ],
        },
      ],
      images: [],
      attributes: [],
      variants: [
        {
          id: 'variant-large-blue',
          selections: [
            { option_id: 'option-size', value_id: 'value-large' },
            { option_id: 'option-color', value_id: 'value-blue' },
          ],
          lifecycle_state: 'active' as const,
          rank: 2,
        },
        {
          id: 'variant-small-red',
          selections: [
            { option_id: 'option-size', value_id: 'value-small' },
            { option_id: 'option-color', value_id: 'value-red' },
          ],
          lifecycle_state: 'inactive' as const,
          rank: 1,
        },
      ],
      inventory: [
        {
          id: 'inventory-large-blue',
          product_variant_id: 'variant-large-blue',
          stock: 4,
          sku: 'L-BLUE',
        },
        {
          id: 'inventory-small-red',
          product_variant_id: 'variant-small-red',
          stock: 0,
          sku: 'S-RED',
        },
      ],
    };

    const product = normalizeDetailShopProductResponse(response).product;

    expect(product.variants).toEqual([
      expect.objectContaining({
        id: 'value-small',
        variant_name: 'Small',
        variant_options: [expect.objectContaining({
          id: 'variant-small-red',
          variant: { id: 'value-red', variant_name: 'Red' },
          selections: [
            { option_id: 'option-size', value_id: 'value-small' },
            { option_id: 'option-color', value_id: 'value-red' },
          ],
          lifecycle_state: 'inactive',
          inventory: expect.objectContaining({ id: 'inventory-small-red', stock: 0 }),
        })],
      }),
      expect.objectContaining({
        id: 'value-large',
        variant_name: 'Large',
        variant_options: [expect.objectContaining({
          id: 'variant-large-blue',
          variant: { id: 'value-blue', variant_name: 'Blue' },
          selections: [
            { option_id: 'option-size', value_id: 'value-large' },
            { option_id: 'option-color', value_id: 'value-blue' },
          ],
          lifecycle_state: 'active',
          inventory: expect.objectContaining({ id: 'inventory-large-blue', stock: 4 }),
        })],
      }),
    ]);
  });
});
