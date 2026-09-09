import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type {
  CreateDraftProductRequest,
  CreateDraftProductResponse,
} from './contracts/create-draft.contract';
import type {
  GenerateProductDescriptionRequest,
  GenerateProductDescriptionResponse,
} from './contracts/generate-description.contract';
import type {
  BulkMutateShopProductsRequest,
  BulkMutateShopProductsResponse,
  DetailShopProductResponse,
  IssueProductImageUploadUrlRequest,
  IssueProductImageUploadUrlResponse,
  ListShopProductsRequest,
  ListShopProductsResponse,
  ShopProductDetailApiResponse,
} from './contracts/read.contract';
import { normalizeDetailShopProductResponse } from './normalizers/detail-shop-product.normalizer';
import type {
  SetProductAttributesRequestBody,
  SetProductImagesByKeysRequestBody,
  UpdateProductDetailsRequestBody,
  UpdateProductResponse,
} from './contracts/update-product.contract';
import type { SetProductVariantConfigurationRequestBody } from './contracts/variant-configuration.contract';
import type { ShopProductImportResponse } from './contracts/import.contract';
import { apiClient } from '~/domains/_shared/api-client';

function normalizeProductMutationResponse(response: unknown): DetailShopProductResponse {
  return normalizeDetailShopProductResponse(response as ShopProductDetailApiResponse);
}

type ProductMutationBody = {
  idempotency_key?: string
};

function splitIdempotency<TBody extends ProductMutationBody>(payload: TBody) {
  const {
    idempotency_key: idempotencyKey,
    ...body
  } = payload;

  return {
    body,
    options: idempotencyKey
      ? {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
      : undefined,
  };
}

export const shopProductApi = {
  createDraft(shopId: string, payload: CreateDraftProductRequest) {
    const { body, options } = splitIdempotency(payload);

    return apiClient.post<CreateDraftProductResponse>(
      `/shops/${shopId}/products/drafts`,
      body,
      options,
    );
  },

  generateDescription(
    shopId: string,
    payload: GenerateProductDescriptionRequest,
  ) {
    return apiClient.post<GenerateProductDescriptionResponse>(
      `/shops/${shopId}/products/ai/generate-description`,
      payload,
    );
  },

  detail(
    shopId: string,
    productId: string,
    options?: NitroFetchOptions<NitroFetchRequest>,
  ): Promise<DetailShopProductResponse> {
    return apiClient.get(
      `/shops/${shopId}/products/${productId}`,
      undefined,
      options,
    ).then(response =>
      normalizeDetailShopProductResponse(response as ShopProductDetailApiResponse),
    );
  },

  list(shopId: string, query?: ListShopProductsRequest) {
    return apiClient.get<ListShopProductsResponse>(
      `/shops/${shopId}/products`,
      query,
    );
  },

  issueImageUploadUrl(
    shopId: string,
    payload: IssueProductImageUploadUrlRequest,
  ) {
    return apiClient.post<IssueProductImageUploadUrlResponse>(
      `/shops/${shopId}/products/${payload.productId}/image-uploads`,
      {
        content_type: payload.content_type,
        asset_type: payload.asset_type ?? 'original',
      },
    );
  },

  bulkMutate(shopId: string, payload: BulkMutateShopProductsRequest) {
    const { body, options } = splitIdempotency(payload);

    return apiClient.post<BulkMutateShopProductsResponse>(
      `/shops/${shopId}/products/bulk-mutate`,
      body,
      options,
    );
  },

  updateDetails(
    shopId: string,
    productId: string,
    payload: UpdateProductDetailsRequestBody,
  ): Promise<UpdateProductResponse> {
    const { body, options } = splitIdempotency(payload);

    return apiClient.patch(
      `/shops/${shopId}/products/${productId}/details`,
      body,
      options,
    ).then(normalizeProductMutationResponse);
  },

  setVariantConfiguration(
    shopId: string,
    productId: string,
    payload: SetProductVariantConfigurationRequestBody,
  ): Promise<UpdateProductResponse> {
    const { body, options } = splitIdempotency(payload);

    return apiClient.put(
      `/shops/${shopId}/products/${productId}/variant-configuration`,
      body,
      options,
    ).then(normalizeProductMutationResponse);
  },


  setImagesByKeys(
    shopId: string,
    productId: string,
    payload: SetProductImagesByKeysRequestBody,
  ): Promise<UpdateProductResponse> {
    const { body, options } = splitIdempotency(payload);

    return apiClient.put(
      `/shops/${shopId}/products/${productId}/images-by-keys`,
      body,
      options,
    ).then(normalizeProductMutationResponse);
  },

  setAttributes(
    shopId: string,
    productId: string,
    payload: SetProductAttributesRequestBody,
  ): Promise<UpdateProductResponse> {
    const { body, options } = splitIdempotency(payload);

    return apiClient.put(
      `/shops/${shopId}/products/${productId}/attributes`,
      body,
      options,
    ).then(normalizeProductMutationResponse);
  },

  downloadImportTemplate(shopId: string) {
    return apiClient.get<Blob>(
      `/shops/${shopId}/products/imports/template`,
      undefined,
      { responseType: 'blob' },
    );
  },

  startImport(shopId: string, file: File, idempotencyKey: string) {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post<ShopProductImportResponse>(
      `/shops/${shopId}/products/imports`,
      formData,
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      },
    );
  },

  getImport(shopId: string, importId: string) {
    return apiClient.get<ShopProductImportResponse>(
      `/shops/${shopId}/products/imports/${importId}`,
    );
  },

  downloadImportReport(shopId: string, importId: string) {
    return apiClient.get<Blob>(
      `/shops/${shopId}/products/imports/${importId}/report`,
      undefined,
      { responseType: 'blob' },
    );
  },
};
