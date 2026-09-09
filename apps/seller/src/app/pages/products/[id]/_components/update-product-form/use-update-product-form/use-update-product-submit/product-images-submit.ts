import type {
  DetailShopProductResponse,
  IssueProductImageUploadUrlRequest,
  IssueProductImageUploadUrlResponse,
} from '~/domains/shop/api/product/contracts/read.contract';
import type { ProductImageReference } from '~/domains/shop/api/product/contracts/form.contract';

type UploadProductImagesInput = {
  files: File[]
  issueProductImageUploadUrl: (input: IssueProductImageUploadUrlRequest) => Promise<IssueProductImageUploadUrlResponse>
  onMissingUploadTarget: () => void
  productId: string
};

export async function uploadProductImages({
  files,
  issueProductImageUploadUrl,
  onMissingUploadTarget,
  productId,
}: UploadProductImagesInput) {
  if (files.length === 0) return [];

  const keys: string[] = [];
  const uploadImagesPromises = [];

  for (let i = 0; i < files.length; i++) {
    const { presigned_url: presignedUrl, key } = await issueProductImageUploadUrl({
      productId,
      content_type: files[i].type,
      asset_type: 'original',
    });

    if (!presignedUrl || !key) {
      onMissingUploadTarget();
      throw new Error();
    }

    keys.push(key);

    const promise = useFetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': files[i].type,
      },
      body: files[i],
    });
    uploadImagesPromises.push(promise);
  }

  await Promise.all(uploadImagesPromises);

  return keys;
}

export function getNextProductImageCount({
  dataDetailProduct,
  fileImages,
  idsImageForDelete,
}: {
  dataDetailProduct: DetailShopProductResponse | undefined
  fileImages: File[]
  idsImageForDelete: Required<Pick<ProductImageReference, 'id'>>[]
}) {
  const currentImages = dataDetailProduct?.product.images ?? [];
  const deletedImageIds = new Set(idsImageForDelete.map(image => image.id));

  return currentImages.filter(image => !deletedImageIds.has(image.id)).length +
    fileImages.length;
}

export function buildImagesPayload(
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

export function toStorageKey(url: string | undefined, assetHost: string) {
  if (!url) {
    return undefined;
  }

  const normalizedAssetHost = assetHost.replace(/\/+$/, '');

  if (normalizedAssetHost && url.startsWith(`${normalizedAssetHost}/`)) {
    return decodeURIComponent(url.slice(normalizedAssetHost.length + 1));
  }

  return url.replace(/^\/+/, '');
}
