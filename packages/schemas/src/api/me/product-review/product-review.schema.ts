import { z } from 'zod'

export const upsertMyProductReviewRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(5000).optional(),
  image_keys: z.array(z.string()).optional(),
})

export const issueReviewImageUploadRequestSchema = z.object({
  content_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
})

export const issueReviewImageUploadResponseSchema = z.object({
  key: z.string(),
  presigned_url: z.string().url(),
  method: z.literal('PUT'),
})

export const myProductReviewResponseSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  order_item_id: z.string(),
  product: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    shop_slug: z.string(),
  }),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().optional(),
  images: z.array(z.object({
    id: z.string(),
    storage_key: z.string(),
    url: z.string().optional(),
    size_bytes: z.number().int().positive().optional(),
    rank: z.number(),
    variant_status: z.enum(['pending', 'processing', 'ready', 'failed']).optional(),
    variant_error: z.string().optional(),
    variants_generated_at: z.coerce.date().optional(),
    variants: z.record(z.string(), z.object({
      storage_key: z.string(),
      url: z.string().optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      format: z.string().optional(),
    })).optional(),
  })),
  status: z.enum(['published', 'hidden']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})
