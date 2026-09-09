import { describe, expect, it } from 'vitest';
import { ProductStates, ProductVariantTypes, ProductWhoMade } from '@arc/enums/product';
import { createProductFormSchema } from './create-product-form.schema';

const draft = {
  title: 'Handmade cotton shirt',
  description: 'A handmade cotton shirt with a comfortable everyday fit.',
  who_made: ProductWhoMade.I_DID,
  is_digital: false,
  state: ProductStates.DRAFT,
  variant_type: ProductVariantTypes.NONE,
};

describe('create product category requirements', () => {
  it('accepts an uncategorized draft but rejects publishing it', () => {
    expect(createProductFormSchema.safeParse(draft).success).toBe(true);
    const published = createProductFormSchema.safeParse({ ...draft, state: ProductStates.ACTIVE });
    expect(published.success).toBe(false);
    if (!published.success) {
      expect(published.error.issues.map(issue => issue.path)).toContainEqual(['category_id']);
    }
    expect(createProductFormSchema.safeParse({
      ...draft,
      state: ProductStates.ACTIVE,
      category_id: '4eb9fb0a-fd36-43c1-bae1-162eef13666c',
    }).success).toBe(true);
  });
});
