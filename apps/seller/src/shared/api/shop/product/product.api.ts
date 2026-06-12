import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type {
  CreateDraftProductRequest,
  CreateDraftProductResponse
} from './contracts/create-draft.contract';
import type {
  BulkMutateShopProductsRequest,
  BulkMutateShopProductsResponse,
  DetailShopProductResponse,
  IssueProductImageUploadUrlRequest,
  IssueProductImageUploadUrlResponse,
  ListShopProductsRequest,
  ListShopProductsResponse,
  RemoveProductResponse,
  ShopProductDetailApiResponse
} from './contracts/read.contract';
import { normalizeDetailShopProductResponse } from './normalizers/detail-shop-product.normalizer';
import type {
  UpdateProductRequestBody,
  UpdateProductResponse
} from './contracts/update-product.contract';
import { apiClient } from '~/shared/lib/api-client';

export const shopProductApi = {
  createDraft(shopId: string, payload: CreateDraftProductRequest) {
    return apiClient.post<CreateDraftProductResponse>(
      `/shops/${shopId}/products/drafts`,
      payload
    );
  },

  detail(
    shopId: string,
    productId: string,
    options?: NitroFetchOptions<NitroFetchRequest>
  ): Promise<DetailShopProductResponse> {
    return apiClient.get(
      `/shops/${shopId}/products/${productId}`,
      undefined,
      options
    ).then(response =>
      normalizeDetailShopProductResponse(response as ShopProductDetailApiResponse)
    );
  },

  list(shopId: string, query?: ListShopProductsRequest) {
    return apiClient.get<ListShopProductsResponse>(
      `/shops/${shopId}/products`,
      query
    );
  },

  issueImageUploadUrl(
    shopId: string,
    payload: IssueProductImageUploadUrlRequest
  ) {
    return apiClient.post<IssueProductImageUploadUrlResponse>(
      `/shops/${shopId}/products/${payload.productId}/image-uploads`,
      {
        content_type: payload.content_type,
        asset_type: payload.asset_type ?? 'original',
      }
    );
  },

  remove(shopId: string, productId: string) {
    return apiClient.delete<RemoveProductResponse>(
      `/shops/${shopId}/products/${productId}`
    );
  },

  bulkMutate(shopId: string, payload: BulkMutateShopProductsRequest) {
    return apiClient.post<BulkMutateShopProductsResponse>(
      `/shops/${shopId}/products/bulk-mutate`,
      payload
    );
  },

  update(
    shopId: string,
    productId: string,
    payload: UpdateProductRequestBody
  ) {
    return apiClient.patch<UpdateProductResponse>(
      `/shops/${shopId}/products/${productId}`,
      payload
    );
  },
};
