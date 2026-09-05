import { describe, expect, it } from 'vitest';
import { pruneUnchangedUpdateFields } from './update-product-form.mapper';

describe('pruneUnchangedUpdateFields', () => {
  it('does not submit unchanged normalized product attributes', () => {
    const detailProduct = {
      category: {
        id: 'category-1',
      },
      attributes: [
        {
          attribute: 'attribute-1',
          selected: 'option-1',
        },
      ],
    };

    expect(pruneUnchangedUpdateFields({
      category_id: 'category-1',
      attributes: [
        {
          attribute_id: 'attribute-1',
          selected: 'option-1',
        },
      ],
    }, detailProduct as never)).toEqual({});
  });
});
