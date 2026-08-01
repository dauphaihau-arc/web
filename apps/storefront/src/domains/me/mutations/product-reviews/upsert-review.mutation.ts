import { meProductReviewApi } from '~/domains/me/api/product-review/me-product-review.api';
import type { UpsertMyProductReviewRequest } from '~/domains/me/api/product-review/contracts/product-review.contract';
import { toastCustom } from '~/shared/config/toast';

export function useUpsertMyProductReview() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['upsert-my-product-review'],
    mutationFn: async (input: { orderItemId: string, body: UpsertMyProductReviewRequest }) => {
      return await meProductReviewApi.upsert(input.orderItemId, input.body);
    },
    onSuccess() {
      toast.add({
        ...toastCustom.success,
        title: 'Review submitted',
      });
      queryClient.invalidateQueries({ queryKey: ['get-order-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['get-order-shops'] });
    },
    onError(error) {
      toast.add({
        ...toastCustom.error,
        title: error instanceof Error ? error.message : 'Unable to submit review',
      });
    },
  });
}
