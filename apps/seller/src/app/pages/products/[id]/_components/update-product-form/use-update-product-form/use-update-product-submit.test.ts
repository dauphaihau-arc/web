import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  buildDetailPayload,
  saveVariantEditorSubmission,
} from './use-update-product-submit';

describe('saveVariantEditorSubmission', () => {
  it('replaces renamed variants before inventory and pricing with refreshed ids', async () => {
    const setVariants = vi.fn().mockResolvedValue(undefined);
    const setInventory = vi.fn().mockResolvedValue(undefined);
    const setPricing = vi.fn().mockResolvedValue(undefined);
    const detail = vi.fn()
      .mockResolvedValueOnce({
        product: {
          variant_type: 'single',
          variants: [{
            id: 'variant-new',
            variant_name: 'Blue',
            inventory: {},
          }],
        },
      })
      .mockResolvedValueOnce({
        product: {
          variant_type: 'single',
          variants: [{
            id: 'variant-new',
            variant_name: 'Blue',
            inventory: {
              id: 'inventory-new',
              stock: 4,
              sku: 'BLUE-S',
            },
          }],
        },
      });

    await saveVariantEditorSubmission({
      api: {
        detail,
        setInventory,
        setPricing,
        setVariants,
      },
      detailProduct: {
        variant_type: 'single',
        variants: [{
          id: 'variant-old',
          variant_name: 'Red',
          inventory: {
            id: 'inventory-old',
            amount: 10,
            stock: 3,
            sku: 'RED-S',
            currency: 'USD',
          },
        }],
      } as never,
      productId: 'product-1',
      shopId: 'shop-1',
      submission: {
        variantType: 'single',
        rows: [{
          optionValue1: 'Blue',
          amount: 12,
          stock: 4,
          sku: 'BLUE-S',
        }],
      } as never,
    });

    expect(setVariants).toHaveBeenCalledWith('shop-1', 'product-1', {
      variants: [{ option_value_1: 'Blue' }],
    });
    expect(setInventory).toHaveBeenCalledWith('shop-1', 'product-1', {
      inventory: [{
        product_variant_id: 'variant-new',
        stock: 4,
        sku: 'BLUE-S',
      }],
    });
    expect(setPricing).toHaveBeenCalledWith('shop-1', 'product-1', {
      pricing: [{ inventory_id: 'inventory-new', amount_minor: 1200 }],
    });
    expect(setVariants.mock.invocationCallOrder[0])
      .toBeLessThan(setInventory.mock.invocationCallOrder[0]);
    expect(setInventory.mock.invocationCallOrder[0])
      .toBeLessThan(setPricing.mock.invocationCallOrder[0]);
  });

  it('sends every price row when one variant price changes', async () => {
    const api = {
      detail: vi.fn(),
      setInventory: vi.fn(),
      setPricing: vi.fn().mockResolvedValue(undefined),
      setVariants: vi.fn(),
    };
    const detailProduct = {
      variant_type: 'single',
      variants: [
        {
          id: 'variant-red',
          variant_name: 'Red',
          inventory: {
            id: 'inventory-red',
            amount: 10,
            stock: 3,
            currency: 'USD',
          },
        },
        {
          id: 'variant-blue',
          variant_name: 'Blue',
          inventory: {
            id: 'inventory-blue',
            amount: 11,
            stock: 4,
            currency: 'USD',
          },
        },
      ],
    };

    await saveVariantEditorSubmission({
      api,
      detailProduct: detailProduct as never,
      productId: 'product-1',
      shopId: 'shop-1',
      submission: {
        variantType: 'single',
        rows: [
          { optionValue1: 'Red', amount: 12, stock: 3 },
          { optionValue1: 'Blue', amount: 11, stock: 4 },
        ],
      } as never,
    });

    expect(api.setVariants).not.toHaveBeenCalled();
    expect(api.setInventory).not.toHaveBeenCalled();
    expect(api.setPricing).toHaveBeenCalledWith('shop-1', 'product-1', {
      pricing: [
        { inventory_id: 'inventory-red', amount_minor: 1200 },
        { inventory_id: 'inventory-blue', amount_minor: 1100 },
      ],
    });
  });

  it('replaces every inventory row and restores every price after a stock change', async () => {
    const detailProduct = {
      variant_type: 'single',
      variants: [
        {
          id: 'variant-red',
          variant_name: 'Red',
          inventory: {
            id: 'inventory-red',
            amount: 10,
            stock: 3,
            currency: 'USD',
          },
        },
        {
          id: 'variant-blue',
          variant_name: 'Blue',
          inventory: {
            id: 'inventory-blue',
            amount: 11,
            stock: 4,
            currency: 'USD',
          },
        },
      ],
    };
    const api = {
      detail: vi.fn().mockResolvedValue({
        product: {
          ...detailProduct,
          variants: detailProduct.variants.map(variant => ({
            ...variant,
            inventory: {
              ...variant.inventory,
              id: `${variant.inventory.id}-new`,
              amount: undefined,
              currency: undefined,
            },
          })),
        },
      }),
      setInventory: vi.fn().mockResolvedValue(undefined),
      setPricing: vi.fn().mockResolvedValue(undefined),
      setVariants: vi.fn(),
    };

    await saveVariantEditorSubmission({
      api,
      detailProduct: detailProduct as never,
      productId: 'product-1',
      shopId: 'shop-1',
      submission: {
        variantType: 'single',
        rows: [
          { optionValue1: 'Red', amount: 10, stock: 5 },
          { optionValue1: 'Blue', amount: 11, stock: 4 },
        ],
      } as never,
    });

    expect(api.setInventory).toHaveBeenCalledWith('shop-1', 'product-1', {
      inventory: [
        { product_variant_id: 'variant-red', stock: 5, sku: undefined },
        { product_variant_id: 'variant-blue', stock: 4, sku: undefined },
      ],
    });
    expect(api.setPricing).toHaveBeenCalledWith('shop-1', 'product-1', {
      pricing: [
        { inventory_id: 'inventory-red-new', amount_minor: 1000 },
        { inventory_id: 'inventory-blue-new', amount_minor: 1100 },
      ],
    });
  });
});

describe('buildDetailPayload', () => {
  it('includes tags so update submit persists them', () => {
    expect(buildDetailPayload({
      tags: ['sneaker', 'black'],
    })).toEqual({
      tags: ['sneaker', 'black'],
    });
  });
});
