import {
  ProductStates,
  ProductVariantTypes,
  productWhoMadeOpts,
} from '@arc/enums/product';
import { useCreateProductAiDescription } from './use-create-product-ai-description';
import { useCreateProductSubmit } from './use-create-product-submit';
import { useCreateProductSubmitState } from './use-create-product-submit-state';
import { useCreateProductVariantState } from './use-create-product-variant-state';
import { PRODUCT_FORM_ERROR_PRIORITY } from '../create-product-form.constants';
import { useGetMyShop } from '~/domains/shop/queries/my-shop.query';
import type { FormErrorEvent } from '#ui/types';
import type {
  CreateProductShipping,
  StateSubmit,
} from '~/domains/shop/api/product/contracts/form.contract';

export function useCreateProductForm() {
  const { data: myShop } = useGetMyShop();

  const fileImages = ref<File[]>([]);
  const titleInputRef = ref();
  const btnSubmitRef = ref();
  const shipping = ref<CreateProductShipping | undefined>();

  const stateSubmit = reactive<StateSubmit>({
    who_made: productWhoMadeOpts[0].id,
    is_digital: false,
    state: ProductStates.ACTIVE,
    variant_type: ProductVariantTypes.NONE,
    attributes: [],
    tags: [],
  });

  const hasImages = computed(() => fileImages.value.length > 0);
  const shopCurrency = computed(() => myShop.value?.currency ?? 'USD');

  const {
    combineVariant,
    isProductHaveVariants,
    noneVariant,
    singleVariant,
  } = useCreateProductVariantState({
    stateSubmit,
  });

  const {
    loadingSubmit,
    submit,
  } = useCreateProductSubmit({
    fileImages,
    shipping,
    shopCurrency,
    noneVariant,
    singleVariant,
    combineVariant,
    stateSubmit,
  });

  const {
    canGenerateDescription,
    generatingDescription,
    isAiDescriptionEnabled,
    onGenerateDescription,
  } = useCreateProductAiDescription({
    stateSubmit,
    titleInputRef,
  });

  const {
    countValidate,
    enabledButtonSubmit,
    onSubmit,
    validateForm,
  } = useCreateProductSubmitState({
    fileImages,
    hasImages,
    loadingSubmit,
    noneVariant,
    shipping,
    stateSubmit,
    submit,
  });

  function onErrorFrom(event: FormErrorEvent) {
    event.errors.sort((currentError, nextError) =>
      PRODUCT_FORM_ERROR_PRIORITY.indexOf(nextError.path) - PRODUCT_FORM_ERROR_PRIORITY.indexOf(currentError.path),
    );

    const element = document.getElementById(event.errors[0].id);
    element?.focus();
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return {
    btnSubmitRef,
    canGenerateDescription,
    combineVariant,
    countValidate,
    enabledButtonSubmit,
    fileImages,
    generatingDescription,
    hasImages,
    isAiDescriptionEnabled,
    isProductHaveVariants,
    loadingSubmit,
    noneVariant,
    onErrorFrom,
    onGenerateDescription,
    onSubmit,
    shipping,
    shopCurrency,
    singleVariant,
    stateSubmit,
    titleInputRef,
    validateForm,
  };
}
