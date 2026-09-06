import { describe, expect, it } from 'vitest';
import {
  hasNoneVariantChanges,
  hasUpdateProductFormChanges,
  isUpdateProductSubmitDisabled,
  pruneUnchangedUpdateFields,
} from './update-product-form.mapper';
import {
  buildVariantEditorSnapshot,
  buildVariantEditorSubmission,
} from './variant-input/update-variant-input.mapper';

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
    ] as never)).toEqual({
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
