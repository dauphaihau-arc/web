import { describe, expect, it } from 'vitest';
import {
  applyDetailProductToFormState,
  hasNoneVariantChanges,
  hasUpdateProductFormChanges,
  isUpdateProductSubmitDisabled,
  pruneUnchangedUpdateFields,
} from './update-product-form.mapper';
import {
  buildVariantEditorSnapshot,
  buildVariantEditorSubmission,
  hydrateUpdateVariantInput,
  mixUpdateVariantsTable,
  trackDeletedVariantOption,
} from '../variant-input/update-variant-input.mapper';

describe('pruneUnchangedUpdateFields', () => {
  it('does not submit unchanged normalized product attributes', () => {
    const detailProduct = {
      category: {
        id: 'category-1',
      },
      attributes: [
        {
          attribute: 'attribute-1',
          selected: 'option-1',
        },
      ],
    };

    expect(pruneUnchangedUpdateFields({
      category_id: 'category-1',
      attributes: [
        {
          attribute_id: 'attribute-1',
          selected: 'option-1',
        },
      ],
    }, detailProduct as never)).toEqual({});
  });

  it('hydrates an uncategorized draft and retains only its edited fields', () => {
    const detailProduct = {
      title: 'Uncategorized draft',
      category: null,
      variant_type: 'single',
      attributes: [],
    };
    const state = {};
    applyDetailProductToFormState(detailProduct as never, state, {});
    expect(pruneUnchangedUpdateFields({
      ...state,
      title: 'Edited draft',
    }, detailProduct as never)).toEqual({ title: 'Edited draft' });
  });
});

describe('hasNoneVariantChanges', () => {
  const detailProduct = {
    variant_type: 'none',
    inventory: {
      amount: 10,
      stock: 3,
      sku: 'SKU-1',
    },
  };

  it('returns false when price is changed back to the persisted value', () => {
    expect(hasNoneVariantChanges({
      amount: 10,
      stock: 3,
      sku: 'SKU-1',
    }, detailProduct as never)).toBe(false);
  });

  it('returns true when price differs from the persisted value', () => {
    expect(hasNoneVariantChanges({
      amount: 11,
      stock: 3,
      sku: 'SKU-1',
    }, detailProduct as never)).toBe(true);
  });
});

describe('hasUpdateProductFormChanges', () => {
  it('returns false when every value matches the persisted product', () => {
    expect(hasUpdateProductFormChanges({
      isVariantsDirty: false,
      dataSubmit: {
        title: 'Zoom Cortez',
        category_id: 'category-1',
      },
      detailProduct: {
        title: 'Zoom Cortez',
        category: {
          id: 'category-1',
        },
        variant_type: 'none',
        inventory: {
          amount: 10,
          stock: 3,
        },
        attributes: [],
        images: [],
      } as never,
      fileImages: [],
      idsImageForDelete: [],
      noneVariant: {
        amount: 10,
        stock: 3,
      },
    })).toBe(false);
  });

  it('returns true when the variant editor differs from its hydrated state', () => {
    expect(hasUpdateProductFormChanges({
      isVariantsDirty: true,
      dataSubmit: {},
      detailProduct: undefined,
      fileImages: [],
      idsImageForDelete: [],
      noneVariant: {},
    })).toBe(true);
  });
});

describe('buildVariantEditorSnapshot', () => {
  it('matches its initial snapshot after an inventory value is restored', () => {
    const state = {
      isActiveSubVariant: false,
      variant_group_name: 'Size',
      variants: [{ id: 'variant-1', variant_name: 'Small', errorMsg: '' }],
      subVariants: [],
      variantIdsDelete: [],
    };
    const rows = [{
      id: 1,
      variant_option_id: 'variant-1',
      inventoryId: 'inventory-1',
      variant_name: 'Small',
      amount: 10,
      stock: 3,
      sku: 'SKU-1',
    }];
    const initialSnapshot = buildVariantEditorSnapshot(state as never, rows as never);

    rows[0].amount = 11;
    expect(buildVariantEditorSnapshot(state as never, rows as never)).not.toBe(initialSnapshot);

    rows[0].amount = 10;
    expect(buildVariantEditorSnapshot(state as never, rows as never)).toBe(initialSnapshot);
  });

  it('does not mark a removed temporary option as dirty', () => {
    const state = {
      isActiveSubVariant: false,
      variant_group_name: 'Size',
      variants: [{ id: 'variant-1', variant_name: 'Small', errorMsg: '' }],
      subVariants: [],
      variantIdsDelete: [],
      variantsCurrent: new Map<string, string>([['variant-1', 'Small']]),
    };

    trackDeletedVariantOption(state as never, 'temporary-option-1');

    expect(buildVariantEditorSnapshot(state as never, [] as never)).toBe(
      buildVariantEditorSnapshot({ ...state, variantIdsDelete: [] } as never, [] as never),
    );
  });
});

describe('mixUpdateVariantsTable', () => {
  it('preserves primary option value identity during expansion without copying inventory', () => {
    const rows = mixUpdateVariantsTable({
      variants: [{ id: 'variant-small', variant_name: 'Small', errorMsg: '' }],
      subVariants: [{ id: 'temporary-red', variant_name: 'Red', errorMsg: '' }],
      variantsCurrent: new Map(),
    } as never, [{
      id: 1,
      variant_option_id: 'variant-small',
      productVariantId: 'variant-small',
      optionId1: 'option-size',
      optionValueId1: 'value-small',
      variant_name: 'Small',
      amount: 12,
      stock: 3,
      onHandVersion: 4,
      currency: 'USD',
    }] as never);

    expect(rows).toMatchObject([{
      productVariantId: null,
      optionId1: 'option-size',
      optionValueId1: 'value-small',
      amount: undefined,
      stock: undefined,
      onHandVersion: undefined,
      currency: 'USD',
    }]);
  });
});

describe('hydrateUpdateVariantInput', () => {
  it('hydrates combined editor rows from each leaf variant selection', () => {
    const state = {
      variantsCurrent: new Map(),
    } as { variantsCurrent: Map<unknown, unknown>, isActiveSubVariant?: boolean, subVariants?: unknown[] };
    const rows = hydrateUpdateVariantInput({
      variant_type: 'combine',
      variant_group_name: 'Size',
      variant_sub_group_name: 'Color',
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
          values: [
            { id: 'value-red', value: 'Red', position: 1 },
            { id: 'value-blue', value: 'Blue', position: 2 },
          ],
        },
      ],
      variants: [{
        id: 'value-small',
        variant_name: 'Small',
        selections: [
          { option_id: 'option-size', value_id: 'value-small' },
          { option_id: 'option-color', value_id: 'value-red' },
        ],
        variant_options: [
          {
            id: 'variant-small-red',
            variant: { id: 'value-red', variant_name: 'Red' },
            selections: [
              { option_id: 'option-size', value_id: 'value-small' },
              { option_id: 'option-color', value_id: 'value-red' },
            ],
            lifecycle_state: 'active',
            inventory: {
              id: 'inventory-small-red',
              amount: 12,
              stock: 2,
              onHandVersion: 3,
              sku: 'S-RED',
              currency: 'USD',
            },
          },
          {
            id: 'variant-small-blue',
            variant: { id: 'value-blue', variant_name: 'Blue' },
            selections: [
              { option_id: 'option-size', value_id: 'value-small' },
              { option_id: 'option-color', value_id: 'value-blue' },
            ],
            lifecycle_state: 'inactive',
            inventory: {
              id: 'inventory-small-blue',
              amount: 13,
              stock: 0,
              onHandVersion: 4,
              sku: 'S-BLUE',
              currency: 'USD',
            },
          },
        ],
      }],
    } as never, state as never, () => {
      state.isActiveSubVariant = true;
    });

    expect(state.subVariants).toEqual([
      { id: 'value-red', variant_name: 'Red', errorMsg: '' },
      { id: 'value-blue', variant_name: 'Blue', errorMsg: '' },
    ]);
    expect(rows).toMatchObject([
      {
        variant_option_id: 'value-small',
        sub_variant_option_id: 'value-red',
        sub_variant_name: 'Red',
        productVariantId: 'variant-small-red',
        optionId1: 'option-size',
        optionValueId1: 'value-small',
        optionId2: 'option-color',
        optionValueId2: 'value-red',
        lifecycleState: 'active',
      },
      {
        variant_option_id: 'value-small',
        sub_variant_option_id: 'value-blue',
        sub_variant_name: 'Blue',
        productVariantId: 'variant-small-blue',
        optionId1: 'option-size',
        optionValueId1: 'value-small',
        optionId2: 'option-color',
        optionValueId2: 'value-blue',
        lifecycleState: 'inactive',
      },
    ]);
    expect(buildVariantEditorSubmission(state as never, rows).rows).toMatchObject([
      {
        optionValue1: 'Small',
        optionValue2: 'Red',
        optionValueId1: 'value-small',
        optionValueId2: 'value-red',
        productVariantId: 'variant-small-red',
      },
      {
        optionValue1: 'Small',
        optionValue2: 'Blue',
        optionValueId1: 'value-small',
        optionValueId2: 'value-blue',
        productVariantId: 'variant-small-blue',
      },
    ]);
  });
});

describe('buildVariantEditorSubmission', () => {
  it('emits every combined option row with inventory and pricing values', () => {
    expect(buildVariantEditorSubmission({
      isActiveSubVariant: true,
    } as never, [
      {
        variant_name: 'Red',
        sub_variant_name: 'Small',
        amount: 12,
        stock: 4,
        sku: 'RED-S',
      },
      {
        variant_name: 'Red',
        sub_variant_name: 'Large',
        amount: 14,
        stock: 2,
        sku: 'RED-L',
      },
    ] as never)).toMatchObject({
      variantType: 'combine',
      rows: [
        {
          optionValue1: 'Red',
          optionValue2: 'Small',
          amount: 12,
          stock: 4,
          sku: 'RED-S',
        },
        {
          optionValue1: 'Red',
          optionValue2: 'Large',
          amount: 14,
          stock: 2,
          sku: 'RED-L',
        },
      ],
    });
  });

  it('does not reuse a single-option variant identity when adding a second dimension', () => {
    expect(buildVariantEditorSubmission({
      isActiveSubVariant: true,
    } as never, [
      {
        variant_option_id: 'd2e76825-85b5-457a-ac68-1c21fbb1f42d',
        subVariantId: null,
        inventoryId: null,
        variant_name: '1',
        sub_variant_name: 'Red',
        amount: undefined,
        stock: undefined,
        sku: '',
      },
    ] as never)).toMatchObject({
      variantType: 'combine',
      rows: [{
        optionValue1: '1',
        optionValue2: 'Red',
        productVariantId: undefined,
        inventoryId: undefined,
        amount: undefined,
        stock: undefined,
        sku: undefined,
      }],
    });
  });

  it('carries stable option value ids and lifecycle state through submissions', () => {
    expect(buildVariantEditorSubmission({
      isActiveSubVariant: false,
    } as never, [
      {
        productVariantId: 'd2e76825-85b5-457a-ac68-1c21fbb1f42d',
        optionId1: 'option-size',
        optionValueId1: 'value-small',
        variant_name: 'Petit',
        amount: 89.99,
        stock: 7,
        onHandVersion: 3,
        lifecycleState: 'inactive',
        sku: 'SKU-S',
      },
    ] as never)).toMatchObject({
      variantType: 'single',
      rows: [{
        optionValue1: 'Petit',
        optionValue2: undefined,
        productVariantId: 'd2e76825-85b5-457a-ac68-1c21fbb1f42d',
        optionId1: 'option-size',
        optionValueId1: 'value-small',
        optionId2: undefined,
        optionValueId2: undefined,
        inventoryId: undefined,
        amount: 89.99,
        stock: 7,
        onHandVersion: 3,
        lifecycleState: 'inactive',
        sku: 'SKU-S',
      }],
    });
  });

  it('does not expose temporary option ids as persisted product variant ids', () => {
    expect(buildVariantEditorSubmission({
      isActiveSubVariant: false,
    } as never, [
      {
        variant_option_id: '1788767772661',
        variant_name: 'XL',
        amount: 89.99,
        stock: 7,
        sku: 'NOIR-UTILITYBAG-XL',
      },
    ] as never)).toMatchObject({
      variantType: 'single',
      rows: [{
        optionValue1: 'XL',
        optionValue2: undefined,
        productVariantId: undefined,
        inventoryId: undefined,
        amount: 89.99,
        stock: 7,
        sku: 'NOIR-UTILITYBAG-XL',
      }],
    });
  });
});

describe('isUpdateProductSubmitDisabled', () => {
  it('enables the first valid edit when cached detail is already ready', () => {
    expect(isUpdateProductSubmitDisabled({
      hasFormChanges: true,
      isFormValid: true,
      isNoneVariantValid: true,
      isVariantProduct: true,
      isVariantInputValid: true,
      isReady: true,
    })).toBe(false);
  });

  it('keeps a dirty variant product disabled when its editor is invalid', () => {
    expect(isUpdateProductSubmitDisabled({
      hasFormChanges: true,
      isFormValid: true,
      isNoneVariantValid: true,
      isVariantProduct: true,
      isVariantInputValid: false,
      isReady: true,
    })).toBe(true);
  });

  it('allows saving a valid title edit when the draft has no images', () => {
    expect(isUpdateProductSubmitDisabled({
      hasFormChanges: true,
      isFormValid: true,
      isNoneVariantValid: true,
      isVariantProduct: true,
      isVariantInputValid: true,
      isReady: true,
    })).toBe(false);
  });
});
