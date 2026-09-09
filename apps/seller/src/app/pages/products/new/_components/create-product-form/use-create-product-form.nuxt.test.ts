import {
  describe, expect, it, vi,
} from 'vitest';
import { defineComponent, h } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { ProductStates } from '@arc/enums/product';
import { useCreateProductForm } from './use-create-product-form';
import CreateProductFormActions from './create-product-form-actions.vue';

vi.mock('./use-create-product-submit', () => ({
  useCreateProductSubmit: () => ({ loadingSubmit: false, submit: vi.fn() }),
}));
vi.mock('~/domains/auth/queries/client-config.query', () => ({
  useAuthClientConfig: () => ({ data: { value: undefined } }),
}));
vi.mock('~/domains/shop/queries/my-shop.query', () => ({
  useGetMyShop: () => ({ data: { value: { currency: 'USD' } } }),
}));
vi.mock('~/domains/shop/mutations/generate-product-description.mutation', () => ({
  useGenerateProductDescription: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('create product draft action', () => {
  it('allows saving without a category while keeping publish blocked', async () => {
    const harness = defineComponent({
      setup() {
        const form = useCreateProductForm();
        Object.assign(form.stateSubmit, {
          title: 'Handmade cotton shirt',
          description: 'A handmade cotton shirt with a comfortable everyday fit.',
        });
        form.noneVariant.amount = 15;
        form.shipping.value = {
          country: 'US', zip: '10001', process_time: '1-3', standard_shipping: [],
        } as never;
        return () => h(CreateProductFormActions, {
          enabledButtonSubmit: form.enabledButtonSubmit.value,
          hasCategory: Boolean(form.stateSubmit.category_id),
          hasImages: true,
          loadingSubmit: false,
          productState: form.stateSubmit.state,
          onSaveDraft: () => {
            form.stateSubmit.state = ProductStates.DRAFT;
            expect(form.validateForm(form.stateSubmit as never)).toEqual([]);
          },
        });
      },
    });
    const wrapper = await mountSuspended(harness, {
      global: { stubs: { FixedFormActions: { template: '<div><slot /></div>' } } },
    });
    const button = (label: string) => wrapper.findAll('button').find(item => item.text() === label)!;
    await vi.waitFor(() => expect(button('Save draft').attributes('disabled')).toBeUndefined(), { timeout: 2000 });
    expect(button('Publish').attributes('disabled')).toBeDefined();
    await button('Save draft').trigger('click');
    wrapper.unmount();
  });
});
