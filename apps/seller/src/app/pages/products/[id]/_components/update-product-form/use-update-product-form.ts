// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  ProductStates,
  ProductVariantTypes,
} from '@arc/enums/product';
import {
  applyDetailProductToFormState,
  hasUpdateProductFormChanges,
  isUpdateProductSubmitDisabled,
  pruneUnchangedUpdateFields,
} from './update-product-form.mapper';
import {
  useUpdateProductSubmit,
  type UpdateProductAction,
} from './use-update-product-submit';
import { productInventorySchema } from '@arc/schemas/product-inventory.schema';
import { updateProductFormSchema } from '~/domains/shop/schemas/product/update-product-form.schema';
import { useShopGetDetailProduct } from '~/domains/shop/queries/product/detail.query';
import { log } from '@arc/lib';
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types';
import type {
  NoneVariant,
  ProductImageReference,
  UpdateProductBody,
} from '~/domains/shop/api/product/contracts/form.contract';
import type {
  IOnChangeUpdateVariants,
  VariantEditorSubmission,
} from './update-product-form.types';

export function useUpdateProductForm() {
  const route = useRoute();
  const queryClient = useQueryClient();

  const productId = route.params.id as string;

  const {
    data: dataDetailProduct,
  } = useShopGetDetailProduct(productId);

  const noneVariant = reactive<Partial<NoneVariant>>({
    variant_type: ProductVariantTypes.NONE,
  });

  const stateSubmit = reactive<UpdateProductBody>({});

  const isVariantProduct = computed(() => stateSubmit.variant_type !== ProductVariantTypes.NONE);
  const btnSubmit = ref();
  const disabledButtonSubmit = ref(true);
  const isVariantInputValid = ref(true);
  const countValidate = ref(0);
  const isVariantsDirty = ref(false);
  const variantSubmission = ref<VariantEditorSubmission>();
  const fileImages = ref<File[]>([]);
  const idsImageForDelete = ref<Required<Pick<ProductImageReference, 'id'>>[]>([]);
  const pendingAction = ref<UpdateProductAction>('save');

  const {
    loadingAction,
    loadingSubmit,
    submit,
  } = useUpdateProductSubmit({
    productId,
    queryClient,
    dataDetailProduct,
    fileImages,
    idsImageForDelete,
    noneVariant,
  });

  const productState = computed(() => dataDetailProduct.value?.product.state);

  const currentImageCount = computed(() => {
    const product = dataDetailProduct.value?.product;

    if (!product) {
      return fileImages.value.length;
    }

    const deletedImageIds = new Set(idsImageForDelete.value.map(image => image.id));

    return product.images.filter(image => !deletedImageIds.has(image.id)).length +
      fileImages.value.length;
  });

  const canPublishFromDetail = computed(() =>
    [ProductStates.DRAFT, ProductStates.INACTIVE].includes(productState.value as ProductStates),
  );

  const canDeactivateFromDetail = computed(() =>
    productState.value === ProductStates.ACTIVE,
  );

  const publishImageError = computed(() =>
    canPublishFromDetail.value && currentImageCount.value === 0
      ? 'Add at least 1 image before publishing.'
      : '',
  );

  function stateTone(state?: ProductStates) {
    switch (state) {
      case ProductStates.ACTIVE:
        return 'green';
      case ProductStates.INACTIVE:
        return 'yellow';
      case ProductStates.DRAFT:
        return 'gray';
      default:
        return 'gray';
    }
  }

  function formatStateLabel(state?: ProductStates) {
    if (!state) {
      return 'Unknown';
    }

    return state.charAt(0).toUpperCase() + state.slice(1);
  }

  const onChangeVariants = (values: IOnChangeUpdateVariants) => {
    isVariantInputValid.value = Boolean(values);
    variantSubmission.value = values?.variantSubmission;
    if (!values) return;

    stateSubmit.variant_type = values.variant_type;
    stateSubmit.variant_group_name = values.variant_group_name;

    if (values.variant_sub_group_name) {
      stateSubmit.variant_sub_group_name = values.variant_sub_group_name;
    }
    else {
      delete stateSubmit.variant_sub_group_name;
    }
  };

  const onChangeVariantType = () => {
    isVariantProduct.value = !isVariantProduct.value;
    stateSubmit.variant_type = isVariantProduct.value ? ProductVariantTypes.SINGLE : ProductVariantTypes.NONE;
    if (!isVariantProduct.value) {
      variantSubmission.value = undefined;
    }
  };

  const validateForm = (values: UpdateProductBody): FormError[] => {
    let errors: FormError[] = [];
    countValidate.value++;

    const result = updateProductFormSchema.safeParse(values);

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

  async function onSubmit(_event: FormSubmitEvent<UpdateProductBody>) {
    await nextTick();
    if (isVariantProduct.value && !isVariantInputValid.value) return;

    const dataSubmit = pruneUnchangedUpdateFields(
      { ...stateSubmit },
      dataDetailProduct.value?.product,
    );

    await submit(dataSubmit, pendingAction.value, variantSubmission.value);
    pendingAction.value = 'save';
  }

  function onError(event: FormErrorEvent) {
    const element = document.getElementById(event.errors[0].id);
    element?.focus();
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function submitWithAction(action: UpdateProductAction) {
    pendingAction.value = action;
    btnSubmit.value?.click();
  }

  watch(() => dataDetailProduct.value, () => {
    const detailProduct = dataDetailProduct.value?.product;
    if (detailProduct) {
      applyDetailProductToFormState(detailProduct, stateSubmit, noneVariant);
    }
  }, { immediate: true });

  watch(() => stateSubmit.category_id, () => {
    stateSubmit.attributes = [];
  });

  watchDebounced(
    () => [
      stateSubmit,
      noneVariant,
      fileImages.value,
      idsImageForDelete.value,
      isVariantsDirty.value,
      isVariantInputValid.value,
    ],
    () => {
      const result = updateProductFormSchema.safeParse(stateSubmit);

      const noneVariantResult = productInventorySchema
        .pick({ amount: true, stock: true, sku: true })
        .safeParse(noneVariant);

      const detailProduct = dataDetailProduct.value?.product;

      const changedFields = Object.keys(pruneUnchangedUpdateFields(
        { ...stateSubmit },
        detailProduct,
      ));

      const hasFormChanges = hasUpdateProductFormChanges({
        isVariantsDirty: isVariantsDirty.value,
        dataSubmit: { ...stateSubmit },
        detailProduct,
        fileImages: fileImages.value,
        idsImageForDelete: idsImageForDelete.value,
        noneVariant,
      });

      const checks = {
        ready: Boolean(detailProduct),
        changed: hasFormChanges,
        formValid: result.success,
        inventoryValid: isVariantProduct.value || noneVariantResult.success,
        variantValid: !isVariantProduct.value || isVariantInputValid.value,
      };

      disabledButtonSubmit.value = isUpdateProductSubmitDisabled({
        hasFormChanges,
        isFormValid: result.success,
        isNoneVariantValid: noneVariantResult.success,
        isReady: checks.ready,
        isVariantInputValid: isVariantInputValid.value,
        isVariantProduct: isVariantProduct.value,
      });

      log.info('[update-product-form] submit button checks', {
        changedFields,
        checks,
        disabled: disabledButtonSubmit.value,
        failedChecks: Object.entries(checks)
          .filter(([, passed]) => !passed)
          .map(([name]) => name),
        formIssues: result.success ? [] : result.error.issues,
        inventoryIssues: isVariantProduct.value || noneVariantResult.success
          ? []
          : noneVariantResult.error.issues,
        isVariantsDirty: isVariantsDirty.value,
      });
    },
    { debounce: 500, maxWait: 1000, deep: true },
  );

  return {
    btnSubmit,
    canDeactivateFromDetail,
    canPublishFromDetail,
    countValidate,
    isVariantsDirty,
    dataDetailProduct,
    disabledButtonSubmit,
    fileImages,
    formatStateLabel,
    idsImageForDelete,
    isVariantProduct,
    loadingAction,
    loadingSubmit,
    noneVariant,
    onChangeVariants,
    onChangeVariantType,
    onError,
    onSubmit,
    productState,
    publishImageError,
    stateSubmit,
    stateTone,
    submitWithAction,
    validateForm,
  };
}
