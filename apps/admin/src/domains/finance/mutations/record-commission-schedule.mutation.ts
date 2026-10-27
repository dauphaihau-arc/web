import { useMutation } from '@tanstack/vue-query';
import type { RecordCommissionScheduleBody } from '../api/contracts/admin-finance.contract';
import { adminFinanceApi } from '../api/admin-finance.api';
import { adminShopCommissionScheduleKey } from '../queries/query-keys';
import { toastCustom } from '~/shared/config/toast';
import { readApiError } from '~/shared/lib/api-error';

/**
 * Records a Commission Schedule. The response is the entry that was recorded,
 * which may start in the future, so the cache is invalidated rather than
 * written: the read stores the schedule in force, and only a refetch can say
 * whether the new entry is already effective.
 */
export function useRecordCommissionSchedule(shopId: MaybeRefOrGetter<string | undefined>) {
  const resolvedId = computed(() => toValue(shopId));
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['admin-finance-record-commission-schedule'],
    mutationFn: (body: RecordCommissionScheduleBody) =>
      adminFinanceApi.recordCommissionSchedule(resolvedId.value!, body),
    async onSuccess(result) {
      toast.add({
        ...toastCustom.success,
        title: 'Commission schedule updated',
      });
      // The response is the entry just recorded, which may start in the future;
      // only the read can say which schedule is in force. A failed refresh must
      // not turn a successful save into an error, so it is swallowed.
      await queryClient.invalidateQueries({
        queryKey: adminShopCommissionScheduleKey(result.shop_id),
      }).catch(() => undefined);
    },
    onError(error) {
      toast.add({
        ...toastCustom.error,
        title: 'Failed to update commission schedule',
        description: readApiError(error).message,
      });
    },
  });
}
