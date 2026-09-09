import type { QueryClient } from '@tanstack/vue-query';
import type { Ref } from 'vue';
import { toastCustom } from '~/shared/config/toast';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import { resolveMyShopId } from '~/domains/shop/utils/resolve-my-shop-id';
import { useShopPublishProduct } from '~/domains/shop/mutations/publish-product.mutation';
import { useIssueProductImageUploadUrl } from '~/domains/shop/mutations/issue-product-image-upload-url.mutation';
import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';
import type {
  NoneVariant,
  ProductImageReference,
  UpdateProductBody,
} from '~/domains/shop/api/product/contracts/form.contract';
import type { VariantEditorSubmission } from '../update-product-form.types';
import {
  adoptConflictCurrentProduct,
  createUpdateProductSectionStates,
  sectionStateLabel,
} from './product-section-state';
import type { ProductFormSectionId, ProductFormSectionStates } from './product-section-state';
import { getDirtyProductSectionIds } from './product-section-dirty';
import { ProductSectionSaveError } from './product-save-errors';
import { nextProductMutationIdempotencyKey, saveUpdateProductSections } from './product-section-save.service';
import {
  getNextProductImageCount,
  uploadProductImages,
} from './product-images-submit';
import { isVariantStructureExpansion } from './variant-submission-persistence';
import { rebaseVariantSubmissionOnCurrentProduct } from './variant-submission-rows';

export type UpdateProductAction = 'save' | 'publish' | 'deactivate';

type UseUpdateProductSubmitInput = {
  productId: string
  queryClient: QueryClient
  dataDetailProduct: Ref<DetailShopProductResponse | undefined>
  fileImages: Ref<File[]>
  idsImageForDelete: Ref<Required<Pick<ProductImageReference, 'id'>>[]>
  noneVariant: Partial<NoneVariant>
};

export function useUpdateProductSubmit({
  productId,
  queryClient,
  dataDetailProduct,
  fileImages,
  idsImageForDelete,
  noneVariant,
}: UseUpdateProductSubmitInput) {
  const toast = useToast();
  const config = useRuntimeConfig();
  const loadingSubmit = shallowRef(false);
  const loadingAction = shallowRef<UpdateProductAction | null>(null);
  const sectionStates: ProductFormSectionStates = reactive(createUpdateProductSectionStates());

  const {
    mutateAsync: issueProductImageUploadUrl,
  } = useIssueProductImageUploadUrl();

  const {
    mutateAsync: publishProduct,
  } = useShopPublishProduct();

  async function submit(
    dataSubmit: UpdateProductBody,
    action: UpdateProductAction = 'save',
    variantSubmission?: VariantEditorSubmission,
    isVariantsDirty = Boolean(variantSubmission),
    forcedSectionsToSave?: ProductFormSectionId[],
  ) {
    if (action === 'publish' && getNextProductImageCount({
      dataDetailProduct: dataDetailProduct.value,
      fileImages: fileImages.value,
      idsImageForDelete: idsImageForDelete.value,
    }) === 0) {
      toast.add({
        ...toastCustom.error,
        title: 'Add at least 1 image before publishing',
      });
      return;
    }

    loadingSubmit.value = true;
    loadingAction.value = action;

    try {
      const currentDetail = dataDetailProduct.value;

      if (!currentDetail) {
        throw new Error('Product detail is not loaded');
      }

      const sectionsToSave = forcedSectionsToSave ?? getDirtyProductSectionIds({
        dataSubmit,
        detailProduct: currentDetail.product,
        fileImages: fileImages.value,
        idsImageForDelete: idsImageForDelete.value,
        isVariantsDirty,
        noneVariant,
      });

      const uploadedKeys = sectionsToSave.includes('product-basic-info')
        ? await uploadProductImages({
          files: fileImages.value,
          issueProductImageUploadUrl,
          onMissingUploadTarget: () => {
            toast.add({
              ...toastCustom.error,
              title: 'Oops',
              description: 'Something wrong',
            });
          },
          productId,
        })
        : [];

      const shopId = await resolveMyShopId(queryClient);

      const savedDetail = await saveUpdateProductSections({
        assetHost: config.public.assetHost ?? '',
        dataDetailProduct: currentDetail,
        dataSubmit,
        idsImageForDelete: idsImageForDelete.value,
        noneVariant,
        sectionStates,
        sectionsToSave,
        shopId,
        uploadedKeys,
        onSectionSaved: (detail) => {
          dataDetailProduct.value = detail;
        },
        variantSubmission,
      });

      dataDetailProduct.value = savedDetail;
      fileImages.value = [];
      idsImageForDelete.value = [];

      if (action === 'publish') {
        await publishProduct(productId);
      }

      if (action === 'deactivate') {
        const resolvedShopId = await resolveMyShopId(queryClient);

        await shopProductApi.bulkMutate(resolvedShopId, {
          ids: [productId],
          action: 'deactivate',
          idempotency_key: nextProductMutationIdempotencyKey(),
        });
      }

      await queryClient.invalidateQueries({
        queryKey: ['shop-get-detail-product', productId],
      });

      await queryClient.invalidateQueries({
        queryKey: ['shop-get-products'],
      });

      toast.add({
        ...toastCustom.success,
        title: action === 'publish'
          ? 'Product published'
          : action === 'deactivate'
            ? 'Product deactivated'
            : 'Product sections saved',
      });
    }
    catch (error) {
      toast.add({
        ...toastCustom.error,
        title: error instanceof ProductSectionSaveError
          ? `Update failed in ${sectionStateLabel(sectionStates[error.sectionId]).toLowerCase()}`
          : 'Update product failed',
      });
    }
    finally {
      loadingSubmit.value = false;
      loadingAction.value = null;
    }
  }

  async function reapplyConflictSection(
    sectionId: ProductFormSectionId,
    dataSubmit: UpdateProductBody,
    variantSubmission?: VariantEditorSubmission,
  ) {
    adoptConflictCurrentProduct(dataDetailProduct, sectionStates, sectionId);

    const shouldRebaseAnchors = Boolean(
      sectionId === 'product-inventory'
      && variantSubmission
      && dataDetailProduct.value?.product
      && isVariantStructureExpansion(dataDetailProduct.value.product, variantSubmission),
    );

    const rebasedVariantSubmission = shouldRebaseAnchors
      ? rebaseVariantSubmissionOnCurrentProduct(variantSubmission, dataDetailProduct.value?.product)
      : variantSubmission;

    sectionStates[sectionId].status = 'dirty';
    sectionStates[sectionId].productVersion = dataDetailProduct.value?.product.productVersion;
    sectionStates[sectionId].error = undefined;
    sectionStates[sectionId].errorMessage = undefined;
    sectionStates[sectionId].errorTitle = undefined;
    sectionStates[sectionId].skuConflicts = undefined;
    sectionStates[sectionId].conflict = undefined;

    await submit(dataSubmit, 'save', rebasedVariantSubmission, true, [sectionId]);
  }

  return {
    loadingAction,
    loadingSubmit,
    reapplyConflictSection,
    sectionStateLabel,
    sectionStates,
    submit,
  };
}
