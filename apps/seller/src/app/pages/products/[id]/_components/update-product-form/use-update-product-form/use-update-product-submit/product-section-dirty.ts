import pick from '@arc/utils/pick';
import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';
import type {
  NoneVariant,
  ProductImageReference,
  UpdateProductBody,
} from '~/domains/shop/api/product/contracts/form.contract';
import type { ProductFormSectionId } from './product-section-state';

export const BASIC_INFO_FIELDS = ['title', 'description'] as const;
export const DETAILS_FIELDS = [
  'who_made',
  'is_digital',
  'non_taxable',
  'tags',
  'category_id',
  'attributes',
] as const;

export function buildDetailPayload(dataSubmit: UpdateProductBody) {
  return pick(dataSubmit, [
    'title',
    'description',
    'who_made',
    'is_digital',
    'non_taxable',
    'tags',
    'category_id',
  ] as (keyof UpdateProductBody)[]);
}

export function hasNoneVariantInventoryChange(
  noneVariant: Partial<NoneVariant>,
  detailProduct: DetailShopProductResponse['product'] | undefined,
) {
  if (!detailProduct || detailProduct.variant_type !== 'none') {
    return false;
  }

  return noneVariant.stock !== detailProduct.inventory.onHandQuantity
    || (noneVariant.sku ?? '') !== (detailProduct.inventory.sku ?? '');
}

export function hasNoneVariantPricingChange(
  noneVariant: Partial<NoneVariant>,
  detailProduct: DetailShopProductResponse['product'] | undefined,
) {
  if (!detailProduct || detailProduct.variant_type !== 'none') {
    return false;
  }

  return noneVariant.amount !== detailProduct.inventory.amount;
}

export function getDirtyProductSectionIds({
  dataSubmit,
  detailProduct,
  fileImages,
  idsImageForDelete,
  isVariantsDirty,
  noneVariant,
}: {
  dataSubmit: UpdateProductBody
  detailProduct?: DetailShopProductResponse['product']
  fileImages: File[]
  idsImageForDelete: Required<Pick<ProductImageReference, 'id'>>[]
  isVariantsDirty: boolean
  noneVariant: Partial<NoneVariant>
}): ProductFormSectionId[] {
  if (!detailProduct) {
    return [];
  }

  const changedFields = new Set(Object.keys(buildDetailPayload(dataSubmit)).filter((field) => {
    if (field === 'category_id') {
      return dataSubmit.category_id !== detailProduct.category?.id;
    }

    return JSON.stringify(dataSubmit[field as keyof UpdateProductBody]) !==
      JSON.stringify(detailProduct[field as keyof typeof detailProduct]);
  }));

  if (dataSubmit.attributes) {
    const currentAttributes = detailProduct.attributes.map(attribute => ({
      attribute_id: attribute.attribute,
      selected: attribute.selected,
    }));

    if (JSON.stringify(dataSubmit.attributes) !== JSON.stringify(currentAttributes)) {
      changedFields.add('attributes');
    }
  }

  const dirtySections: ProductFormSectionId[] = [];

  if (
    BASIC_INFO_FIELDS.some(field => changedFields.has(field))
    || fileImages.length > 0
    || idsImageForDelete.length > 0
  ) {
    dirtySections.push('product-basic-info');
  }

  if (isVariantsDirty || hasNoneVariantInventoryChange(noneVariant, detailProduct) || hasNoneVariantPricingChange(noneVariant, detailProduct)) {
    dirtySections.push('product-inventory');
  }

  if (DETAILS_FIELDS.some(field => changedFields.has(field))) {
    dirtySections.push('product-details');
  }

  return dirtySections;
}
