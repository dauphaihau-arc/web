import { z } from 'zod'

/**
 * Request body of the review image upload URL endpoint. Kept hand-written
 * because the generated contract still spells these fields in camelCase
 * (`contentType`/`sizeBytes`) while the API accepts the snake_case body this
 * app sends; the response and review shapes are generated lookups.
 */
export const issueReviewImageUploadRequestSchema = z.object({
  content_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
})
