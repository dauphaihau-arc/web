import { ProductVariantTypes } from '@arc/enums/product';
import type { UpdateProductBody } from '~/domains/shop/api/product/contracts/form.contract';
import type {
  IOnChangeUpdateVariants,
  VariantEditorSubmission,
} from './update-product-form.types';

type UseUpdateProductVariantStateInput = {
  stateSubmit: UpdateProductBody
};

export function useUpdateProductVariantState({
  stateSubmit,
}: UseUpdateProductVariantStateInput) {
  const isVariantProduct = computed(() => stateSubmit.variant_type !== ProductVariantTypes.NONE);
  const isVariantInputValid = ref(true);
  const isVariantsDirty = ref(false);
  const variantSubmission = ref<VariantEditorSubmission>();
  const cachedVariantSubmission = ref<VariantEditorSubmission>();
  const cachedVariantsDirty = ref(false);

  const onChangeVariants = (values: IOnChangeUpdateVariants) => {
    if (!isVariantProduct.value) return;
    isVariantInputValid.value = Boolean(values);
    variantSubmission.value = values?.variantSubmission;
    cachedVariantSubmission.value = values?.variantSubmission;
    if (values) {
      cachedVariantsDirty.value = isVariantsDirty.value;
    }
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
    const nextIsVariantProduct = !isVariantProduct.value;

    stateSubmit.variant_type = nextIsVariantProduct
      ? ProductVariantTypes.SINGLE
      : ProductVariantTypes.NONE;

    if (nextIsVariantProduct) {
      variantSubmission.value = cachedVariantSubmission.value;
      isVariantsDirty.value = cachedVariantsDirty.value;
      stateSubmit.variant_type = cachedVariantSubmission.value?.variantType ?? ProductVariantTypes.SINGLE;
      if (cachedVariantSubmission.value?.variantGroupName) {
        stateSubmit.variant_group_name = cachedVariantSubmission.value.variantGroupName;
      }
      if (cachedVariantSubmission.value?.variantSubGroupName) {
        stateSubmit.variant_sub_group_name = cachedVariantSubmission.value.variantSubGroupName;
      }
      else {
        delete stateSubmit.variant_sub_group_name;
      }
      return;
    }

    cachedVariantsDirty.value = isVariantsDirty.value;
    variantSubmission.value = undefined;
    isVariantsDirty.value = true;
    delete stateSubmit.variant_group_name;
    delete stateSubmit.variant_sub_group_name;
  };

  return {
    isVariantInputValid,
    isVariantProduct,
    isVariantsDirty,
    onChangeVariants,
    onChangeVariantType,
    variantSubmission,
  };
}
