import type { z } from 'zod';
import type {
  issueReviewImageUploadRequestSchema,
  issueReviewImageUploadResponseSchema,
  myProductReviewResponseSchema,
  upsertMyProductReviewRequestSchema
} from '@arc/schemas/api/me/product-review/product-review.schema';

export type UpsertMyProductReviewRequest = z.input<typeof upsertMyProductReviewRequestSchema>;
export type MyProductReviewResponse = z.infer<typeof myProductReviewResponseSchema>;
export type IssueReviewImageUploadRequest = z.input<typeof issueReviewImageUploadRequestSchema>;
export type IssueReviewImageUploadResponse = z.infer<typeof issueReviewImageUploadResponseSchema>;
