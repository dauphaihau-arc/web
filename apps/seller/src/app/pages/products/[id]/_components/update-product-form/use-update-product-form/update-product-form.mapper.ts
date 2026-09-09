// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ProductVariantTypes } from '@arc/enums/product';
import pick from '@arc/utils/pick';
import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';
import type {
  NoneVariant,
  ProductImageReference,
  UpdateProductBody,
} from '~/domains/shop/api/product/contracts/form.contract';

type DetailProduct = DetailShopProductResponse['product'];

export function applyDetailProductToFormState(
  detailProduct: DetailProduct,
  stateSubmit: UpdateProductBody,
  noneVariant: Partial<NoneVariant>,
) {
  const base = pick(detailProduct, [
    'title',
    'description',
    'is_digital',
    'who_made',
    'tags',
    'variant_type',
  ]);

  Object.keys(base).forEach((key) => {
    stateSubmit[key] = base[key];
  });

  stateSubmit.category_id = detailProduct.category?.id;

  if (detailProduct.variant_type === ProductVariantTypes.NONE) {
    noneVariant.amount = detailProduct.inventory.amount;
    noneVariant.stock = detailProduct.inventory.stock;
    noneVariant.sku = detailProduct.inventory.sku;
  }
}

export function pruneUnchangedUpdateFields(
  dataSubmit: UpdateProductBody,
  detailProduct?: DetailProduct,
) {
  if (!detailProduct) {
    return dataSubmit;
  }

  const nextDataSubmit = Object.fromEntries(
    Object.entries(dataSubmit).filter(([key, value]) => {
      if (key === 'category_id') {
        return value !== detailProduct.category?.id;
      }

      if (key === 'attributes') {
        return JSON.stringify(value ?? []) !== JSON.stringify(
          detailProduct.attributes.map(attribute => ({
            attribute_id: attribute.attribute,
            selected: attribute.selected,
          })),
        );
      }

      return JSON.stringify(value) !== JSON.stringify(detailProduct[key]);
    }),
  );

  return nextDataSubmit as UpdateProductBody;
}

export function hasNoneVariantChanges(
  noneVariant: Partial<NoneVariant>,
  detailProduct?: DetailProduct,
) {
  if (!detailProduct || detailProduct.variant_type !== ProductVariantTypes.NONE) {
    return false;
  }

  return noneVariant.amount !== detailProduct.inventory.amount
    || noneVariant.stock !== detailProduct.inventory.stock
    || (noneVariant.sku ?? '') !== (detailProduct.inventory.sku ?? '');
}

export function hasUpdateProductFormChanges({
  isVariantsDirty,
  dataSubmit,
  detailProduct,
  fileImages,
  idsImageForDelete,
  noneVariant,
}: {
  isVariantsDirty: boolean
  dataSubmit: UpdateProductBody
  detailProduct?: DetailProduct
  fileImages: File[]
  idsImageForDelete: Required<Pick<ProductImageReference, 'id'>>[]
  noneVariant: Partial<NoneVariant>
}) {
  return Object.keys(pruneUnchangedUpdateFields(dataSubmit, detailProduct)).length > 0
    || hasNoneVariantChanges(noneVariant, detailProduct)
    || fileImages.length > 0
    || idsImageForDelete.length > 0
    || isVariantsDirty;
}

export function isUpdateProductSubmitDisabled({
  hasFormChanges,
  isFormValid,
  isNoneVariantValid,
  isReady,
  isVariantInputValid,
  isVariantProduct,
}: {
  hasFormChanges: boolean
  isFormValid: boolean
  isNoneVariantValid: boolean
  isReady: boolean
  isVariantInputValid: boolean
  isVariantProduct: boolean
}) {
  return !isReady
    || !hasFormChanges
    || !isFormValid
    || (isVariantProduct ? !isVariantInputValid : !isNoneVariantValid);
}
