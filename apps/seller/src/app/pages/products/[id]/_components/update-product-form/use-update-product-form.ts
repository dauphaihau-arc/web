// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  ProductStates,
  ProductVariantTypes,
} from '@arc/enums/product';
import {
  applyDetailProductToFormState,
  hasRemovedAllImages,
  pruneUnchangedUpdateFields,
} from './update-product-form.mapper';
import {
  useUpdateProductSubmit,
  type UpdateProductAction,
} from './use-update-product-submit';
import { updateProductFormSchema } from '~/app/pages/products/_schemes/product/update-product-form.schema';
import { useShopGetDetailProduct } from '~/domains/shop/queries/product/detail.query';
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types';
import type {
  NoneVariant,
  ProductImageReference,
  UpdateProductBody,
} from '~/domains/shop/api/product/contracts/form.contract';
import type { IOnChangeUpdateVariants } from './update-product-form.types';

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
  const countValidateInputs = ref(0);
  const countValidateVariantsInputs = ref(0);
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
    if (!values) return;

    Object.keys(values).forEach((key) => {
      if (!values[key]) {
        return;
      }
      if (Array.isArray(values[key]) && values[key].length === 0) {
        return;
      }
      stateSubmit[key] = values[key];
    });
  };

  const onChangeVariantType = () => {
    isVariantProduct.value = !isVariantProduct.value;
    stateSubmit.variant_type = isVariantProduct.value ? ProductVariantTypes.SINGLE : ProductVariantTypes.NONE;
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

  async function onSubmit(event: FormSubmitEvent<UpdateProductBody>) {
    if (isVariantProduct.value && !isVariantInputValid.value) return;

    const dataSubmit = pruneUnchangedUpdateFields(
      { ...event.data },
      dataDetailProduct.value?.product,
    );

    await submit(dataSubmit, pendingAction.value);
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
    () => [stateSubmit, fileImages.value, idsImageForDelete.value, countValidateVariantsInputs.value],
    () => {
      countValidateInputs.value++;

      const result = updateProductFormSchema.safeParse(stateSubmit);

      const isEmptyImages = hasRemovedAllImages(
        idsImageForDelete.value,
        fileImages.value,
        dataDetailProduct.value?.product,
      );

      disabledButtonSubmit.value = countValidateInputs.value === 1
        || !result.success
        || isEmptyImages
        || countValidateVariantsInputs.value === 1;
    },
    { debounce: 500, maxWait: 1000, deep: true },
  );

  return {
    btnSubmit,
    canDeactivateFromDetail,
    canPublishFromDetail,
    countValidate,
    countValidateVariantsInputs,
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
