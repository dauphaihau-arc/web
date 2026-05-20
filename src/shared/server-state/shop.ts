import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type { ComputedRef } from 'vue';
import { RESOURCES } from '~/shared/config/enums/resources';
import { apiClient } from '~/shared/lib/api-client';
import type {
  ShopGetProductsQueryParams,
  ResponseShopGetProductsList,
  RequestCreateProductDraftBody,
  RequestUpdateProductBody,
  ResponseShopProductDraft
} from '~/shared/types/request-api/shop-product';
import type { Shop } from '~/shared/types/shop';
import type { ResponseBaseGetList } from '~/shared/types/common';
import type {
  Coupon, CreatePromoCodeBody, CreateSaleBody, GetCouponsParams
} from '~/shared/types/coupon';
import { toastCustom } from '~/shared/config/toast';
import type { UserAuthenticated } from '~/shared/types/auth';
import type { Product } from '~/shared/types/product';

export type MyShop = {
  id: string
  ownerUserId: string
  shop_name: string
  slug: string
  status: string
};

export function useGetMyShop() {
  return useQuery({
    enabled: true,
    queryKey: ['my-shop'],
    queryFn: () => {
      return apiClient.get<MyShop>(
        `${RESOURCES.SHOPS}/me`
      );
    },
  });
}

export function useCreateShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-shop'],
    mutationFn: (body: Pick<Shop, 'shop_name'>) => {
      return apiClient.post<MyShop>(
        RESOURCES.SHOPS,
        body
      );
    },
    onSuccess(data) {
      const dataUserAuth = queryClient.getQueryData<{ user: UserAuthenticated }>(['current-user']);

      queryClient.setQueryData(['my-shop'], data);

      if (dataUserAuth) {
        queryClient.setQueryData(['current-user'], {
          user: {
            ...dataUserAuth.user,
            shop: {
              id: data.id,
              shop_name: data.shop_name,
            },
          },
        });
      }
    },
  });
}

export function useShopGetDetailProduct(
  id: Product['id'],
  options?: NitroFetchOptions<NitroFetchRequest>
) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['shop-get-detail-product', id],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      // return apiClient.get<ResponseShopGetDetailProduct>(
      return apiClient.get(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${id}`,
        undefined,
        options
      );
    },
  });
}

export function useShopCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-create-product'],
    mutationFn: async (body: RequestCreateProductDraftBody) => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.post<ResponseShopProductDraft>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/drafts`,
        body
      );
    },
  });
}

export function useShopPublishProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-publish-product'],
    mutationFn: async (id: Product['id']) => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.post<ResponseShopProductDraft>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${id}/publish`
      );
    },
  });
}

export function useShopSetProductImagesByKeys() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-set-product-images-by-keys'],
    mutationFn: async (body: {
      id: Product['id']
      images: {
        storage_key: string
        rank: number
      }[]
    }) => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.put<ResponseShopProductDraft>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${body.id}/images-by-keys`,
        {
          images: body.images,
        }
      );
    },
  });
}

export function useShopUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-update-product'],
    mutationFn: async (body: RequestUpdateProductBody & { id: Product['id'] }) => {
      const shopId = await resolveMyShopId(queryClient);
      const { id, ...resBody } = body;
      return apiClient.patch<{ product: Product }>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${id}`,
        resBody
      );
    },
  });
}

export function useShopDeleteProduct() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationKey: ['shop-delete-product'],
    mutationFn: async (id: Product['id']) => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.delete(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}/${id}`
      );
    },
    onSuccess() {
      toast.add({
        ...toastCustom.success,
        title: 'Delete product success',
      });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Delete product failed',
      });
    },
  });
}

export function useShopGetProducts(
  queryParams: Ref<ShopGetProductsQueryParams> | ComputedRef<ShopGetProductsQueryParams>
) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['shop-get-products', queryParams],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.get<ResponseShopGetProductsList>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.PRODUCTS}`,
        queryParams.value
      );
    },
  });
}

export function useShopCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-create-coupon'],
    mutationFn: async (body: CreatePromoCodeBody | CreateSaleBody) => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.post<{ coupon: Coupon }>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.COUPONS}`,
        body
      );
    },
  });
}

export function useShopDeleteCoupon() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationKey: ['shop-delete-coupon'],
    mutationFn: async (id: Product['id']) => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.delete(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.COUPONS}/${id}`
      );
    },
    onSuccess() {
      toast.add({
        ...toastCustom.success,
        title: 'Delete coupon success',
      });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Delete coupon failed',
      });
    },
  });
}

export function useShopGetCoupons(queryParams: ComputedRef<GetCouponsParams>) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['shop-get-coupons', queryParams],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return apiClient.get<ResponseBaseGetList<Coupon>>(
        `${RESOURCES.SHOPS}/${shopId}${RESOURCES.COUPONS}`,
        queryParams.value
      );
    },
  });
}

async function resolveMyShopId(queryClient: ReturnType<typeof useQueryClient>) {
  const cachedShop = queryClient.getQueryData<MyShop>(['my-shop']);

  if (cachedShop?.id) {
    return cachedShop.id;
  }

  const shop = await apiClient.get<MyShop>(`${RESOURCES.SHOPS}/me`);
  queryClient.setQueryData(['my-shop'], shop);

  return shop.id;
}
