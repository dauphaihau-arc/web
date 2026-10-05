import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import {
  defineComponent, h, nextTick, ref,
} from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import type {
  ListShopProductsItem,
  ListShopProductsResponse,
} from '~/domains/shop/api/product/contracts/read.contract';
import ApplyProductTargets from './apply-product-targets.vue';

const state = vi.hoisted(() => ({
  data: undefined as unknown,
}));

vi.mock('~/domains/shop/queries/product/list.query', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { computed } = await import('vue');

  return {
    useShopGetProducts: () => ({
      isPending: computed(() => false),
      data: computed(() => state.data),
      refetch: () => {},
    }),
  };
});

function product(id: string, title: string): ListShopProductsItem {
  return {
    id,
    slug: id,
    title,
    images: [],
    variants: [],
    inventory: [{
      id: `inv-${id}`, amount_minor: 1000, currency: 'USD', stock: 4,
    }],
  };
}

function response(): ListShopProductsResponse {
  return {
    items: [product('p1', 'Blue Tee'), product('p2', 'Red Mug')],
    meta: {
      page: 1,
      limit: 5,
      total: 2,
      total_pages: 1,
      has_next_page: false,
      has_previous_page: false,
    },
    state_counts: {
      all: 2, active: 2, inactive: 0, draft: 0,
    },
  };
}

/** Row checkboxes of the dialog table; index 0 is the header select-all. */
function dialogRowCheckboxes(): HTMLInputElement[] {
  return [...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
}

function footerButton(label: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')]
    .find(candidate => candidate.textContent?.trim() === label);

  if (!button) {
    throw new Error(`Footer button "${label}" not found`);
  }

  return button;
}

/**
 * Mount the component through a parent that owns its `v-model`, so the test
 * asserts the same contract a real form uses.
 */
async function openDialog() {
  const productIds = ref<string[]>([]);
  const harness = defineComponent({
    setup() {
      return () => h(ApplyProductTargets, {
        modelValue: productIds.value,
        'onUpdate:modelValue': (value: string[]) => {
          productIds.value = value;
        },
      });
    },
  });

  const wrapper = await mountSuspended(harness);

  await wrapper.findAll('button')[0]!.trigger('click');
  await nextTick();

  return { wrapper, productIds };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('apply product targets', () => {
  it('keeps the checked row out of the preview table until save', async () => {
    state.data = response();
    const { wrapper, productIds } = await openDialog();

    dialogRowCheckboxes()[1]!.click();
    await nextTick();

    expect(wrapper.find('.mt-4').exists()).toBe(false);
    expect(productIds.value).toEqual([]);

    footerButton('Save').click();
    await nextTick();
    await nextTick();

    expect(productIds.value).toEqual(['p1']);
    expect(wrapper.find('.mt-4').exists()).toBe(true);
    expect(wrapper.find('.mt-4').text()).toContain('Blue Tee');

    wrapper.unmount();
  });

  it('discards dialog selection on cancel and reopens with nothing checked', async () => {
    state.data = response();
    const { wrapper, productIds } = await openDialog();

    dialogRowCheckboxes()[1]!.click();
    await nextTick();
    expect(dialogRowCheckboxes()[1]!.checked).toBe(true);

    footerButton('Cancel').click();
    await nextTick();
    await nextTick();

    expect(productIds.value).toEqual([]);
    expect(wrapper.find('.mt-4').exists()).toBe(false);

    await wrapper.findAll('button')[0]!.trigger('click');
    await nextTick();

    expect(dialogRowCheckboxes()[1]!.checked).toBe(false);

    wrapper.unmount();
  });
});
