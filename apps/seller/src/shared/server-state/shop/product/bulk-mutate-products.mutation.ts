import { resolveMyShopId } from '../resolve-my-shop-id';
import { toastCustom } from '~/shared/config/toast';
import { shopProductApi } from '~/shared/api/shop/product/product.api';
import type {
  BulkMutateShopProductsAction,
  BulkMutateShopProductsRequest
} from '~/shared/api/shop/product/contracts/read.contract';

function getSuccessTitle(action: BulkMutateShopProductsAction) {
  switch (action) {
    case 'publish':
      return 'Products published';
    case 'deactivate':
      return 'Products deactivated';
    case 'remove':
      return 'Products removed';
  }
}

function getErrorTitle(action: BulkMutateShopProductsAction) {
  switch (action) {
    case 'publish':
      return 'Failed to publish products';
    case 'deactivate':
      return 'Failed to deactivate products';
    case 'remove':
      return 'Failed to remove products';
  }
}

export function useShopBulkMutateProducts() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['shop-bulk-mutate-products'],
    mutationFn: async (payload: BulkMutateShopProductsRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopProductApi.bulkMutate(shopId, payload);
    },
    onSuccess(result, variables) {
      queryClient.invalidateQueries({ queryKey: ['shop-get-products'] });

      if (result.failed.length === 0) {
        toast.add({
          ...toastCustom.success,
          title: getSuccessTitle(variables.action),
          description: `${result.succeeded_ids.length} product(s) updated.`,
        });
        return;
      }

      toast.add({
        ...(result.succeeded_ids.length > 0 ? toastCustom.warning : toastCustom.error),
        title: result.succeeded_ids.length > 0 ?
          'Products updated with some failures' :
          getErrorTitle(variables.action),
        description: `${result.succeeded_ids.length} succeeded, ${result.failed.length} failed.`,
      });
    },
    onError(_error, variables) {
      toast.add({
        ...toastCustom.error,
        title: getErrorTitle(variables.action),
      });
    },
  });
}
