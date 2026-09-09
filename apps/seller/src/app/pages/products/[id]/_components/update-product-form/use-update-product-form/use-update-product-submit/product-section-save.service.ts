import pick from '@arc/utils/pick';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';
import type {
  NoneVariant,
  ProductImageReference,
  UpdateProductBody,
} from '~/domains/shop/api/product/contracts/form.contract';
import type { VariantEditorSubmission } from '../update-product-form.types';
import type {
  ProductFormSectionId,
  ProductFormSectionStates,
  ProductSkuConflict,
} from './product-section-state';
import {
  BASIC_INFO_FIELDS,
  DETAILS_FIELDS,
  hasNoneVariantInventoryChange,
  hasNoneVariantPricingChange,
} from './product-section-dirty';
import { buildImagesPayload } from './product-images-submit';
import {
  ProductSectionSaveError,
  isConflictError,
  isReservationConflictError,
  isSkuConflictError,
  readConflictProduct,
  readSkuConflicts,
} from './product-save-errors';
import {
  saveDefaultVariantConfiguration,
  saveVariantEditorSubmission,
} from './variant-submission-persistence';

export async function saveUpdateProductSections({
  api = shopProductApi,
  assetHost = '',
  dataDetailProduct,
  dataSubmit,
  idempotencyKey = nextProductMutationIdempotencyKey,
  idsImageForDelete,
  noneVariant,
  onSectionSaved,
  sectionStates,
  sectionsToSave,
  shopId,
  uploadedKeys = [],
  variantSubmission,
}: {
  api?: typeof shopProductApi
  assetHost?: string
  dataDetailProduct: DetailShopProductResponse
  dataSubmit: UpdateProductBody
  idempotencyKey?: () => string
  idsImageForDelete: Required<Pick<ProductImageReference, 'id'>>[]
  noneVariant: Partial<NoneVariant>
  onSectionSaved?: (detail: DetailShopProductResponse) => void
  sectionStates: ProductFormSectionStates
  sectionsToSave: ProductFormSectionId[]
  shopId: string
  uploadedKeys?: string[]
  variantSubmission?: VariantEditorSubmission
}) {
  let currentDetail = dataDetailProduct;
  const submitStartVersion = dataDetailProduct.product.productVersion;

  for (const sectionId of sectionsToSave) {
    const sectionProductVersion = resolveSectionProductVersion(
      sectionStates[sectionId],
      currentDetail.product.productVersion,
      submitStartVersion,
    );

    sectionStates[sectionId].status = 'pending';
    sectionStates[sectionId].error = undefined;
    sectionStates[sectionId].errorMessage = undefined;
    sectionStates[sectionId].errorTitle = undefined;
    sectionStates[sectionId].skuConflicts = undefined;
    sectionStates[sectionId].conflict = undefined;

    try {
      if (sectionId === 'product-basic-info') {
        currentDetail = await saveBasicInfoSection({
          api,
          assetHost,
          currentDetail,
          dataSubmit,
          expectedProductVersion: sectionProductVersion,
          idempotencyKey,
          idsImageForDelete,
          uploadedKeys,
          shopId,
        });
      }

      if (sectionId === 'product-inventory') {
        currentDetail = await saveInventorySection({
          api,
          dataSubmit,
          currentDetail,
          expectedProductVersion: sectionProductVersion,
          idempotencyKey,
          noneVariant,
          shopId,
          variantSubmission,
        });
      }

      if (sectionId === 'product-details') {
        currentDetail = await saveDetailsSection({
          api,
          currentDetail,
          dataSubmit,
          expectedProductVersion: sectionProductVersion,
          idempotencyKey,
          shopId,
        });
      }

      sectionStates[sectionId].productVersion = undefined;
      sectionStates[sectionId].status = 'success';
      onSectionSaved?.(currentDetail);
    }
    catch (error) {
      sectionStates[sectionId].error = error;
      sectionStates[sectionId].errorMessage = undefined;
      sectionStates[sectionId].errorTitle = undefined;
      const isSkuConflict = isSkuConflictError(error);
      sectionStates[sectionId].status = isConflictError(error) && !isSkuConflict ? 'conflict' : 'error';
      sectionStates[sectionId].skuConflicts = readSubmittedSkuConflicts(readSkuConflicts(error), {
        noneVariant,
        variantSubmission,
      });

      if (isSkuConflict) {
        sectionStates[sectionId].errorTitle = 'SKU already in use';
        sectionStates[sectionId].errorMessage = 'Another product or variant in your shop already uses this SKU. Enter a unique SKU before saving.';
      }

      if (sectionStates[sectionId].status === 'conflict') {
        const isReservationConflict = isReservationConflictError(error);
        sectionStates[sectionId].conflict = {
          currentProduct: readConflictProduct(error),
          title: isReservationConflict ? 'Inventory update blocked' : 'Someone updated this section',
          message: isReservationConflict
            ? 'A buyer has this variant reserved in checkout. You can’t remove this option or variant until the checkout is paid or the reservation expires.'
            : 'Your edits are based on an older version. You can overwrite with your edits or refresh to use the latest saved values.',
          reapplyAvailable: !isReservationConflict,
        };
      }

      throw new ProductSectionSaveError(sectionId, error);
    }
  }

  return currentDetail;
}

function readSubmittedSkuConflicts(
  conflicts: ProductSkuConflict[],
  input: {
    noneVariant: Partial<NoneVariant>
    variantSubmission?: VariantEditorSubmission
  },
) {
  if (conflicts.some(conflict => conflict.sku)) {
    return conflicts;
  }

  const submittedSkus = [
    ...new Set([
      ...input.variantSubmission?.rows.map(row => row.sku?.trim()).filter((sku): sku is string => Boolean(sku)) ?? [],
      input.noneVariant.sku?.trim(),
    ].filter((sku): sku is string => Boolean(sku))),
  ];

  return submittedSkus.length === 1
    ? conflicts.map(conflict => ({ ...conflict, sku: submittedSkus[0] }))
    : conflicts;
}

async function saveBasicInfoSection({
  api,
  assetHost,
  currentDetail,
  dataSubmit,
  idempotencyKey,
  idsImageForDelete,
  shopId,
  expectedProductVersion,
  uploadedKeys,
}: {
  api: typeof shopProductApi
  assetHost: string
  currentDetail: DetailShopProductResponse
  dataSubmit: UpdateProductBody
  idempotencyKey: () => string
  idsImageForDelete: Required<Pick<ProductImageReference, 'id'>>[]
  shopId: string
  uploadedKeys: string[]
  expectedProductVersion: number
}) {
  const product = currentDetail.product;
  const payload = pick(dataSubmit, [...BASIC_INFO_FIELDS]);

  if (Object.keys(payload).length > 0) {
    currentDetail = await api.updateDetails(shopId, product.id, {
      product_version: expectedProductVersion,
      ...payload,
      idempotency_key: idempotencyKey(),
    });
  }

  if (uploadedKeys.length > 0 || idsImageForDelete.length > 0) {
    currentDetail = await api.setImagesByKeys(shopId, product.id, {
      product_version: Object.keys(payload).length > 0 ? currentDetail.product.productVersion : expectedProductVersion,
      idempotency_key: idempotencyKey(),
      images: buildImagesPayload(
        currentDetail,
        idsImageForDelete,
        uploadedKeys,
        assetHost,
      ),
    });
  }

  return currentDetail;
}

async function saveInventorySection({
  api,
  dataSubmit,
  currentDetail,
  idempotencyKey,
  noneVariant,
  shopId,
  expectedProductVersion,
  variantSubmission,
}: {
  api: typeof shopProductApi
  dataSubmit: UpdateProductBody
  currentDetail: DetailShopProductResponse
  idempotencyKey: () => string
  noneVariant: Partial<NoneVariant>
  shopId: string
  variantSubmission?: VariantEditorSubmission
  expectedProductVersion: number
}) {
  const product = currentDetail.product;

  if (variantSubmission) {
    return {
      product: await saveVariantEditorSubmission({
        expectedProductVersion,
        api,
        detailProduct: product,
        idempotencyKey,
        productId: product.id,
        shopId,
        submission: variantSubmission,
      }),
    };
  }

  if (
    (product.variant_type !== 'none' && dataSubmit.variant_type === 'none')
    || hasNoneVariantInventoryChange(noneVariant, product)
    || hasNoneVariantPricingChange(noneVariant, currentDetail.product)
  ) {
    return {
      product: await saveDefaultVariantConfiguration({
        api,
        expectedProductVersion,
        detailProduct: currentDetail.product,
        idempotencyKey,
        noneVariant,
        productId: product.id,
        shopId,
      }),
    };
  }

  return currentDetail;
}

async function saveDetailsSection({
  api,
  currentDetail,
  dataSubmit,
  idempotencyKey,
  shopId,
  expectedProductVersion,
}: {
  api: typeof shopProductApi
  currentDetail: DetailShopProductResponse
  dataSubmit: UpdateProductBody
  idempotencyKey: () => string
  shopId: string
  expectedProductVersion: number
}) {
  const product = currentDetail.product;
  const payload = buildChangedDetailsPayload(dataSubmit, product);

  if (Object.keys(payload).length > 0) {
    currentDetail = await api.updateDetails(shopId, product.id, {
      product_version: expectedProductVersion,
      ...payload,
      idempotency_key: idempotencyKey(),
    });
  }

  if (dataSubmit.attributes) {
    currentDetail = await api.setAttributes(shopId, product.id, {
      product_version: Object.keys(payload).length > 0 ? currentDetail.product.productVersion : expectedProductVersion,
      idempotency_key: idempotencyKey(),
      attributes: buildAttributesPayload(dataSubmit.attributes),
    });
  }

  return currentDetail;
}

function resolveSectionProductVersion(
  sectionState: ProductFormSectionStates[ProductFormSectionId],
  currentVersion: number,
  submitStartVersion: number,
) {
  return sectionState.productVersion != null && sectionState.productVersion < submitStartVersion
    ? sectionState.productVersion
    : currentVersion;
}

function buildChangedDetailsPayload(
  dataSubmit: UpdateProductBody,
  product: DetailShopProductResponse['product'],
) {
  return Object.fromEntries(
    Object.entries(pick(dataSubmit, DETAILS_FIELDS.filter(field => field !== 'attributes') as (keyof UpdateProductBody)[]))
      .filter(([field, value]) => {
        if (field === 'category_id') {
          return value !== product.category?.id;
        }

        return JSON.stringify(value) !== JSON.stringify(product[field as keyof typeof product]);
      }),
  ) as UpdateProductBody;
}

function buildAttributesPayload(
  attributes: NonNullable<UpdateProductBody['attributes']>,
) {
  return attributes.map(attribute => ({
    category_attribute_id: attribute.attribute_id,
    selected_option_id: attribute.selected,
  }));
}

let idempotencySequence = 0;

export function nextProductMutationIdempotencyKey() {
  idempotencySequence += 1;
  return `seller-product-update-${Date.now()}-${idempotencySequence}`;
}
