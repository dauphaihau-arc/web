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

function productWithAmount(amount: number, stock = 0) {
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
    options: [{
      id: 'size-option',
      name: 'Size',
      position: 1,
      values: [{ id: 'size-seven', value: 'US 7', position: 1 }],
    }],
    variants: [{
      id: 'eb35e7af-f282-4a3b-a907-c49e6a38d7ba',
      variant_name: 'US 7',
      selections: [{ option_id: 'size-option', value_id: 'size-seven' }],
      lifecycle_state: 'active',
      inventory: {
        id: '2d7cb65b-a65f-4e52-8f52-f254e56946f5',
        amount,
        stock,
        sku: 'SKU-US-7',
        currency: 'USD',
      },
    }],
  };
}

function combinedProduct() {
  return {
    id: 'product-1',
    state: 'active',
    title: 'Sneaker',
    description: 'Sneaker',
    who_made: 'someone_else',
    is_digital: false,
    variant_type: ProductVariantTypes.COMBINE,
    variant_group_name: 'Size',
    variant_sub_group_name: 'Color',
    tags: [],
    category: { id: 'category-1', name: 'Shoes' },
    images: [],
    attributes: [],
    inventory: {},
    options: [
      {
        id: 'option-size',
        name: 'Size',
        position: 1,
        values: [{ id: 'value-small', value: 'Small', position: 1 }],
      },
      {
        id: 'option-color',
        name: 'Color',
        position: 2,
        values: [{ id: 'value-red', value: 'Red', position: 1 }],
      },
    ],
    variants: [{
      id: 'value-small',
      variant_name: 'Small',
      selections: [
        { option_id: 'option-size', value_id: 'value-small' },
        { option_id: 'option-color', value_id: 'value-red' },
      ],
      lifecycle_state: 'inactive',
      variant_options: [{
        id: 'variant-small-red',
        variant: { id: 'value-red', variant_name: 'Red' },
        selections: [
          { option_id: 'option-size', value_id: 'value-small' },
          { option_id: 'option-color', value_id: 'value-red' },
        ],
        lifecycle_state: 'inactive',
        inventory: {
          id: 'inventory-small-red',
          amount: 86,
          stock: 7,
          onHandVersion: 4,
          sku: 'S-RED',
          currency: 'USD',
        },
      }],
    }],
  };
}

function noneVariantProduct() {
  return {
    id: 'product-1',
    state: 'draft',
    title: 'Mug',
    description: 'Mug',
    who_made: 'someone_else',
    is_digital: false,
    variant_type: ProductVariantTypes.NONE,
    tags: [],
    category: { id: 'category-1', name: 'Mugs' },
    images: [],
    attributes: [],
    inventory: {
      id: 'inventory-1',
      amount: 120,
      stock: 9,
      sku: 'BASE',
      currency: 'USD',
    },
    variants: [],
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

  it('marks the exact SKU row returned by the server', async () => {
    const harness = defineComponent({
      props: {
        product: { type: Object, required: true },
        skuConflicts: { type: Array, required: true },
      },
      setup(props, { expose }) {
        const editor = useUpdateVariantInput({
          countValidate: ref(0),
          product: toRef(props, 'product') as never,
          skuConflicts: toRef(props, 'skuConflicts') as never,
          emitChange: vi.fn(),
          emitVariantsUpdated: vi.fn(),
        });
        expose(editor);
        return () => h('div');
      },
    });
    const wrapper = mount(harness, {
      props: {
        product: productWithAmount(180),
        skuConflicts: [{
          inventoryId: '2d7cb65b-a65f-4e52-8f52-f254e56946f5',
        }],
      },
    });
    await flushPromises();
    const exposedEditor = wrapper.vm as unknown as {
      onChangeInputTable: (event: Event, row: { id: number }) => void
      rowsTable: Array<{ errorSku?: string, id: number }>
    };

    expect(exposedEditor.rowsTable[0].errorSku).toBe('SKU already used');

    exposedEditor.onChangeInputTable({
      target: {
        name: 'sku',
        value: 'SKU-US-8',
      },
    } as unknown as Event, exposedEditor.rowsTable[0]);

    expect(exposedEditor.rowsTable[0].errorSku).toBe('');
  });


  it('seeds no-option expansion rows from the implicit offer', async () => {
    const harness = defineComponent({
      props: {
        product: { type: Object, required: true },
      },
      setup(props, { expose }) {
        const editor = useUpdateVariantInput({
          countValidate: ref(0),
          product: toRef(props, 'product') as never,
          emitChange: vi.fn(),
          emitVariantsUpdated: vi.fn(),
        });
        expose(editor);
        return () => h('div');
      },
    });
    const wrapper = mount(harness, {
      props: { product: noneVariantProduct() },
    });
    await flushPromises();

    const exposedEditor = wrapper.vm as unknown as ReturnType<typeof useUpdateVariantInput>;
    exposedEditor.state.variant_group_name = 'Size';
    exposedEditor.state.variantOption = 'S';
    exposedEditor.addVariant();
    exposedEditor.state.variantOption = 'M';
    exposedEditor.addVariant();
    await flushPromises();

    expect(exposedEditor.rowsTable).toMatchObject([
      { amount: 120, stock: 0, sku: 'BASE-S' },
      { amount: 120, stock: 0, sku: 'BASE-M' },
    ]);
  });

  it('does not copy existing stock into structurally expanded offers', async () => {
    const emitChange = vi.fn();
    const harness = defineComponent({
      props: {
        product: { type: Object, required: true },
      },
      setup(props, { expose }) {
        const editor = useUpdateVariantInput({
          countValidate: ref(0),
          product: toRef(props, 'product') as never,
          emitChange,
          emitVariantsUpdated: vi.fn(),
        });
        expose(editor);
        return () => h('div');
      },
    });
    const wrapper = mount(harness, {
      props: { product: productWithAmount(8600, 7) },
    });
    await flushPromises();

    const exposedEditor = wrapper.vm as unknown as ReturnType<typeof useUpdateVariantInput>;
    exposedEditor.openSubVariant();
    exposedEditor.state.variant_sub_group_name = 'Color';
    exposedEditor.state.subVariantOption = 'Red';
    exposedEditor.addSubVariant();
    await flushPromises();

    expect(exposedEditor.rowsTable).toMatchObject([{
      stock: undefined,
      amount: undefined,
      optionId1: 'size-option',
      optionValueId1: 'size-seven',
    }]);
    exposedEditor.closeSubVariant();
    await flushPromises();
    expect(exposedEditor.rowsTable).toMatchObject([{ stock: 7, amount: 8600 }]);
  });

  it('closes a normalized matrix to replacement single-option rows without inventory ids', async () => {
    const harness = defineComponent({
      props: {
        product: { type: Object, required: true },
      },
      setup(props, { expose }) {
        const editor = useUpdateVariantInput({
          countValidate: ref(0),
          product: toRef(props, 'product') as never,
          emitChange: vi.fn(),
          emitVariantsUpdated: vi.fn(),
        });
        expose(editor);
        return () => h('div');
      },
    });
    const wrapper = mount(harness, {
      props: { product: combinedProduct() },
    });
    await flushPromises();

    const exposedEditor = wrapper.vm as unknown as ReturnType<typeof useUpdateVariantInput>;
    expect(exposedEditor.rowsTable).toMatchObject([{
      productVariantId: 'variant-small-red',
      optionValueId1: 'value-small',
      optionValueId2: 'value-red',
      lifecycleState: 'inactive',
    }]);

    exposedEditor.closeSubVariant();
    await flushPromises();

    expect(exposedEditor.rowsTable).toMatchObject([{
      variant_option_id: 'value-small',
      variant_name: 'Small',
      productVariantId: null,
      optionId1: 'option-size',
      optionValueId1: 'value-small',
      inventoryId: null,
      amount: undefined,
      stock: 0,
      currency: 'USD',
    }]);
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
