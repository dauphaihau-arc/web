import { flushPromises, mount } from '@vue/test-utils';
import {
  defineComponent,
  h,
  ref,
  toRef,
} from 'vue';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ProductVariantTypes } from '@arc/enums/product';
import {
  useUpdateVariantInput,
  validateUpdateVariantInventoryRows,
} from './use-update-variant-input';

function productWithAmount(amount: number) {
  return {
    id: 'product-1',
    state: 'draft',
    title: 'Sneaker',
    description: 'Sneaker',
    who_made: 'someone_else',
    is_digital: false,
    variant_type: ProductVariantTypes.SINGLE,
    variant_group_name: 'Size',
    tags: [],
    category: { id: 'category-1', name: 'Shoes' },
    images: [],
    attributes: [],
    inventory: {},
    variants: [{
      id: 'variant-1',
      variant_name: 'US 7',
      inventory: {
        id: 'inventory-1',
        amount,
        stock: 0,
        sku: 'SKU-US-7',
        currency: 'USD',
      },
    }],
  };
}

describe('useUpdateVariantInput product reactivity', () => {
  it('rehydrates rows and resets dirty state when the product prop changes', async () => {
    const emitVariantsUpdated = vi.fn();
    const harness = defineComponent({
      props: {
        product: { type: Object, required: true },
      },
      setup(props, { expose }) {
        const editor = useUpdateVariantInput({
          countValidate: ref(0),
          product: toRef(props, 'product') as never,
          emitChange: vi.fn(),
          emitVariantsUpdated,
        });
        expose(editor);
        return () => h('div');
      },
    });
    const wrapper = mount(harness, {
      props: { product: productWithAmount(180) },
    });
    await flushPromises();
    // Vue Test Utils exposes setup refs as their unwrapped public values.
    const exposedEditor = wrapper.vm as unknown as {
      rowsTable: Array<{ amount: number }>
    };
    expect(exposedEditor.rowsTable[0].amount).toBe(180);

    await wrapper.setProps({ product: productWithAmount(181) });
    await flushPromises();

    expect(exposedEditor.rowsTable[0].amount).toBe(181);
    expect(emitVariantsUpdated).toHaveBeenLastCalledWith(false);
  });
});

describe('validateUpdateVariantInventoryRows', () => {
  it('accepts an existing API SKU longer than the create-form limit', () => {
    expect(validateUpdateVariantInventoryRows([{
      amount: 180,
      stock: 0,
      sku: 'NOIR-ZOOM-CORTEZ-SACAI-IRON-US-10',
    }]).success).toBe(true);
  });
});
