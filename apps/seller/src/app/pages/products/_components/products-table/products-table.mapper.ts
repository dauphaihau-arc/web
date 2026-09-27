import type { ListShopProductsItem } from '~/domains/shop/api/product/contracts/read.contract';
import type { ProductRow } from './products-table.types';

export function toProductRows(products: ListShopProductsItem[]): ProductRow[] {
  return products.map(product => ({
    id: product.id,
    slug: product.slug,
    title: product.title,
    state: product.state,
    imageUrl: product.image_url,
    variants: product.variants,
    options: product.options,
    inventory: product.inventory,
    hasOptions: (product.options?.length ?? 0) > 0,
  }));
}
