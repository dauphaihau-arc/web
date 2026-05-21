// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ProductVariantTypes } from '~/shared/config/enums/product';
import type { DetailShopProductResponse } from '~/shared/api/shop/product/detail';
import type { NoneVariant, UpdateProductBody } from '~/shared/api/shop/product/form';
import type { ProductImage } from '~/shared/models/product';
import pick from '~/shared/utils/pick';

type DetailProduct = DetailShopProductResponse['product'];

export function applyDetailProductToFormState(
  detailProduct: DetailProduct,
  stateSubmit: UpdateProductBody,
  noneVariant: Partial<NoneVariant>
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

  stateSubmit.category_id = detailProduct.category.id;

  if (detailProduct.variant_type === ProductVariantTypes.NONE) {
    noneVariant.price = detailProduct.inventory.price;
    noneVariant.stock = detailProduct.inventory.stock;
    noneVariant.sku = detailProduct.inventory.sku;
  }
}

export function pruneUnchangedUpdateFields(
  dataSubmit: UpdateProductBody,
  detailProduct?: DetailProduct
) {
  if (!detailProduct) {
    return dataSubmit;
  }

  const nextDataSubmit = Object.fromEntries(
    Object.entries(dataSubmit).filter(([key, value]) => {
      if (key === 'category_id') {
        return value !== detailProduct.category.id;
      }

      return JSON.stringify(value) !== JSON.stringify(detailProduct[key]);
    })
  );

  return nextDataSubmit as UpdateProductBody;
}

export function hasRemovedAllImages(
  idsImageForDelete: Pick<ProductImage, 'id'>[],
  fileImages: File[],
  detailProduct?: DetailProduct
) {
  if (!detailProduct) {
    return false;
  }

  return idsImageForDelete.length === detailProduct.images.length &&
    fileImages.length === 0;
}
