import type {
  Product,
  ProductCombineVariant,
  ProductImage,
  ProductInventory,
  ProductSingleVariant,
  ProductVariant
} from '~/shared/types/product';
import type { Coupon } from '~/shared/types/coupon';
import type { Shop } from '~/shared/types/shop';
import type { Cart } from '~/shared/types/cart';
import type { User } from '~/shared/types/user';

export type CartProductItem = {
  id: string
  quantity: number
  isSelected: boolean
  unitPrice: number
  product: Pick<Product, 'id' | 'title'> & {
    variantType: Product['variant_type']
    variantGroupName?: ProductSingleVariant['variant_group_name']
    variantSubGroupName?: ProductCombineVariant['variant_sub_group_name']
    imageUrl?: ProductImage['relative_url']
  }
  inventory: {
    id: ProductInventory['id']
    price: ProductInventory['price']
    salePrice?: ProductInventory['price']
    stock: ProductInventory['stock']
    sku?: ProductInventory['sku']
    variantName?: ProductInventory['variant']
  }
};

export type CartShopGroup = {
  shop: {
    id: Shop['id']
    name: Shop['shop_name']
  }
  items: CartProductItem[]
  totalPrice: number
  totalShippingFee: number
};

export type CartSummary = {
  subtotalPrice: number
  totalDiscount: number
  subtotalAfterDiscount: number
  totalShippingFee: number
  totalPrice: number
  totalSelectedQuantity: number
  totalQuantity: number
};

export type CartRecentItem = {
  itemId: string
  product: Pick<Product, 'id' | 'title'> & {
    imageUrl?: ProductImage['relative_url']
  }
  inventory: {
    variantName?: ProductInventory['variant']
  }
  quantity: number
};

export type CartResource = {
  id: Cart['id']
  userId: User['id']
  isTemp: boolean
  shopGroups: CartShopGroup[]
  recentItems: CartRecentItem[]
  totalQuantity: number
};

export type ResponseGetCart = {
  cart: CartResource | null
  summary: CartSummary
};

export type ResponseGetCartProductCart = CartProductItem;
export type ResponseGetCartShopCart = CartShopGroup;
export type ResponseGetCartSummaryOrder = CartSummary;

export type UpdateCartBody = Partial<{
  cartId: Cart['id']
  inventoryId: ProductInventory['id']
  isSelected: boolean
  quantity: number
  additionInfoTempCart: {
    promoCodes: Coupon['code'][]
    note?: string
  }
  additionInfoShopCarts: {
    shopId: Shop['id']
    promoCodes?: Coupon['code'][]
    note?: string
  }[]
}>;

export type ResponseUpdateCart = ResponseGetCart;

export type AddProductToCartBody = {
  inventoryId: ProductInventory['id']
  quantity: number
  variantId?: ProductVariant['id']
  isTemp?: boolean
};

export type ResponseAddProductToCartBody = ResponseGetCart;

export type ResponseDeleteProductCart = ResponseGetCart;
