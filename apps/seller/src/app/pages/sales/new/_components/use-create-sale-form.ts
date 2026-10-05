import { computed, reactive, watch } from 'vue';
import { PromotionProductScope } from '@arc/enums/promotion';
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types';
import { toastCustom } from '~/shared/config/toast';
import { routes } from '~/shared/navigation/routes';
import { useShopCreateSale } from '~/domains/shop/mutations/create-sale.mutation';
import {
  createSaleFormSchema,
  isAmbiguousLocalTime,
  toSaleScheduleInstant,
  type CreateSaleFormState,
} from '~/domains/shop/schemas/sale/create-sale-form.schema';
import { parseLocalDateTime } from '~/domains/shop/utils/zoned-local-date-time';
import type { CreateShopSaleRequestBody } from '~/domains/shop/api/sale/contracts/sale.contract';
import { usePromotionScheduleTimezone } from '~/domains/shop/ui/promotion/use-promotion-schedule-timezone';
import { addDurationToLocal, nowLocal } from '~/domains/shop/utils/promotion-schedule-range';

export const CREATE_SALE_FORM_ID = 'create-sale-form';

/**
 * Owns the Run-a-sale form: its state, its validation, and the submit that
 * turns a completed form into a Sale.
 *
 * The scheduling timezone is delegated to `usePromotionScheduleTimezone` and
 * then mirrored into the form state, so the zod schema stays the single
 * validator and the timezone field reports its error like every other field.
 */
export function useCreateSaleForm() {
  const router = useRouter();
  const toast = useToast();

  const { mutateAsync: createSale, isPending: isPendingCreateSale } = useShopCreateSale();

  const {
    storeTimezone,
    timezone,
    isPickerOpen,
    isStoreTimezone,
    openPicker,
  } = usePromotionScheduleTimezone();

  const state = reactive<CreateSaleFormState>({
    name: '',
    percent_off: 10,
    product_scope: PromotionProductScope.ALL,
    product_ids: [],
    timezone: '',
    start_mode: 'now',
    start_local: '',
    end_local: '',
    start_occurrence: undefined,
    end_occurrence: undefined,
  });

  const timezoneOptions = Intl.supportedValuesOf('timeZone');

  watch(timezone, (value) => {
    state.timezone = value;

    // Seed the schedule the moment the store timezone is known, so the End
    // field is never empty and presets have a wall clock to count from.
    if (value && !state.end_local) {
      state.start_local = nowLocal(value);
      state.end_local = addDurationToLocal(state.start_local, value, 24, 'hour');
    }
  }, { immediate: true });

  function isAmbiguous(value: string, zone: string): boolean {
    const parts = parseLocalDateTime(value);

    return parts ? isAmbiguousLocalTime(parts, zone) : false;
  }

  const startIsAmbiguous = computed(() =>
    state.start_mode === 'scheduled' && isAmbiguous(state.start_local, state.timezone));

  const endIsAmbiguous = computed(() => isAmbiguous(state.end_local, state.timezone));

  const submitLabel = computed(() =>
    state.start_mode === 'now' ? 'Start sale' : 'Schedule sale');

  function validate(values: CreateSaleFormState): FormError[] {
    const result = createSaleFormSchema.safeParse(values);

    if (result.success) {
      return [];
    }

    return result.error.issues.map(issue => ({
      path: typeof issue.path.at(-1) === 'string' ? String(issue.path.at(-1)) : '',
      message: issue.message,
    }));
  }

  function buildPayload(values: CreateSaleFormState): CreateShopSaleRequestBody {
    const start = values.start_mode === 'now'
      ? undefined
      : toSaleScheduleInstant(values.start_local, values.timezone, values.start_occurrence);

    const end = toSaleScheduleInstant(values.end_local, values.timezone, values.end_occurrence);

    return {
      name: values.name.trim(),
      percent_off: values.percent_off,
      product_scope: values.product_scope,
      timezone: values.timezone,
      end_local: end.local,
      end_offset_minutes: end.offsetMinutes,
      ...(values.product_scope === PromotionProductScope.SPECIFIC
        ? { product_ids: values.product_ids }
        : {}),
      ...(start
        ? { start_local: start.local, start_offset_minutes: start.offsetMinutes }
        : { start_now: true }),
    };
  }

  async function onSubmit(event: FormSubmitEvent<CreateSaleFormState>) {
    try {
      await createSale(buildPayload(event.data));
      await router.push(routes.sales());
      toast.add({
        ...toastCustom.success,
        title: state.start_mode === 'now' ? 'Sale started' : 'Sale scheduled',
      });
    }
    catch (error) {
      toast.add({
        ...toastCustom.error,
        title: 'Could not create the sale',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  function onError(event: FormErrorEvent) {
    const element = document.getElementById(event.errors[0]?.id ?? '');
    element?.focus();
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function cancel() {
    router.push(routes.sales());
  }

  return {
    state,
    validate,
    onSubmit,
    onError,
    cancel,
    submitLabel,
    isPendingCreateSale,
    startIsAmbiguous,
    endIsAmbiguous,
    changeTimezone: openPicker,
    timezone,
    timezoneOptions,
    storeTimezone,
    isPickerOpen,
    isStoreTimezone,
  };
}
