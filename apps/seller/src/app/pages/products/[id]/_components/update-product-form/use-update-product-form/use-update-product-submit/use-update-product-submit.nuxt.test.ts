import {
  describe, expect, it, vi,
} from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import {
  computed,
  defineComponent,
  h,
  reactive,
  ref,
} from 'vue';
import { ProductStates, ProductVariantTypes, ProductWhoMade } from '@arc/enums/product';
import {
  saveDefaultVariantConfiguration,
  saveVariantEditorSubmission,
} from './variant-submission-persistence';
import { saveUpdateProductSections } from './product-section-save.service';
import { createUpdateProductSectionStates, syncDirtyProductSectionStates } from './product-section-state';
import { useUpdateProductSubmitState } from './use-update-product-submit-state';
import { useUpdateProductVariantState } from '../use-update-product-variant-state';
import type { VariantEditorSubmission } from '../update-product-form.types';
import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';
import type { UpdateProductBody } from '~/domains/shop/api/product/contracts/form.contract';

function buildApi() {
  return {
    setVariantConfiguration: vi.fn().mockImplementation(async (_shopId, _productId, payload) => ({
      product: {
        ...baseProduct,
        productVersion: payload.product_version + 1,
      },
    })),
    updateDetails: vi.fn().mockImplementation(async (_shopId, _productId, payload) => ({
      product: {
        ...baseProduct,
        productVersion: payload.product_version + 1,
        title: payload.title ?? baseProduct.title,
      },
    })),
  };
}

const baseProduct: DetailShopProductResponse['product'] = {
  id: 'product-1',
  productVersion: 7,
  state: ProductStates.ACTIVE,
  title: 'Test product',
  description: 'Test product',
  who_made: 'i_did',
  is_digital: false,
  variant_type: ProductVariantTypes.SINGLE,
  variant_group_name: 'Size',
  tags: [],
  category: null,
  images: [],
  attributes: [],
  options: [{
    id: 'option-size',
    name: 'Size',
    position: 1,
    values: [{ id: 'value-small', value: 'Small', position: 1 }],
  }],
  inventory: {},
  variants: [{
    id: 'variant-small',
    variant_name: 'Small',
    selections: [{ option_id: 'option-size', value_id: 'value-small' }],
    lifecycle_state: 'active',
    rank: 1,
    inventory: {
      id: 'inventory-small',
      amount: 12.5,
      stock: 3,
      onHandQuantity: 3,
      onHandVersion: 4,
      sku: 'SMALL',
      currency: 'USD',
    },
  }],
};

const combineProduct: DetailShopProductResponse['product'] = {
  ...baseProduct,
  variant_type: ProductVariantTypes.COMBINE,
  variant_sub_group_name: 'Color',
  options: [
    baseProduct.options[0],
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
    rank: 1,
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
        amount: 12.5,
        stock: 0,
        onHandQuantity: 0,
        onHandVersion: 8,
        sku: 'SMALL-RED',
        currency: 'USD',
      },
    }],
  }],
};

describe('saveVariantEditorSubmission', () => {
  it('preserves option value and variant ids when only the visible label changes', async () => {
    const api = buildApi();

    await saveVariantEditorSubmission({
      api,
      detailProduct: baseProduct,
      idempotencyKey: () => 'configuration-key',
      productId: 'product-1',
      shopId: 'shop-1',
      submission: {
        variantType: ProductVariantTypes.SINGLE,
        variantGroupName: 'Shoe Size',
        rows: [{
          productVariantId: 'variant-small',
          inventoryId: 'inventory-small',
          optionId1: 'option-size',
          optionValueId1: 'value-small',
          optionValue1: 'Petite',
          amount: 13,
          stock: 5,
          onHandVersion: 4,
          sku: 'SMALL-NEW',
          currency: 'USD',
        }],
      },
    });

    expect(api.setVariantConfiguration).toHaveBeenCalledWith('shop-1', 'product-1', {
      product_version: 7,
      idempotency_key: 'configuration-key',
      options: [{
        id: 'option-size',
        name: 'Shoe Size',
        position: 1,
        values: [{ id: 'value-small', value: 'Petite', position: 1 }],
      }],
      variants: [{
        id: 'variant-small',
        selections: [{ option_id: 'option-size', value_id: 'value-small' }],
        lifecycle_state: 'active',
        inventory: {
          on_hand_quantity: 5,
          expected_on_hand_version: 4,
          sku: 'SMALL-NEW',
          amount_minor: 1300,
          currency: 'USD',
        },
      }],
      removed_variant_ids: [],
    });
  });

  it('creates replacement variants when a published single-option row gains a second dimension', async () => {
    const api = buildApi();

    await saveVariantEditorSubmission({
      api,
      detailProduct: baseProduct,
      idempotencyKey: () => 'expand-key',
      productId: 'product-1',
      shopId: 'shop-1',
      submission: {
        variantType: ProductVariantTypes.COMBINE,
        variantGroupName: 'Size',
        variantSubGroupName: 'Color',
        rows: [{
          productVariantId: 'variant-small',
          optionId1: 'option-size',
          optionValueId1: 'value-small',
          optionValue1: 'Small',
          optionValue2: 'Red',
          amount: 14,
          stock: 6,
          onHandVersion: 4,
          sku: 'SMALL-RED',
          currency: 'USD',
        }],
      },
    });

    expect(api.setVariantConfiguration).toHaveBeenCalledWith('shop-1', 'product-1', expect.objectContaining({
      variants: [expect.objectContaining({
        client_ref: 'variant-1',
        selections: [
          { option_id: 'option-size', value_id: 'value-small' },
          { option_ref: 'option-2', value_ref: 'option-2-value-1' },
        ],
        inventory: expect.objectContaining({
          on_hand_quantity: 6,
          expected_on_hand_version: undefined,
          amount_minor: 1400,
        }),
      })],
      removed_variant_ids: ['variant-small'],
    }));
  });

  it('keeps inactive lifecycle state for unchanged matrix rows', async () => {
    const api = buildApi();

    await saveVariantEditorSubmission({
      api,
      detailProduct: combineProduct,
      idempotencyKey: () => 'combine-key',
      productId: 'product-1',
      shopId: 'shop-1',
      submission: {
        variantType: ProductVariantTypes.COMBINE,
        variantGroupName: 'Size',
        variantSubGroupName: 'Color',
        rows: [{
          productVariantId: 'variant-small-red',
          optionId1: 'option-size',
          optionValueId1: 'value-small',
          optionId2: 'option-color',
          optionValueId2: 'value-red',
          optionValue1: 'Small',
          optionValue2: 'Red',
          lifecycleState: 'inactive',
          amount: 12.5,
          stock: 0,
          onHandVersion: 8,
          sku: 'SMALL-RED',
          currency: 'USD',
        }],
      },
    });

    expect(api.setVariantConfiguration).toHaveBeenCalledWith('shop-1', 'product-1', expect.objectContaining({
      variants: [expect.objectContaining({
        id: 'variant-small-red',
        lifecycle_state: 'inactive',
      })],
      removed_variant_ids: [],
    }));
  });
});

describe('saveDefaultVariantConfiguration', () => {
  it('creates a new zero-selection default instead of reusing the first published variant identity', async () => {
    const api = buildApi();

    await saveDefaultVariantConfiguration({
      api,
      detailProduct: baseProduct,
      idempotencyKey: () => 'default-key',
      noneVariant: {
        amount: 20,
        stock: 2,
        sku: 'DEFAULT',
      },
      productId: 'product-1',
      shopId: 'shop-1',
    });

    expect(api.setVariantConfiguration).toHaveBeenCalledWith('shop-1', 'product-1', {
      product_version: 7,
      idempotency_key: 'default-key',
      options: [],
      variants: [{
        client_ref: 'default',
        selections: [],
        lifecycle_state: 'active',
        inventory: {
          on_hand_quantity: 2,
          expected_on_hand_version: undefined,
          sku: 'DEFAULT',
          amount_minor: 2000,
          currency: 'USD',
        },
      }],
      removed_variant_ids: ['variant-small'],
    });
  });

  it('rejects default collapse until stock and price are explicitly reviewed', async () => {
    await expect(saveDefaultVariantConfiguration({
      api: buildApi(),
      detailProduct: baseProduct,
      idempotencyKey: () => 'default-key',
      noneVariant: {},
      productId: 'product-1',
      shopId: 'shop-1',
    })).rejects.toThrow('Default variant inventory must be reviewed before saving');
  });
});

describe('variant type toggle state', () => {
  it('restores unsaved variant submission after cancelling a remove-options toggle', async () => {
    const harness = defineComponent({
      setup(_, { expose }) {
        const stateSubmit = reactive({});
        const variantState = useUpdateProductVariantState({ stateSubmit });
        expose({ stateSubmit, variantState });
        return () => h('div');
      },
    });
    const wrapper = mount(harness);
    const exposed = wrapper.vm as unknown as {
      stateSubmit: Pick<UpdateProductBody, 'variant_type' | 'variant_group_name'>
      variantState: ReturnType<typeof useUpdateProductVariantState>
    };
    const editedSubmission: VariantEditorSubmission = {
      variantType: ProductVariantTypes.COMBINE,
      variantGroupName: 'Size',
      variantSubGroupName: 'Color',
      rows: [{
        optionValue1: 'Small',
        optionValue2: 'Red',
        amount: 14,
        stock: 6,
      }],
    };

    exposed.variantState.isVariantsDirty.value = true;
    exposed.variantState.onChangeVariants({
      variant_type: ProductVariantTypes.COMBINE,
      variant_group_name: 'Size',
      variant_sub_group_name: 'Color',
      variantSubmission: editedSubmission,
    });
    exposed.variantState.onChangeVariantType();
    exposed.variantState.onChangeVariants({
      variant_type: ProductVariantTypes.COMBINE,
      variant_group_name: 'Size',
      variant_sub_group_name: 'Color',
      variantSubmission: editedSubmission,
    });
    expect(exposed.stateSubmit.variant_type).toBe(ProductVariantTypes.NONE);
    expect(exposed.variantState.variantSubmission.value).toBeUndefined();

    exposed.variantState.onChangeVariantType();

    expect(exposed.stateSubmit.variant_type).toBe(ProductVariantTypes.COMBINE);
    expect(exposed.variantState.variantSubmission.value?.rows).toEqual(editedSubmission.rows);
    expect(exposed.variantState.isVariantsDirty.value).toBe(true);
  });
});

describe('actual update submit chain', () => {
  it('passes a dirty NONE toggle as an inventory section save without stale variant submission', async () => {
    const submit = vi.fn();
    const variantSubmission = ref<VariantEditorSubmission | undefined>({
      variantType: ProductVariantTypes.COMBINE,
      rows: [],
    });
    const harness = defineComponent({
      setup(_, { expose }) {
        const editor = useUpdateProductSubmitState({
          btnSubmit: ref(),
          dataDetailProduct: ref({ product: combineProduct }),
          fileImages: ref([]),
          idsImageForDelete: ref([]),
          isVariantInputValid: ref(true),
          isVariantProduct: computed(() => false),
          isVariantsDirty: ref(true),
          noneVariant: reactive({ amount: 20, stock: 2, sku: 'DEFAULT' }),
          stateSubmit: reactive({ variant_type: ProductVariantTypes.NONE }),
          sectionStates: reactive(createUpdateProductSectionStates()),
          submit,
          variantSubmission,
        });
        expose(editor);
        return () => h('form');
      },
    });
    const wrapper = mount(harness);
    await flushPromises();

    await (wrapper.vm as unknown as ReturnType<typeof useUpdateProductSubmitState>).onSubmit({} as never);

    expect(submit).toHaveBeenCalledWith(
      { variant_type: ProductVariantTypes.NONE },
      'save',
      undefined,
      true,
    );
  });

  it('saves existing combine to default through section orchestration, not direct helper calls', async () => {
    const api = buildApi();
    const sectionStates = createUpdateProductSectionStates();

    await saveUpdateProductSections({
      api: api as never,
      dataDetailProduct: { product: combineProduct },
      dataSubmit: { variant_type: ProductVariantTypes.NONE },
      idsImageForDelete: [],
      noneVariant: {
        amount: 20,
        stock: 2,
        sku: 'DEFAULT',
      },
      sectionStates,
      sectionsToSave: ['product-inventory'],
      shopId: 'shop-1',
    });

    expect(api.setVariantConfiguration).toHaveBeenCalledWith('shop-1', 'product-1', expect.objectContaining({
      options: [],
      variants: [expect.objectContaining({
        client_ref: 'default',
        selections: [],
        inventory: expect.objectContaining({
          on_hand_quantity: 2,
          amount_minor: 2000,
        }),
      })],
      removed_variant_ids: ['variant-small-red'],
    }));
    expect(sectionStates['product-inventory'].status).toBe('success');
  });

  it('sends the current product version with basic detail edits', async () => {
    const api = buildApi();

    await saveUpdateProductSections({
      api: api as never,
      dataDetailProduct: { product: baseProduct },
      dataSubmit: { title: 'Versioned update' },
      idsImageForDelete: [],
      noneVariant: {},
      sectionStates: createUpdateProductSectionStates(),
      sectionsToSave: ['product-basic-info'],
      shopId: 'shop-1',
    });

    expect(api.updateDetails).toHaveBeenCalledWith('shop-1', 'product-1', expect.objectContaining({
      product_version: 7,
      title: 'Versioned update',
    }));
  });

  it('keeps the first dirty version after a background product refetch', () => {
    const sectionStates = createUpdateProductSectionStates();

    syncDirtyProductSectionStates(sectionStates, ['product-basic-info'], 7);
    syncDirtyProductSectionStates(sectionStates, ['product-basic-info'], 8);

    expect(sectionStates['product-basic-info'].productVersion).toBe(7);

    syncDirtyProductSectionStates(sectionStates, [], 8);

    expect(sectionStates['product-basic-info'].productVersion).toBeUndefined();
  });

  it('sends the dirty section baseline version after a background refetch', async () => {
    const api = buildApi();
    const sectionStates = createUpdateProductSectionStates();
    sectionStates['product-basic-info'].status = 'dirty';
    sectionStates['product-basic-info'].productVersion = 7;

    await saveUpdateProductSections({
      api: api as never,
      dataDetailProduct: {
        product: {
          ...baseProduct,
          productVersion: 8,
        },
      },
      dataSubmit: { title: 'Stale edit' },
      idsImageForDelete: [],
      noneVariant: {},
      sectionStates,
      sectionsToSave: ['product-basic-info'],
      shopId: 'shop-1',
    });

    expect(api.updateDetails).toHaveBeenCalledWith('shop-1', 'product-1', expect.objectContaining({
      product_version: 7,
      title: 'Stale edit',
    }));
    expect(sectionStates['product-basic-info'].productVersion).toBeUndefined();
  });

  it('advances versions between sections saved by the same submit', async () => {
    const api = buildApi();
    const sectionStates = createUpdateProductSectionStates();
    sectionStates['product-basic-info'].productVersion = 7;
    sectionStates['product-details'].productVersion = 7;

    await saveUpdateProductSections({
      api: api as never,
      dataDetailProduct: { product: baseProduct },
      dataSubmit: {
        title: 'Own edit',
        who_made: ProductWhoMade.SOMEONE_ELSE,
      },
      idsImageForDelete: [],
      noneVariant: {},
      sectionStates,
      sectionsToSave: ['product-basic-info', 'product-details'],
      shopId: 'shop-1',
    });

    expect(api.updateDetails).toHaveBeenNthCalledWith(1, 'shop-1', 'product-1', expect.objectContaining({
      product_version: 7,
      title: 'Own edit',
    }));
    expect(api.updateDetails).toHaveBeenNthCalledWith(2, 'shop-1', 'product-1', expect.objectContaining({
      product_version: 8,
      who_made: ProductWhoMade.SOMEONE_ELSE,
    }));
  });

  it('uses seller-friendly copy for product version conflicts', async () => {
    const api = {
      updateDetails: vi.fn().mockRejectedValue({
        statusCode: 409,
        data: {
          code: 'ProductVersionConflictError',
          message: 'Product Version conflict',
          current_product: { product: baseProduct },
        },
      }),
    };
    const sectionStates = createUpdateProductSectionStates();

    await expect(saveUpdateProductSections({
      api: api as never,
      dataDetailProduct: { product: baseProduct },
      dataSubmit: { title: 'Stale title' },
      idsImageForDelete: [],
      noneVariant: {},
      sectionStates,
      sectionsToSave: ['product-basic-info'],
      shopId: 'shop-1',
    })).rejects.toThrow('Failed to save product-basic-info');

    expect(sectionStates['product-basic-info'].conflict).toMatchObject({
      title: 'Someone updated this section',
      message: 'Your edits are based on an older version. You can overwrite with your edits or refresh to use the latest saved values.',
      reapplyAvailable: true,
    });
  });

  it('shows duplicate SKU conflicts as inventory validation errors', async () => {
    const api = {
      setVariantConfiguration: vi.fn().mockRejectedValue({
        statusCode: 409,
        data: {
          code: 'ProductSkuConflict',
          affected_ids: ['inventory-1'],
          conflicts: [{
            sku: 'DUPLICATE-SKU',
            inventory_id: 'inventory-1',
            variant_id: 'variant-1',
            client_ref: 'variant-1',
          }],
          current_product: { product: baseProduct },
        },
      }),
    };
    const sectionStates = createUpdateProductSectionStates();

    await expect(saveUpdateProductSections({
      api: api as never,
      dataDetailProduct: { product: baseProduct },
      dataSubmit: { variant_type: ProductVariantTypes.NONE },
      idsImageForDelete: [],
      noneVariant: {
        amount: 20,
        stock: 2,
        sku: 'DUPLICATE-SKU',
      },
      sectionStates,
      sectionsToSave: ['product-inventory'],
      shopId: 'shop-1',
    })).rejects.toThrow('Failed to save product-inventory');

    expect(sectionStates['product-inventory'].status).toBe('error');
    expect(sectionStates['product-inventory']).toMatchObject({
      errorTitle: 'SKU already in use',
      errorMessage: 'Another product or variant in your shop already uses this SKU. Enter a unique SKU before saving.',
      skuConflicts: [{
        sku: 'DUPLICATE-SKU',
        inventoryId: 'inventory-1',
        variantId: 'variant-1',
        clientRef: 'variant-1',
      }],
    });
    expect(sectionStates['product-inventory'].conflict).toBeUndefined();
  });

  it('falls back to affected inventory IDs when SKU conflict details are not returned', async () => {
    const api = {
      setVariantConfiguration: vi.fn().mockRejectedValue({
        statusCode: 409,
        data: {
          code: 'ProductSkuConflict',
          affected_ids: ['inventory-1'],
        },
      }),
    };
    const sectionStates = createUpdateProductSectionStates();

    await expect(saveUpdateProductSections({
      api: api as never,
      dataDetailProduct: { product: baseProduct },
      dataSubmit: { variant_type: ProductVariantTypes.NONE },
      idsImageForDelete: [],
      noneVariant: {
        amount: 20,
        stock: 2,
        sku: 'DUPLICATE-SKU',
      },
      sectionStates,
      sectionsToSave: ['product-inventory'],
      shopId: 'shop-1',
    })).rejects.toThrow('Failed to save product-inventory');

    expect(sectionStates['product-inventory'].skuConflicts).toEqual([{ inventoryId: 'inventory-1', sku: 'DUPLICATE-SKU' }]);
  });


  it('marks reservation conflicts as blocked instead of retryable', async () => {
    const api = {
      setVariantConfiguration: vi.fn().mockRejectedValue({
        statusCode: 409,
        data: {
          code: 'ProductReservationConflict',
          current_product: { product: baseProduct },
        },
      }),
    };
    const sectionStates = createUpdateProductSectionStates();

    await expect(saveUpdateProductSections({
      api: api as never,
      dataDetailProduct: { product: baseProduct },
      dataSubmit: { variant_type: ProductVariantTypes.NONE },
      idsImageForDelete: [],
      noneVariant: {
        amount: 20,
        stock: 2,
        sku: 'DEFAULT',
      },
      sectionStates,
      sectionsToSave: ['product-inventory'],
      shopId: 'shop-1',
    })).rejects.toThrow('Failed to save product-inventory');

    expect(sectionStates['product-inventory'].status).toBe('conflict');
    expect(sectionStates['product-inventory'].conflict).toMatchObject({
      title: 'Inventory update blocked',
      message: 'A buyer has this variant reserved in checkout. You can’t remove this option or variant until the checkout is paid or the reservation expires.',
      reapplyAvailable: false,
    });
  });
});
