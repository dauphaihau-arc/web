import { ProductVariantTypes } from '@arc/enums/product';
import { applyDetailProductToFormState } from './update-product-form.mapper';
import { useUpdateProductStateMeta } from './use-update-product-state-meta';
import { useUpdateProductSubmitState } from './use-update-product-submit-state';
import { useUpdateProductSubmit } from './use-update-product-submit';
import { useUpdateProductVariantState } from './use-update-product-variant-state';
import { updateProductFormSchema } from '~/domains/shop/schemas/product/update-product-form.schema';
import { useShopGetDetailProduct } from '~/domains/shop/queries/product/detail.query';
import type { FormError, FormErrorEvent } from '#ui/types';
import type {
  NoneVariant,
  ProductImageReference,
  UpdateProductBody,
} from '~/domains/shop/api/product/contracts/form.contract';

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
  const btnSubmit = ref<HTMLElement>();
  const countValidate = ref(0);
  const fileImages = ref<File[]>([]);
  const idsImageForDelete = ref<Required<Pick<ProductImageReference, 'id'>>[]>([]);

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

  const {
    canDeactivateFromDetail,
    canPublishFromDetail,
    formatStateLabel,
    productState,
    publishImageError,
    stateTone,
  } = useUpdateProductStateMeta({
    dataDetailProduct,
    fileImages,
    idsImageForDelete,
  });

  const {
    isVariantInputValid,
    isVariantProduct,
    isVariantsDirty,
    onChangeVariants,
    onChangeVariantType,
    variantSubmission,
  } = useUpdateProductVariantState({
    stateSubmit,
  });

  const {
    disabledButtonSubmit,
    onSubmit,
    submitWithAction,
  } = useUpdateProductSubmitState({
    btnSubmit,
    dataDetailProduct,
    fileImages,
    idsImageForDelete,
    isVariantInputValid,
    isVariantProduct,
    isVariantsDirty,
    noneVariant,
    stateSubmit,
    submit,
    variantSubmission,
  });

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

  function onError(event: FormErrorEvent) {
    const element = document.getElementById(event.errors[0].id);
    element?.focus();
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
