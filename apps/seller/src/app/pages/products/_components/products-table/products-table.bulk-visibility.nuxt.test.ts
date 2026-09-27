import {
  describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import type { VueWrapper } from '@vue/test-utils';
import { ProductStates } from '@arc/enums/product';
import type { ListShopProductsItem } from '~/domains/shop/api/product/contracts/read.contract';
import ProductsTable from './products-table.vue';

vi.mock('~/domains/shop/mutations/bulk-mutate-products.mutation', () => ({
  useShopBulkMutateProducts: () => ({
    mutateAsync: vi.fn(),
    isPending: { value: false },
  }),
}));

function product(id: string, state: ProductStates): ListShopProductsItem {
  return {
    id,
    slug: id,
    title: id,
    state,
    variant_type: undefined,
    image_url: undefined,
    images: [],
    variants: [],
    options: [],
    inventory: [
      {
        id: `${id}-inv`, product_variant_id: 'v1', sku: 'SKU', stock: 1, amount_minor: 100, currency: 'USD',
      },
    ],
  } as ListShopProductsItem;
}

async function render(products: ListShopProductsItem[]) {
  return mountSuspended(ProductsTable, {
    props: {
      products,
      loading: false,
      page: 1,
      pageCount: 20,
      total: products.length,
      shopSlug: 'my-shop',
    },
  });
}

/** Row checkboxes follow the select-all checkbox in the header. */
async function selectRows(wrapper: VueWrapper, rowIndexes: number[]) {
  const checkboxes = wrapper.findAll('input[type="checkbox"]');
  for (const index of rowIndexes) {
    await checkboxes[index + 1]!.setValue(true);
  }
}

describe('products table bulk action visibility', () => {
  const products = [product('active-tee', ProductStates.ACTIVE), product('draft-tee', ProductStates.DRAFT)];

  it('offers deactivate for an all-active selection', async () => {
    const wrapper = await render(products);
    await selectRows(wrapper, [0]);

    expect(wrapper.text()).toContain('Deactivate');
    expect(wrapper.text()).not.toContain('Publish');
  });

  it('offers publish for a selection that is entirely unpublished', async () => {
    const wrapper = await render(products);
    await selectRows(wrapper, [1]);

    expect(wrapper.text()).toContain('Publish');
    expect(wrapper.text()).not.toContain('Deactivate');
  });

  it('offers neither action for a mixed selection', async () => {
    const wrapper = await render(products);
    await selectRows(wrapper, [0, 1]);

    expect(wrapper.text()).not.toContain('Publish');
    expect(wrapper.text()).not.toContain('Deactivate');
    expect(wrapper.text()).toContain('Delete');
  });
});
