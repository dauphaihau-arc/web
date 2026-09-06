import { log } from '@arc/lib';
import { productInventorySchema } from '@arc/schemas/product-inventory.schema';
import type { ComputedRef, Ref } from 'vue';
import type { FormSubmitEvent } from '#ui/types';
import type {
  NoneVariant,
  ProductImageReference,
  UpdateProductBody,
} from '~/domains/shop/api/product/contracts/form.contract';
import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';
import { updateProductFormSchema } from '~/domains/shop/schemas/product/update-product-form.schema';
import {
  hasUpdateProductFormChanges,
  isUpdateProductSubmitDisabled,
  pruneUnchangedUpdateFields,
} from './update-product-form.mapper';
import type { VariantEditorSubmission } from './update-product-form.types';
import type { UpdateProductAction } from './use-update-product-submit';

type SubmitUpdateProduct = (
  dataSubmit: UpdateProductBody,
  action: UpdateProductAction,
  variantSubmission?: VariantEditorSubmission,
) => Promise<void>;

type UseUpdateProductSubmitStateInput = {
  btnSubmit: Ref<HTMLElement | undefined>
  dataDetailProduct: Ref<DetailShopProductResponse | undefined>
  fileImages: Ref<File[]>
  idsImageForDelete: Ref<Required<Pick<ProductImageReference, 'id'>>[]>
  isVariantInputValid: Ref<boolean>
  isVariantProduct: ComputedRef<boolean>
  isVariantsDirty: Ref<boolean>
  noneVariant: Partial<NoneVariant>
  stateSubmit: UpdateProductBody
  submit: SubmitUpdateProduct
  variantSubmission: Ref<VariantEditorSubmission | undefined>
};

export function useUpdateProductSubmitState({
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
}: UseUpdateProductSubmitStateInput) {
  const disabledButtonSubmit = ref(true);
  const pendingAction = ref<UpdateProductAction>('save');

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

  function submitWithAction(action: UpdateProductAction) {
    pendingAction.value = action;
    btnSubmit.value?.click();
  }

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
    disabledButtonSubmit,
    onSubmit,
    submitWithAction,
  };
}
