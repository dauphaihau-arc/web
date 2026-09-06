// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { QueryClient } from '@tanstack/vue-query';
import type { Ref } from 'vue';
import { toMinorUnits } from '@arc/utils';
import pick from '@arc/utils/pick';
import { toastCustom } from '~/shared/config/toast';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import { resolveMyShopId } from '~/domains/shop/utils/resolve-my-shop-id';
import { useShopPublishProduct } from '~/domains/shop/mutations/publish-product.mutation';
import { useIssueProductImageUploadUrl } from '~/domains/shop/mutations/issue-product-image-upload-url.mutation';
import { useShopSetProductAttributes } from '~/domains/shop/mutations/set-product-attributes.mutation';
import { useShopSetProductImagesByKeys } from '~/domains/shop/mutations/set-product-images-by-keys.mutation';
import { useShopUpdateProduct } from '~/domains/shop/mutations/update-product.mutation';
import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';
import type {
  NoneVariant,
  ProductImageReference,
  UpdateProductBody,
} from '~/domains/shop/api/product/contracts/form.contract';
import type { VariantEditorSubmission } from './update-product-form.types';

type UseUpdateProductSubmitInput = {
  productId: string
  queryClient: QueryClient
  dataDetailProduct: Ref<DetailShopProductResponse | undefined>
  fileImages: Ref<File[]>
  idsImageForDelete: Ref<Required<Pick<ProductImageReference, 'id'>>[]>
  noneVariant: Partial<NoneVariant>
};

export type UpdateProductAction = 'save' | 'publish' | 'deactivate';

export function buildDetailPayload(dataSubmit: UpdateProductBody) {
  return pick(dataSubmit, [
    'title',
    'description',
    'who_made',
    'is_digital',
    'non_taxable',
    'tags',
    'variant_group_name',
    'variant_sub_group_name',
    'category_id',
  ]);
}

function buildAttributesPayload(
  attributes: NonNullable<UpdateProductBody['attributes']>,
) {
  return attributes.map(attribute => ({
    category_attribute_id: attribute.attribute_id,
    selected_option_id: attribute.selected,
  }));
}

function buildImagesPayload(
  dataDetailProduct: DetailShopProductResponse | undefined,
  idsImageForDelete: Required<Pick<ProductImageReference, 'id'>>[],
  uploadedKeys: string[] = [],
  assetHost = '',
) {
  const currentImages = dataDetailProduct?.product.images ?? [];
  const deletedImageIds = new Set(idsImageForDelete.map(image => image.id));
  const persistedImages = currentImages
    .filter(image => !deletedImageIds.has(image.id))
    .map(image => toStorageKey(image.relative_url, assetHost))
    .filter((storageKey): storageKey is string => !!storageKey);

  return [...persistedImages, ...uploadedKeys].map((storageKey, index) => ({
    storage_key: storageKey,
    rank: index + 1,
  }));
}

function toStorageKey(url: string | undefined, assetHost: string) {
  if (!url) {
    return undefined;
  }

  const normalizedAssetHost = assetHost.replace(/\/+$/, '');

  if (normalizedAssetHost && url.startsWith(`${normalizedAssetHost}/`)) {
    return decodeURIComponent(url.slice(normalizedAssetHost.length + 1));
  }

  return url.replace(/^\/+/, '');
}

function hasNoneVariantInventoryChange(
  noneVariant: Partial<NoneVariant>,
  detailProduct: DetailShopProductResponse['product'] | undefined,
) {
  if (!detailProduct || detailProduct.variant_type !== 'none') {
    return false;
  }

  return noneVariant.stock !== detailProduct.inventory.stock
    || (noneVariant.sku ?? '') !== (detailProduct.inventory.sku ?? '');
}

function hasNoneVariantPricingChange(
  noneVariant: Partial<NoneVariant>,
  detailProduct: DetailShopProductResponse['product'] | undefined,
) {
  if (!detailProduct || detailProduct.variant_type !== 'none') {
    return false;
  }

  return noneVariant.amount !== detailProduct.inventory.amount;
}

type VariantPersistenceApi = Pick<
  typeof shopProductApi,
  'detail' | 'setInventory' | 'setPricing' | 'setVariants'
>;

type SaveVariantEditorSubmissionInput = {
  api?: VariantPersistenceApi
  detailProduct: DetailShopProductResponse['product']
  productId: string
  shopId: string
  submission: VariantEditorSubmission
};

type PersistedVariantRow = {
  optionValue1: string
  optionValue2?: string
  productVariantId: string
  inventoryId?: string
  amount?: number
  stock?: number
  sku?: string
  currency?: string
};

export async function saveVariantEditorSubmission({
  api = shopProductApi,
  detailProduct,
  productId,
  shopId,
  submission,
}: SaveVariantEditorSubmissionInput) {
  const initialRows = flattenPersistedVariantRows(detailProduct);
  const initialRowsByKey = new Map(
    initialRows.map(row => [variantRowKey(row.optionValue1, row.optionValue2), row]),
  );
  const shapeChanged = hasVariantShapeChange(initialRows, submission);
  const inventoryChanged = shapeChanged || submission.rows.some((row) => {
    const current = initialRowsByKey.get(variantRowKey(row.optionValue1, row.optionValue2));
    return !current
      || current.stock !== row.stock
      || (current.sku ?? '') !== (row.sku ?? '');
  });
  const pricingChanged = shapeChanged || submission.rows.some((row) => {
    const current = initialRowsByKey.get(variantRowKey(row.optionValue1, row.optionValue2));
    return !current || current.amount !== row.amount;
  });
  const fallbackCurrency = initialRows.find(row => row.currency)?.currency ?? 'USD';
  let persistedRows = initialRows;

  if (shapeChanged) {
    await api.setVariants(shopId, productId, {
      variants: submission.rows.map(row => ({
        option_value_1: row.optionValue1,
        ...(row.optionValue2 ? { option_value_2: row.optionValue2 } : {}),
      })),
    });
    persistedRows = flattenPersistedVariantRows(
      (await api.detail(shopId, productId)).product,
    );
  }

  if (inventoryChanged) {
    const persistedRowsByKey = new Map(
      persistedRows.map(row => [variantRowKey(row.optionValue1, row.optionValue2), row]),
    );
    await api.setInventory(shopId, productId, {
      inventory: submission.rows.map((row) => {
        const persisted = persistedRowsByKey.get(
          variantRowKey(row.optionValue1, row.optionValue2),
        );
        if (!persisted) {
          throw new Error('Updated product variant could not be resolved');
        }
        return {
          product_variant_id: persisted.productVariantId,
          stock: row.stock,
          sku: row.sku,
        };
      }),
    });
    persistedRows = flattenPersistedVariantRows(
      (await api.detail(shopId, productId)).product,
    );
  }

  if (pricingChanged || inventoryChanged) {
    const persistedRowsByKey = new Map(
      persistedRows.map(row => [variantRowKey(row.optionValue1, row.optionValue2), row]),
    );
    await api.setPricing(shopId, productId, {
      pricing: submission.rows.map((row) => {
        const persisted = persistedRowsByKey.get(
          variantRowKey(row.optionValue1, row.optionValue2),
        );
        if (!persisted?.inventoryId) {
          throw new Error('Updated product inventory could not be resolved');
        }
        return {
          inventory_id: persisted.inventoryId,
          amount_minor: toMinorUnits(row.amount, persisted.currency ?? fallbackCurrency),
        };
      }),
    });
  }
}

export function useUpdateProductSubmit({
  productId,
  queryClient,
  dataDetailProduct,
  fileImages,
  idsImageForDelete,
  noneVariant,
}: UseUpdateProductSubmitInput) {
  const toast = useToast();
  const config = useRuntimeConfig();
  const loadingSubmit = ref(false);
  const loadingAction = ref<UpdateProductAction | null>(null);

  const {
    mutateAsync: issueProductImageUploadUrl,
  } = useIssueProductImageUploadUrl();

  const {
    mutateAsync: updateProduct,
  } = useShopUpdateProduct();

  const {
    mutateAsync: publishProduct,
  } = useShopPublishProduct();

  const {
    mutateAsync: setProductImagesByKeys,
  } = useShopSetProductImagesByKeys();

  const {
    mutateAsync: setProductAttributes,
  } = useShopSetProductAttributes();

  async function uploadImage() {
    if (fileImages.value.length === 0) return [];

    const keys: string[] = [];
    const uploadImagesPromises = [];

    for (let i = 0; i < fileImages.value.length; i++) {
      const { presigned_url: presignedUrl, key } = await issueProductImageUploadUrl({
        productId,
        content_type: fileImages.value[i].type,
        asset_type: 'original',
      });

      if (!presignedUrl || !key) {
        toast.add({
          ...toastCustom.error,
          title: 'Oops',
          description: 'Something wrong',
        });
        throw new Error();
      }

      keys.push(key);

      const promise = useFetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fileImages.value[i].type,
        },
        body: fileImages.value[i],
      });
      uploadImagesPromises.push(promise);
    }

    await Promise.all(uploadImagesPromises);

    return keys;
  }

  function getNextImageCount() {
    const currentImages = dataDetailProduct.value?.product.images ?? [];
    const deletedImageIds = new Set(idsImageForDelete.value.map(image => image.id));

    return currentImages.filter(image => !deletedImageIds.has(image.id)).length +
      fileImages.value.length;
  }

  async function submit(
    dataSubmit: UpdateProductBody,
    action: UpdateProductAction = 'save',
    variantSubmission?: VariantEditorSubmission,
  ) {
    if (action === 'publish' && getNextImageCount() === 0) {
      toast.add({
        ...toastCustom.error,
        title: 'Add at least 1 image before publishing',
      });
      return;
    }

    loadingSubmit.value = true;
    loadingAction.value = action;

    try {
      const uploadedKeys = await uploadImage();
      const detailPayload = buildDetailPayload(dataSubmit);

      if (Object.keys(detailPayload).length > 0) {
        await updateProduct({
          ...detailPayload,
          id: productId,
        });
      }

      const detailProduct = dataDetailProduct.value?.product;
      const shopId = await resolveMyShopId(queryClient);

      if (variantSubmission && detailProduct) {
        await saveVariantEditorSubmission({
          detailProduct,
          productId,
          shopId,
          submission: variantSubmission,
        });
      }

      if (hasNoneVariantPricingChange(noneVariant, detailProduct)) {
        await shopProductApi.setPricing(
          shopId,
          productId,
          {
            pricing: [{
              inventory_id: detailProduct!.inventory.id!,
              amount_minor: toMinorUnits(
                noneVariant.amount!,
                detailProduct!.inventory.currency ?? 'USD',
              ),
            }],
          },
        );
      }

      if (hasNoneVariantInventoryChange(noneVariant, detailProduct)) {
        await shopProductApi.setInventory(
          shopId,
          productId,
          {
            inventory: [{
              stock: noneVariant.stock!,
              sku: noneVariant.sku,
            }],
          },
        );
      }

      if (dataSubmit.attributes) {
        await setProductAttributes({
          id: productId,
          attributes: buildAttributesPayload(dataSubmit.attributes),
        });
      }

      if (uploadedKeys.length > 0 || idsImageForDelete.value.length > 0) {
        await setProductImagesByKeys({
          id: productId,
          images: buildImagesPayload(
            dataDetailProduct.value,
            idsImageForDelete.value,
            uploadedKeys,
            config.public.assetHost ?? '',
          ),
        });
      }

      await queryClient.invalidateQueries({
        queryKey: ['shop-get-detail-product', productId],
      });

      await queryClient.invalidateQueries({
        queryKey: ['shop-get-products'],
      });

      if (action === 'publish') {
        await publishProduct(productId);
      }

      if (action === 'deactivate') {
        const resolvedShopId = await resolveMyShopId(queryClient);
        await shopProductApi.bulkMutate(resolvedShopId, {
          ids: [productId],
          action: 'deactivate',
        });
      }

      await queryClient.invalidateQueries({
        queryKey: ['shop-get-detail-product', productId],
      });

      await queryClient.invalidateQueries({
        queryKey: ['shop-get-products'],
      });

      toast.add({
        ...toastCustom.success,
        title: action === 'publish'
          ? 'Product published'
          : action === 'deactivate'
            ? 'Product deactivated'
            : 'Update product success',
      });
    }
    catch {
      toast.add({
        ...toastCustom.error,
        title: 'Update product failed',
      });
    }
    finally {
      loadingSubmit.value = false;
      loadingAction.value = null;
    }
  }

  return {
    loadingAction,
    loadingSubmit,
    submit,
  };
}

function variantRowKey(optionValue1: string, optionValue2?: string) {
  return JSON.stringify([optionValue1, optionValue2 ?? null]);
}

function flattenPersistedVariantRows(
  product: DetailShopProductResponse['product'],
): PersistedVariantRow[] {
  if (product.variant_type === 'single') {
    return product.variants.map(variant => ({
      optionValue1: variant.variant_name,
      productVariantId: variant.id,
      inventoryId: variant.inventory?.id,
      amount: variant.inventory?.amount,
      stock: variant.inventory?.stock,
      sku: variant.inventory?.sku,
      currency: variant.inventory?.currency,
    }));
  }

  return product.variants.flatMap(variant =>
    (variant.variant_options ?? []).map(option => ({
      optionValue1: variant.variant_name,
      optionValue2: option.variant.variant_name,
      productVariantId: option.id,
      inventoryId: option.inventory.id,
      amount: option.inventory.amount,
      stock: option.inventory.stock,
      sku: option.inventory.sku,
      currency: option.inventory.currency,
    })),
  );
}

function hasVariantShapeChange(
  currentRows: PersistedVariantRow[],
  submission: VariantEditorSubmission,
) {
  return JSON.stringify(currentRows.map(row => [
    row.optionValue1,
    row.optionValue2 ?? null,
  ])) !== JSON.stringify(submission.rows.map(row => [
    row.optionValue1,
    row.optionValue2 ?? null,
  ]));
}
