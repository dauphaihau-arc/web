import { describe, expect, it } from 'vitest';
import { ProductStates, ProductVariantTypes } from '@arc/enums/product';
import { pruneUnchangedUpdateFields } from '../update-product-form.mapper';
import { getDirtyProductSectionIds } from './product-section-dirty';
import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';
import type { UpdateProductBody } from '~/domains/shop/api/product/contracts/form.contract';

const detailProduct = {
  id: 'product-1',
  productVersion: 7,
  state: ProductStates.ACTIVE,
  title: 'Test product',
  description: 'Test product',
  who_made: 'i_did',
  is_digital: false,
  variant_type: ProductVariantTypes.NONE,
  tags: [],
  category: null,
  images: [],
  attributes: [],
  inventory: {},
  variants: [],
  shipping_profile_id: 'profile-current',
} as unknown as DetailShopProductResponse['product'];

function dirtySections(dataSubmit: UpdateProductBody) {
  return getDirtyProductSectionIds({
    dataSubmit,
    detailProduct,
    fileImages: [],
    idsImageForDelete: [],
    isVariantsDirty: false,
    noneVariant: {},
  });
}

describe('getDirtyProductSectionIds', () => {
  it('does not mark shipping dirty when the pruned submit body omits the unchanged profile', () => {
    const stateSubmit: UpdateProductBody = {
      title: 'Test product',
      description: 'Edited description',
      who_made: 'i_did',
      is_digital: false,
      shipping_profile_id: 'profile-current',
    };

    // `onSubmit` prunes unchanged fields before `submit` computes dirty sections.
    const dataSubmit = pruneUnchangedUpdateFields({ ...stateSubmit }, detailProduct);

    expect(dataSubmit).not.toHaveProperty('shipping_profile_id');
    expect(dirtySections(dataSubmit)).toEqual(['product-basic-info']);
  });

  it('marks shipping dirty when the submitted profile differs', () => {
    expect(dirtySections({ shipping_profile_id: 'profile-next' })).toEqual(['product-shipping']);
  });
});
