import { ProductVariantTypes } from '@arc/enums/product';
import type {
  StateCombineVariant,
  StateNoneVariant,
  StateSingleVariant,
  StateSubmit,
} from '~/domains/shop/api/product/contracts/form.contract';

export function useCreateProductVariantState({
  stateSubmit,
}: {
  stateSubmit: StateSubmit
}) {
  const isProductHaveVariants = shallowRef(false);

  const noneVariant = reactive<StateNoneVariant>({
    stock: 1,
  });

  const singleVariant = reactive<StateSingleVariant>({});
  const combineVariant = reactive<StateCombineVariant>({});

  watch(isProductHaveVariants, () => {
    if (isProductHaveVariants.value) {
      noneVariant.amount = undefined;
      noneVariant.stock = 1;
    }

    stateSubmit.variant_type = isProductHaveVariants.value
      ? ProductVariantTypes.SINGLE
      : ProductVariantTypes.NONE;
  });

  return {
    combineVariant,
    isProductHaveVariants,
    noneVariant,
    singleVariant,
  };
}
