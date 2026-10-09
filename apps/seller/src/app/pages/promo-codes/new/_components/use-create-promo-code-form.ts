import {
  computed, nextTick, reactive, ref, watch,
} from 'vue';
import {
  PromotionBenefitType,
  PromotionMinOrderType,
  PromotionProductScope,
} from '@arc/enums/promotion';
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types';
import { toastCustom } from '~/shared/config/toast';
import { readApiError, type ApiErrorField } from '~/shared/lib/api-error';
import { PROMO_CODE_ERROR_MESSAGES } from '~/domains/shop/api/promo-code/promo-code-error-messages';
import { routes } from '~/shared/navigation/routes';
import { useShopCreatePromoCode } from '~/domains/shop/mutations/create-promo-code.mutation';
import { useGetMyShop } from '~/domains/shop/queries/my-shop.query';
import {
  buildCreatePromoCodePayload,
  createPromoCodeFormSchema,
  type CreatePromoCodeFormState,
} from '~/domains/shop/schemas/promo-code/create-promo-code-form.schema';
import { isAmbiguousLocalTime } from '~/domains/shop/schemas/sale/create-sale-form.schema';
import { parseLocalDateTime } from '~/domains/shop/utils/zoned-local-date-time';
import { usePromotionScheduleTimezone } from '~/domains/shop/ui/promotion/use-promotion-schedule-timezone';
import { addDurationToLocal, nowLocal } from '~/domains/shop/utils/promotion-schedule-range';

export const CREATE_PROMO_CODE_FORM_ID = 'create-promo-code-form';

/** The slice of `UForm`'s exposed API this form drives from its submit handler. */
type PromoCodeFormRef = {
  clear: (path?: string) => void
  setErrors: (errors: FormError[]) => void
};

/**
 * Owns the Create-a-promo-code form: its state, validation, and submit that
 * turns a completed form into a Promo Code.
 *
 * The scheduling timezone is delegated to `usePromotionScheduleTimezone` and
 * then mirrored into the form state, so the zod schema stays the single
 * validator and the timezone field reports its error like every other field.
 *
 * The Code field lives in a child component, so its element is resolved through
 * the caller's `getCodeElement` when a server verdict has to be shown on it.
 */
export function useCreatePromoCodeForm(options: {
  /** Resolves the Code field's element, so a server verdict can be reported on it. */
  getCodeElement: () => HTMLElement | null
}) {
  const router = useRouter();
  const toast = useToast();

  // The server owns code uniqueness, so its verdict is reported on the Code
  // field itself rather than as a toast that names no field.
  const formRef = ref<PromoCodeFormRef | null>(null);

  const { mutateAsync: createPromoCode, isPending: isPendingCreatePromoCode } = useShopCreatePromoCode();
  const { data: myShop } = useGetMyShop();

  /** The Promotion Currency a fixed-amount benefit or minimum spend is authored in. */
  const shopCurrency = computed(() => myShop.value?.currency ?? 'USD');

  const {
    storeTimezone,
    timezone,
    isPickerOpen,
    isStoreTimezone,
    openPicker,
  } = usePromotionScheduleTimezone();

  const state = reactive<CreatePromoCodeFormState>({
    name: '',
    code: '',
    benefit_type: PromotionBenefitType.PERCENTAGE,
    percent_off: 10,
    amount_off: 5,
    min_order_type: PromotionMinOrderType.NONE,
    min_order_value: 50,
    min_purchase_quantity: 2,
    max_redemptions: '',
    max_redemptions_per_buyer: '',
    visibility: 'public',
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

  // The server's verdict on a code stops being true the moment the seller
  // changes the code, so the field error does not outlive the value it judged.
  watch(() => state.code, () => {
    formRef.value?.clear('code');
  });

  // Free shipping is always shop-wide, so a previously selected Product Scope
  // does not survive switching the benefit to free shipping.
  watch(() => state.benefit_type, (benefitType) => {
    if (benefitType === PromotionBenefitType.FREE_SHIPPING) {
      state.product_scope = PromotionProductScope.ALL;
      state.product_ids = [];
    }
  });

  const startIsAmbiguous = computed(() => {
    if (state.start_mode !== 'scheduled') {
      return false;
    }
    const parts = parseLocalDateTime(state.start_local);
    return parts ? isAmbiguousLocalTime(parts, state.timezone) : false;
  });

  const endIsAmbiguous = computed(() => {
    const parts = parseLocalDateTime(state.end_local);
    return parts ? isAmbiguousLocalTime(parts, state.timezone) : false;
  });

  function validate(values: CreatePromoCodeFormState): FormError[] {
    const result = createPromoCodeFormSchema.safeParse(values);

    if (result.success) {
      return [];
    }

    return result.error.issues.map(issue => ({
      path: typeof issue.path.at(-1) === 'string' ? String(issue.path.at(-1)) : '',
      message: issue.message,
    }));
  }

  async function onSubmit(event: FormSubmitEvent<CreatePromoCodeFormState>) {
    try {
      await createPromoCode(buildCreatePromoCodePayload(event.data));
      await router.push(routes.promoCodes());
      toast.add({
        ...toastCustom.success,
        title: 'Promo code created',
      });
    }
    catch (error) {
      const { code, message, fields } = readApiError(error);
      const fieldMessage = code && PROMO_CODE_ERROR_MESSAGES[code];

      // A code collision belongs under the Code field: it is the only thing
      // that has to change, and the form scrolls it into view.
      if (code === 'PROMO_CODE_ALREADY_EXISTS') {
        await showCodeError(fieldMessage ?? message);
        return;
      }

      // The server names each rejected request path, which matches the form
      // input names, so its field errors are reported on the fields themselves.
      if (code === 'VALIDATION_FAILED' && fields?.length) {
        await showFieldErrors(fields);
        return;
      }

      toast.add({
        ...toastCustom.error,
        title: 'Could not create the promo code',
        description: fieldMessage || message,
      });
    }
  }

  /**
   * Reports the server's per-field validation errors on the matching inputs and
   * brings the first one into view.
   */
  async function showFieldErrors(fields: ApiErrorField[]) {
    const first = fields[0];

    if (!first) {
      return;
    }

    formRef.value?.clear();
    formRef.value?.setErrors(fields.map(field => ({ path: field.field, message: field.message })));
    await nextTick();

    const element = document.querySelector<HTMLElement>(`[name="${first.field}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element?.focus();
  }

  /**
   * Reports a server verdict on the Code field and brings it into view. The
   * error is cleared as soon as the seller edits the code, because that edit is
   * the one thing the server was rejecting.
   */
  async function showCodeError(message: string | undefined) {
    if (!message) {
      return;
    }

    formRef.value?.clear('code');
    formRef.value?.setErrors([{ path: 'code', message }]);
    await nextTick();

    const element = options.getCodeElement();
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element?.querySelector('input')?.focus();
  }

  function onError(event: FormErrorEvent) {
    const element = document.getElementById(event.errors[0]?.id ?? '');
    element?.focus();
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function cancel() {
    router.push(routes.promoCodes());
  }

  return {
    formRef,
    state,
    validate,
    onSubmit,
    onError,
    cancel,
    isPendingCreatePromoCode,
    shopCurrency,
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
