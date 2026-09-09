import type { Ref } from 'vue';
import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';


export type ProductSkuConflict = {
  sku?: string
  inventoryId?: string
  variantId?: string
  clientRef?: string
};
export type ProductFormSectionId = 'product-basic-info' | 'product-inventory' | 'product-details';
export type ProductFormSectionStatus = 'idle' | 'dirty' | 'pending' | 'success' | 'error' | 'conflict';

export type ProductFormSectionState = {
  status: ProductFormSectionStatus
  error?: unknown
  errorMessage?: string
  errorTitle?: string
  skuConflicts?: ProductSkuConflict[]
  productVersion?: number
  conflict?: {
    currentProduct?: DetailShopProductResponse['product']
    message: string
    title?: string
    reapplyAvailable: boolean
  }
};

export type ProductFormSectionStates = Record<ProductFormSectionId, ProductFormSectionState>;

export const PRODUCT_FORM_SECTION_IDS: ProductFormSectionId[] = [
  'product-basic-info',
  'product-inventory',
  'product-details',
];

export function createUpdateProductSectionStates(): ProductFormSectionStates {
  return {
    'product-basic-info': { status: 'idle' },
    'product-inventory': { status: 'idle' },
    'product-details': { status: 'idle' },
  };
}

export function sectionStateLabel(state: ProductFormSectionState) {
  switch (state.status) {
    case 'dirty':
      return 'Unsaved changes';
    case 'pending':
      return 'Saving';
    case 'success':
      return 'Saved';
    case 'conflict':
      return 'Needs review';
    case 'error':
      return 'Save failed';
    default:
      return '';
  }
}

export function syncDirtyProductSectionStates(
  sectionStates: ProductFormSectionStates,
  dirtySectionIds: ProductFormSectionId[],
  currentProductVersion?: number,
): void {
  const dirtyIds = new Set(dirtySectionIds);

  PRODUCT_FORM_SECTION_IDS.forEach((sectionId) => {
    const state = sectionStates[sectionId];

    if (state.status === 'pending' || state.status === 'conflict' || state.status === 'error') {
      return;
    }

    if (dirtyIds.has(sectionId)) {
      state.productVersion ??= currentProductVersion;
      state.status = 'dirty';
    }
    else {
      state.status = 'idle';
      state.productVersion = undefined;
    }
    state.error = undefined;
    state.errorMessage = undefined;
    state.errorTitle = undefined;
    state.skuConflicts = undefined;
    state.conflict = undefined;
  });
}

export function adoptConflictCurrentProduct(
  dataDetailProduct: Ref<DetailShopProductResponse | undefined>,
  sectionStates: ProductFormSectionStates,
  sectionId: ProductFormSectionId,
) {
  const currentProduct = sectionStates[sectionId].conflict?.currentProduct;

  if (!currentProduct || !dataDetailProduct.value) {
    return;
  }

  dataDetailProduct.value = {
    ...dataDetailProduct.value,
    product: currentProduct,
  };
}
