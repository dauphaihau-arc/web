import type { components } from '@arc/schemas/api/generated/openapi';
import type { z } from 'zod';
import type { issueReviewImageUploadRequestSchema } from '@arc/schemas/api/me/product-review/product-review.schema';

export type UpsertMyProductReviewRequest = components['schemas']['UpsertMyProductReviewDto'];
export type MyProductReviewResponse = components['schemas']['MyProductReviewResponseDto'];
/**
 * Kept from the hand-written schema: the contract still spells this request in
 * camelCase (`contentType`/`sizeBytes`) while the API accepts the snake_case
 * body the app sends. Adopting it now would change the request payload.
 */
export type IssueReviewImageUploadRequest = z.input<typeof issueReviewImageUploadRequestSchema>;
export type IssueReviewImageUploadResponse =
  components['schemas']['ReviewImageUploadUrlResponseDto'];
