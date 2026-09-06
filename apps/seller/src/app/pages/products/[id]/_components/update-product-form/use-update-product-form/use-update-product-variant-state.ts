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
    const nextIsVariantProduct = !isVariantProduct.value;

    stateSubmit.variant_type = nextIsVariantProduct
      ? ProductVariantTypes.SINGLE
      : ProductVariantTypes.NONE;

    if (!nextIsVariantProduct) {
      variantSubmission.value = undefined;
    }
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
