type ProductRouteInput = {
  id: string
  slug: string
  shop: {
    slug: string
  }
};

export function getProductDetailPath(product: ProductRouteInput): string {
  return `/${product.shop.slug}/${product.slug}`;
}
