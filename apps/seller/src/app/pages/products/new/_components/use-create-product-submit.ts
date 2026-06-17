import { consola } from 'consola';
import { ProductStates } from '@arc/enums/product';
import type { PickPartial } from '@arc/contracts/utils';
import {
  buildCreateProductImagesPayload,
  buildCreateProductPayload,
  buildCreateProductSubmitBody,
  pruneEmptyCreateProductFields
} from './create-product-form.mapper';
import { routes } from '~/shared/navigation/routes';
import { toastCustom } from '~/shared/config/toast';
import { useShopCreateProduct } from '~/shared/server-state/shop/product/create-product.mutation';
import { useShopPublishProduct } from '~/shared/server-state/shop/product/publish-product.mutation';
import { useShopSetProductImagesByKeys } from '~/shared/server-state/shop/product/set-product-images-by-keys.mutation';
import { useIssueProductImageUploadUrl } from '~/shared/server-state/upload/issue-product-image-upload-url.mutation';
import type {
  CreateProductBody,
  CreateProductShipping,
  StateCombineVariant,
  StateNoneVariant,
  StateSingleVariant,
  StateSubmit
} from '~/shared/api/shop/product/contracts/form.contract';

type UseCreateProductSubmitInput = {
  fileImages: Ref<File[]>
  shipping: Ref<CreateProductShipping | undefined>
  shopCurrency: Ref<string> | { value: string } | string
  noneVariant: Ref<StateNoneVariant> | { value: StateNoneVariant } | StateNoneVariant
  singleVariant: Ref<StateSingleVariant> | { value: StateSingleVariant } | StateSingleVariant
  combineVariant: Ref<StateCombineVariant> | { value: StateCombineVariant } | StateCombineVariant
  stateSubmit: StateSubmit
};

function unwrap<T>(value: Ref<T> | { value: T } | T): T {
  return typeof value === 'object' && value !== null && 'value' in value ?
    value.value :
    value;
}

export function useCreateProductSubmit({
  fileImages,
  shipping,
  shopCurrency,
  noneVariant,
  singleVariant,
  combineVariant,
  stateSubmit,
}: UseCreateProductSubmitInput) {
  const router = useRouter();
  const toast = useToast();
  const loadingSubmit = ref(false);

  const {
    mutateAsync: createProduct,
  } = useShopCreateProduct();

  const {
    mutateAsync: publishProduct,
  } = useShopPublishProduct();

  const {
    mutateAsync: setProductImagesByKeys,
  } = useShopSetProductImagesByKeys();

  const {
    mutateAsync: issueProductImageUploadUrl,
  } = useIssueProductImageUploadUrl();

  async function uploadImage(productId: string) {
    if (fileImages.value.length === 0) {
      consola.error('images is invalid');
      return;
    }

    const promisesUploadImages = [];
    const storageKeys: string[] = [];

    for (let i = 0; i < fileImages.value.length; i++) {
      const { presigned_url: presignedUrl, key } = await issueProductImageUploadUrl({
        productId,
        content_type: fileImages.value[i].type,
        asset_type: 'original',
      });

      if (!presignedUrl || !key) {
        toast.add({
          ...toastCustom.error,
          title: 'Oops',
          description: 'Something wrong',
        });
        return;
      }

      storageKeys.push(key);

      const promise = useFetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fileImages.value[i].type,
        },
        body: fileImages.value[i],
      });

      promisesUploadImages.push(promise);
    }

    await Promise.all(promisesUploadImages);

    return storageKeys;
  }

  async function submit(eventData: CreateProductBody) {
    const dataSubmit = pruneEmptyCreateProductFields(
      eventData as PickPartial<CreateProductBody, 'attributes' | 'tags'>
    );

    if (
      stateSubmit.state === ProductStates.ACTIVE &&
      fileImages.value.length === 0
    ) {
      consola.error('images is invalid');
      return;
    }

    if (!shipping.value) {
      consola.error('shipping be undefined');
      return;
    }

    const bodyData = buildCreateProductSubmitBody(
      dataSubmit,
      shipping.value,
      unwrap(noneVariant),
      unwrap(singleVariant),
      unwrap(combineVariant)
    );

    if (!bodyData) {
      return;
    }

    loadingSubmit.value = true;

    try {
      const productDraft = await createProduct(
        buildCreateProductPayload(bodyData, unwrap(shopCurrency) || 'USD')
      );

      if (fileImages.value.length > 0) {
        const storageKeys = await uploadImage(productDraft.id);
        if (!storageKeys) return;

        await setProductImagesByKeys({
          id: productDraft.id,
          images: buildCreateProductImagesPayload(storageKeys),
        });
      }

      if (stateSubmit.state === ProductStates.ACTIVE) {
        await publishProduct(productDraft.id);
      }

      toast.add({
        ...toastCustom.success,
        title: stateSubmit.state === ProductStates.ACTIVE ?
          'Product published' :
          'Draft saved',
      });
      await router.push(routes.products());
    }
    catch (error) {
      toast.add({
        ...toastCustom.error,
        title: 'Create product failed',
      });
    }
    finally {
      loadingSubmit.value = false;
    }
  }

  return {
    loadingSubmit,
    submit,
  };
}
