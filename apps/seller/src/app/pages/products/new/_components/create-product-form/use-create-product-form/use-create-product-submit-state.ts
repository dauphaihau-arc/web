import { log } from '@arc/lib';
import {
  ProductStates,
  ProductVariantTypes,
} from '@arc/enums/product';
import type { Ref } from 'vue';
import {
  createProductFormSchema,
  createProductInventoryFormSchema,
} from '~/domains/shop/schemas/product/create-product-form.schema';
import type { FormError, FormSubmitEvent } from '#ui/types';
import type {
  CreateProductBody,
  CreateProductShipping,
  StateNoneVariant,
  StateSubmit,
} from '~/domains/shop/api/product/contracts/form.contract';

type SubmitCreateProduct = (eventData: CreateProductBody) => Promise<void>;

type UseCreateProductSubmitStateInput = {
  fileImages: Ref<File[]>
  hasImages: Ref<boolean> | { value: boolean }
  loadingSubmit: Ref<boolean> | { value: boolean }
  noneVariant: StateNoneVariant
  shipping: Ref<CreateProductShipping | undefined>
  stateSubmit: StateSubmit
  submit: SubmitCreateProduct
};

export function useCreateProductSubmitState({
  fileImages,
  hasImages,
  loadingSubmit,
  noneVariant,
  shipping,
  stateSubmit,
  submit,
}: UseCreateProductSubmitStateInput) {
  const enabledButtonSubmit = shallowRef(false);
  const countValidate = shallowRef(0);

  const validateForm = (values: CreateProductBody): FormError[] => {
    let errors: FormError[] = [];
    countValidate.value++;

    const result = createProductFormSchema.safeParse(values);
    if (!result.success) {
      errors = result.error.issues.map((detail) => {
        const path = detail.path.at(-1);
        return {
          path: typeof path === 'string' ? path : '',
          message: detail.message,
        };
      });
    }
    return errors;
  };

  async function onSubmit(event: FormSubmitEvent<CreateProductBody>) {
    await submit(event.data);
  }

  watchDebounced(
    () => [stateSubmit, noneVariant, fileImages.value, shipping],
    () => {
      const baseParsed = createProductFormSchema.safeParse({ ...stateSubmit, state: ProductStates.DRAFT });
      const inventoryParsed = stateSubmit.variant_type === ProductVariantTypes.NONE
        ? createProductInventoryFormSchema.safeParse(noneVariant)
        : undefined;
      const checks = {
        formValid: baseParsed.success,
        shippingReady: Boolean(shipping.value),
        inventoryValid: inventoryParsed?.success ?? true,
        hasCategory: Boolean(stateSubmit.category_id),
        hasImages: hasImages.value,
      };

      enabledButtonSubmit.value = checks.formValid && checks.shippingReady && checks.inventoryValid;

      log.info('[create-product-form] submit button checks', {
        checks,
        disabled: {
          saveDraft: !enabledButtonSubmit.value || loadingSubmit.value,
          publish: !enabledButtonSubmit.value || !checks.hasCategory || !checks.hasImages || loadingSubmit.value,
        },
        failedChecks: Object.entries(checks)
          .filter(([, passed]) => !passed)
          .map(([name]) => name),
        formIssues: baseParsed.success ? [] : baseParsed.error.issues,
        inventoryIssues: !inventoryParsed || inventoryParsed.success
          ? []
          : inventoryParsed.error.issues,
        loadingSubmit: loadingSubmit.value,
      });
    },
    { debounce: 500, maxWait: 1000, deep: true },
  );

  return {
    countValidate,
    enabledButtonSubmit,
    onSubmit,
    validateForm,
  };
}
