import { describe, expect, it } from 'vitest'
import { ProductStates } from '@arc/enums/product'
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
  it('accepts default-variant products without option rows', () => {
    const parsed = productSchema.parse({
      ...baseProduct,
      variants: [{
        id: '00000000-0000-4000-8000-000000000006',
        selections: [],
        lifecycle_state: 'active',
      }],
    })

    expect(parsed.options).toEqual([])
    expect(parsed.variants[0].selections).toEqual([])
    expect(parsed.state).toBe(ProductStates.ACTIVE)
  })

  it('accepts normalized option selections for variant products', () => {
    const parsed = productSchema.parse({
      ...baseProduct,
      options: [{
        id: '00000000-0000-4000-8000-000000000007',
        name: 'Size',
        position: 1,
        values: [{
          id: '00000000-0000-4000-8000-000000000008',
          value: 'Small',
          position: 1,
        }],
      }],
      variants: [{
        id: '00000000-0000-4000-8000-000000000009',
        selections: [{
          option_id: '00000000-0000-4000-8000-000000000007',
          value_id: '00000000-0000-4000-8000-000000000008',
        }],
      }],
    })

    expect(parsed.options[0].name).toBe('Size')
    expect(parsed.variants[0].lifecycle_state).toBe('active')
  })

  it('rejects absolute product image URLs', () => {
    const result = productSchema.safeParse({
      ...baseProduct,
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
