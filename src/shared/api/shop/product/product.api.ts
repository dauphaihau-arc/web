import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type {
  CreateDraftProductRequest,
  CreateDraftProductResponse
} from './create-draft';
import type {
  DetailShopProductResponse
} from './detail';
import { normalizeDetailShopProductResponse } from './detail';
import type {
  ListShopProductsRequest,
  ListShopProductsResponse
} from './list';
import type {
  IssueProductImageUploadUrlRequest,
  IssueProductImageUploadUrlResponse
} from './issue-image-upload-url';
import type { RemoveProductResponse } from './remove';
import type {
  UpdateProductRequestBody,
  UpdateProductResponse
} from './update';
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
      normalizeDetailShopProductResponse(response as Parameters<typeof normalizeDetailShopProductResponse>[0])
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
