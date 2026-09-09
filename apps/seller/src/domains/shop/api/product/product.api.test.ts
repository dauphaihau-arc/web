import {
  describe, expect, it, vi,
} from 'vitest';
import { shopProductApi } from './product.api';
import { apiClient } from '~/domains/_shared/api-client';
import type { CreateDraftProductRequest } from './contracts/create-draft.contract';

vi.mock('~/domains/_shared/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('./normalizers/detail-shop-product.normalizer', () => ({
  normalizeDetailShopProductResponse: vi.fn(response => response),
}));

describe('shopProductApi.createDraft', () => {
  it('sends the create draft idempotency key as a header', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ id: 'product-1' });

    const payload = {
      idempotency_key: 'draft-key-1',
      category_id: 'category-1',
      title: 'Donner bag',
      description: 'Donner bag',
      who_made: 'i_did',
      is_digital: false,
      non_taxable: false,
      options: [],
      variants: [{ client_ref: 'default', selections: [], lifecycle_state: 'active' }],
      inventory: [{ variant_client_key: 'default', stock: 1 }],
      pricing: [{ variant_client_key: 'default', amount_minor: 19900, currency: 'USD' }],
      shipping: {
        origin_country: 'DZ',
        origin_zip: '700000',
        process_time_label: '1d',
        destinations: [{
          country_code: 'DZ',
          delivery_time_label: '6-13d',
          service: 'other',
          charge_type: 'free_shipping',
        }],
      },
    } as CreateDraftProductRequest;

    await shopProductApi.createDraft('shop-1', payload);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/shops/shop-1/products/drafts',
      {
        category_id: 'category-1',
        title: 'Donner bag',
        description: 'Donner bag',
        who_made: 'i_did',
        is_digital: false,
        non_taxable: false,
        options: [],
        variants: [{ client_ref: 'default', selections: [], lifecycle_state: 'active' }],
        inventory: [{ variant_client_key: 'default', stock: 1 }],
        pricing: [{ variant_client_key: 'default', amount_minor: 19900, currency: 'USD' }],
        shipping: {
          origin_country: 'DZ',
          origin_zip: '700000',
          process_time_label: '1d',
          destinations: [{
            country_code: 'DZ',
            delivery_time_label: '6-13d',
            service: 'other',
            charge_type: 'free_shipping',
          }],
        },
      },
      {
        headers: {
          'Idempotency-Key': 'draft-key-1',
        },
      },
    );
  });
});

describe('shopProductApi.updateDetails', () => {
  it('sends product version in the body and idempotency key as a header', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ id: 'product-1' });

    await shopProductApi.updateDetails('shop-1', 'product-1', {
      product_version: 4,
      idempotency_key: 'details-key-1',
      title: 'Updated title',
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/shops/shop-1/products/product-1/details',
      {
        product_version: 4,
        title: 'Updated title',
      },
      {
        headers: {
          'Idempotency-Key': 'details-key-1',
        },
      },
    );
  });
});

describe('shopProductApi.setVariantConfiguration', () => {
  it('sends the normalized configuration idempotency key as a header', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ id: 'product-1' });

    await shopProductApi.setVariantConfiguration('shop-1', 'product-1', {
      product_version: 3,
      idempotency_key: 'configuration-key-1',
      options: [],
      variants: [{ id: 'variant-1', selections: [], lifecycle_state: 'active' }],
      removed_variant_ids: [],
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      '/shops/shop-1/products/product-1/variant-configuration',
      {
        product_version: 3,
        options: [],
        variants: [{ id: 'variant-1', selections: [], lifecycle_state: 'active' }],
        removed_variant_ids: [],
      },
      {
        headers: {
          'Idempotency-Key': 'configuration-key-1',
        },
      },
    );
  });
});

describe('shopProductApi.bulkMutate', () => {
  it('sends the bulk mutation idempotency key as a header', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      succeeded_ids: ['product-1'],
      failed: [],
    });

    await shopProductApi.bulkMutate('shop-1', {
      ids: ['product-1', 'product-2'],
      action: 'remove',
      idempotency_key: 'bulk-key-1',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/shops/shop-1/products/bulk-mutate',
      {
        ids: ['product-1', 'product-2'],
        action: 'remove',
      },
      {
        headers: {
          'Idempotency-Key': 'bulk-key-1',
        },
      },
    );
  });
});

describe('shopProductApi.setImagesByKeys', () => {
  it('sends the image assignment idempotency key as a header', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ id: 'product-1' });

    await shopProductApi.setImagesByKeys('shop-1', 'product-1', {
      idempotency_key: 'images-key-1',
      images: [{
        storage_key: 'dev/public/shops/shop/products/product/images/image/original.jpg',
        rank: 1,
      }],
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      '/shops/shop-1/products/product-1/images-by-keys',
      {
        images: [{
          storage_key: 'dev/public/shops/shop/products/product/images/image/original.jpg',
          rank: 1,
        }],
      },
      {
        headers: {
          'Idempotency-Key': 'images-key-1',
        },
      },
    );
  });
});
