import type {
  IssueReviewImageUploadRequest,
  IssueReviewImageUploadResponse,
  MyProductReviewResponse,
  UpsertMyProductReviewRequest,
} from './contracts/product-review.contract'
import { apiClient } from '~/shared/lib/api-client'

export const meProductReviewApi = {
  upsert(orderItemId: string, payload: UpsertMyProductReviewRequest) {
    return apiClient.put<MyProductReviewResponse>(
      `/me/product-reviews/${orderItemId}`,
      payload,
    )
  },

  issueImageUploadUrl(orderItemId: string, payload: IssueReviewImageUploadRequest) {
    return apiClient.post<IssueReviewImageUploadResponse>(
      `/me/product-reviews/${orderItemId}/image-uploads`,
      payload,
    )
  },
}
