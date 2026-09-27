import {
  describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { ProductStates } from '@arc/enums/product';
import type { ListShopProductsItem } from '~/domains/shop/api/product/contracts/read.contract';
import ProductsTable from './products-table.vue';

vi.mock('~/domains/shop/mutations/bulk-mutate-products.mutation', () => ({
  useShopBulkMutateProducts: () => ({
    mutateAsync: vi.fn(),
    isPending: { value: false },
  }),
}));

function product(overrides: Partial<ListShopProductsItem> = {}): ListShopProductsItem {
  return {
    id: 'p1',
    slug: 'blue-tee',
    title: 'Blue Tee',
    state: ProductStates.ACTIVE,
    variant_type: undefined,
    image_url: undefined,
    images: [],
    variants: [],
    options: [],
    inventory: [
      {
        id: 'i1', product_variant_id: 'v1', sku: 'SKU-A', stock: 7, amount_minor: 1234, currency: 'USD',
      },
    ],
    ...overrides,
  } as ListShopProductsItem;
}

function render(products: ListShopProductsItem[], showStateColumn: boolean) {
  return mountSuspended(ProductsTable, {
    props: {
      products,
      loading: false,
      page: 1,
      pageCount: 20,
      total: products.length,
      shopSlug: 'my-shop',
      showStateColumn,
    },
  });
}

describe('products table state column', () => {
  it('shows the status column with a badge per state when asked', async () => {
    const wrapper = await render([
      product(),
      product({ id: 'p2', title: 'Draft tee', state: ProductStates.DRAFT }),
      product({ id: 'p3', title: 'Paused tee', state: ProductStates.INACTIVE }),
    ], true);

    expect(wrapper.text()).toContain('Status');
    expect(wrapper.text()).toContain('Active');
    expect(wrapper.text()).toContain('Draft');
    expect(wrapper.text()).toContain('Inactive');
  });

  it('renders Unknown for a product without state', async () => {
    const wrapper = await render([product({ state: undefined })], true);

    expect(wrapper.text()).toContain('Unknown');
  });

  it('hides the status column for a single-state list', async () => {
    const wrapper = await render([product()], false);

    expect(wrapper.text()).not.toContain('Status');
    expect(wrapper.text()).not.toContain('Active');
  });
});
