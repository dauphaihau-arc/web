import type { z } from 'zod';
import type { Product, ProductImage } from '~/shared/models/product';
import type { updateProductSchema } from '~/shared/schemas/request/shop-product.schema';

export type UpdateProductRequestBody = z.infer<typeof updateProductSchema> & {
  images?: Partial<Pick<ProductImage, 'id' | 'relative_url' | 'rank'>>[]
};

export type UpdateProductRequest = {
  id: Product['id']
  body: UpdateProductRequestBody
};

export type UpdateProductResponse = {
  product: Product
};
