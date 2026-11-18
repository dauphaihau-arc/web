import { meProductReviewApi } from '~/domains/me/api/product-review/me-product-review.api';
import type { UpsertMyProductReviewRequest } from '~/domains/me/api/product-review/contracts/product-review.contract';
import { toastCustom } from '~/shared/config/toast';
import { useErrorCopy } from '~/shared/composables/use-error-copy';
import { reportApiError } from '~/shared/utils/api-error-copy';

export function useUpsertMyProductReview() {
  const toast = useToast();
  const t = useErrorCopy();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['upsert-my-product-review'],
    mutationFn: async (input: { orderItemId: string, body: UpsertMyProductReviewRequest }) => {
      return await meProductReviewApi.upsert(input.orderItemId, input.body);
    },
    onSuccess() {
      toast.add({
        ...toastCustom.success,
        title: t('errors.review.submitted'),
      });
      queryClient.invalidateQueries({ queryKey: ['get-order-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['get-order-shops'] });
    },
    onError(error) {
      reportApiError(error, 'upsert-product-review');

      toast.add({
        ...toastCustom.error,
        title: t('errors.review.submitFailed'),
      });
    },
  });
}
