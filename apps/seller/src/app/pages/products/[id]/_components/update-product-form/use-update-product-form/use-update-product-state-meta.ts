import { ProductStates } from '@arc/enums/product';
import type { Ref } from 'vue';
import type { ProductImageReference } from '~/domains/shop/api/product/contracts/form.contract';
import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';

type UseUpdateProductStateMetaInput = {
  dataDetailProduct: Ref<DetailShopProductResponse | undefined>
  fileImages: Ref<File[]>
  idsImageForDelete: Ref<Required<Pick<ProductImageReference, 'id'>>[]>
};

export function useUpdateProductStateMeta({
  dataDetailProduct,
  fileImages,
  idsImageForDelete,
}: UseUpdateProductStateMetaInput) {
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

  return {
    canDeactivateFromDetail,
    canPublishFromDetail,
    formatStateLabel,
    productState,
    publishImageError,
    stateTone,
  };
}
