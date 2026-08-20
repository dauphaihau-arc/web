import { describe, expect, it } from 'vitest'
import { ProductStates, ProductVariantTypes } from '@arc/enums/product'
import { productSchema } from './product.schema'

const baseProduct = {
  id: '00000000-0000-4000-8000-000000000001',
  shop: '00000000-0000-4000-8000-000000000002',
  category: '00000000-0000-4000-8000-000000000003',
  shipping: '00000000-0000-4000-8000-000000000004',
  attributes: [],
  title: 'Handmade ceramic mug',
  description: 'A handmade ceramic mug with a glazed finish.',
  tags: ['ceramic'],
  images: [
    {
      id: '00000000-0000-4000-8000-000000000005',
      relative_url: 'shop/shop-1/products/mug.png',
      rank: 1,
    },
  ],
  updated_at: new Date('2026-08-20T00:00:00.000Z'),
  created_at: new Date('2026-08-20T00:00:00.000Z'),
}

describe('productSchema', () => {
  it('accepts products without variants when inventory is provided', () => {
    const parsed = productSchema.parse({
      ...baseProduct,
      variant_type: ProductVariantTypes.NONE,
      inventory: '00000000-0000-4000-8000-000000000006',
    })

    expect(parsed.variant_type).toBe(ProductVariantTypes.NONE)
    expect(parsed.state).toBe(ProductStates.ACTIVE)
  })

  it('requires variant group data for single variants', () => {
    const result = productSchema.safeParse({
      ...baseProduct,
      variant_type: ProductVariantTypes.SINGLE,
      variants: ['00000000-0000-4000-8000-000000000007'],
    })

    expect(result.success).toBe(false)
  })

  it('rejects absolute product image URLs', () => {
    const result = productSchema.safeParse({
      ...baseProduct,
      variant_type: ProductVariantTypes.NONE,
      inventory: '00000000-0000-4000-8000-000000000006',
      images: [
        {
          id: '00000000-0000-4000-8000-000000000005',
          relative_url: 'https://cdn.example.com/mug.png',
          rank: 1,
        },
      ],
    })

    expect(result.success).toBe(false)
  })
})
