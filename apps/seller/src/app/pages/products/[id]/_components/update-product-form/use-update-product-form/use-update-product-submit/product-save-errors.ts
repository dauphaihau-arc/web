import { normalizeDetailShopProductResponse } from '~/domains/shop/api/product/normalizers/detail-shop-product.normalizer';
import type {
  DetailShopProductResponse,
  ShopProductDetailApiResponse,
} from '~/domains/shop/api/product/contracts/read.contract';
import type { ProductFormSectionId } from './product-section-state';

export class ProductSectionSaveError extends Error {
  constructor(
    readonly sectionId: ProductFormSectionId,
    override readonly cause: unknown,
  ) {
    super(`Failed to save ${sectionId}`);
  }
}

type ErrorDetails = Record<string, unknown> & {
  conflicts?: Array<Record<string, unknown>>
  ['affected_ids']?: unknown[]
  ['current_product']?: unknown
};

type ErrorPayload = Record<string, unknown> & {
  code?: string
  message?: string
  details?: ErrorDetails
};

type ErrorLike = {
  data?: ErrorPayload
  status?: number
  statusCode?: number
  message?: string
  response?: Record<string, unknown> & {
    data?: ErrorPayload
    status?: number
  }
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

function toErrorLike(error: unknown): ErrorLike {
  return isRecord(error) ? error as ErrorLike : {};
}

export function readErrorPayload(error: unknown) {
  const errorLike = toErrorLike(error);
  return errorLike.data ?? (errorLike.response?.['_data'] as ErrorPayload | undefined) ?? errorLike.response?.data;
}

export function isConflictError(error: unknown) {
  const errorLike = toErrorLike(error);
  return errorLike.status === 409
    || errorLike.statusCode === 409
    || errorLike.response?.status === 409;
}

export function readConflictProduct(error: unknown): DetailShopProductResponse['product'] | undefined {
  const currentProduct = readErrorPayload(error)?.details?.current_product;

  if (!currentProduct) {
    return undefined;
  }

  if (isShopProductDetailApiResponseLike(currentProduct)) {
    return normalizeDetailShopProductResponse(currentProduct as ShopProductDetailApiResponse).product;
  }

  return currentProduct as DetailShopProductResponse['product'];
}

export function readErrorMessage(error: unknown) {
  const payload = readErrorPayload(error);
  return payload?.message ?? toErrorLike(error).message;
}

export function isSkuConflictError(error: unknown) {
  const payload = readErrorPayload(error);

  return payload?.code === 'PRODUCT_SKU_CONFLICT';
}

export function readSkuConflicts(error: unknown) {
  const details = readErrorPayload(error)?.details;
  const conflicts = Array.isArray(details?.conflicts) ? details.conflicts : [];
  const mappedConflicts = conflicts.map(conflict => ({
    sku: typeof conflict.sku === 'string' ? conflict.sku : undefined,
    inventoryId: typeof conflict.inventory_id === 'string' ? conflict.inventory_id : undefined,
    variantId: typeof conflict.variant_id === 'string' ? conflict.variant_id : undefined,
    clientRef: typeof conflict.client_ref === 'string' ? conflict.client_ref : undefined,
  })).filter(conflict => conflict.sku || conflict.inventoryId || conflict.variantId || conflict.clientRef);

  if (mappedConflicts.length > 0) {
    return mappedConflicts;
  }
  return (details?.['affected_ids'] ?? [])
    .filter((id): id is string => typeof id === 'string')
    .map(id => ({ inventoryId: id }));
}

export function isReservationConflictError(error: unknown) {
  const payload = readErrorPayload(error);

  return payload?.code === 'PRODUCT_RESERVATION_CONFLICT';
}

function isShopProductDetailApiResponseLike(value: unknown) {
  return Boolean(
    isRecord(value)
    && 'product_version' in value
    && Array.isArray(value.variants)
    && Array.isArray(value.inventory),
  );
}
