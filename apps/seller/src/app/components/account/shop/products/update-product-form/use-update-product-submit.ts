// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { QueryClient } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import pick from '@arc/utils/pick'
import { toastCustom } from '~/shared/config/toast'
import { shopProductApi } from '~/shared/api/shop/product/product.api'
import { resolveMyShopId } from '~/shared/server-state/shop/resolve-my-shop-id'
import { useShopPublishProduct } from '~/shared/server-state/shop/product/publish-product.mutation'
import { useIssueProductImageUploadUrl } from '~/shared/server-state/upload/issue-product-image-upload-url.mutation'
import { useShopSetProductAttributes } from '~/shared/server-state/shop/product/set-product-attributes.mutation'
import { useShopSetProductImagesByKeys } from '~/shared/server-state/shop/product/set-product-images-by-keys.mutation'
import { useShopUpdateProduct } from '~/shared/server-state/shop/product/update-product.mutation'
import type { DetailShopProductResponse } from '~/shared/api/shop/product/contracts/read.contract'
import type {
  ProductImageReference,
  UpdateProductBody,
} from '~/shared/api/shop/product/contracts/form.contract'

type UseUpdateProductSubmitInput = {
  productId: string
  queryClient: QueryClient
  dataDetailProduct: Ref<DetailShopProductResponse | undefined>
  fileImages: Ref<File[]>
  idsImageForDelete: Ref<Required<Pick<ProductImageReference, 'id'>>[]>
}

export type UpdateProductAction = 'save' | 'publish' | 'deactivate'

function buildDetailPayload(dataSubmit: UpdateProductBody) {
  return pick(dataSubmit, [
    'title',
    'description',
    'who_made',
    'is_digital',
    'non_taxable',
    'variant_group_name',
    'variant_sub_group_name',
  ])
}

function buildAttributesPayload(
  attributes: NonNullable<UpdateProductBody['attributes']>,
) {
  return attributes.map(attribute => ({
    category_attribute_id: attribute.attribute_id,
    selected_option_id: attribute.selected,
  }))
}

function buildImagesPayload(
  dataDetailProduct: DetailShopProductResponse | undefined,
  idsImageForDelete: Required<Pick<ProductImageReference, 'id'>>[],
  uploadedKeys: string[] = [],
) {
  const currentImages = dataDetailProduct?.product.images ?? []
  const deletedImageIds = new Set(idsImageForDelete.map(image => image.id))
  const persistedImages = currentImages
    .filter(image => !deletedImageIds.has(image.id))
    .map(image => image.relative_url)

  return [...persistedImages, ...uploadedKeys].map((storageKey, index) => ({
    storage_key: storageKey,
    rank: index + 1,
  }))
}

export function useUpdateProductSubmit({
  productId,
  queryClient,
  dataDetailProduct,
  fileImages,
  idsImageForDelete,
}: UseUpdateProductSubmitInput) {
  const toast = useToast()
  const loadingSubmit = ref(false)

  const {
    mutateAsync: issueProductImageUploadUrl,
  } = useIssueProductImageUploadUrl()

  const {
    mutateAsync: updateProduct,
  } = useShopUpdateProduct()

  const {
    mutateAsync: publishProduct,
  } = useShopPublishProduct()

  const {
    mutateAsync: setProductImagesByKeys,
  } = useShopSetProductImagesByKeys()

  const {
    mutateAsync: setProductAttributes,
  } = useShopSetProductAttributes()

  async function uploadImage() {
    if (fileImages.value.length === 0) return []

    const keys: string[] = []
    const uploadImagesPromises = []

    for (let i = 0; i < fileImages.value.length; i++) {
      const { presigned_url: presignedUrl, key } = await issueProductImageUploadUrl({
        productId,
        content_type: fileImages.value[i].type,
        asset_type: 'original',
      })

      if (!presignedUrl || !key) {
        toast.add({
          ...toastCustom.error,
          title: 'Oops',
          description: 'Something wrong',
        })
        throw new Error()
      }

      keys.push(key)

      const promise = useFetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fileImages.value[i].type,
        },
        body: fileImages.value[i],
      })
      uploadImagesPromises.push(promise)
    }

    await Promise.all(uploadImagesPromises)

    return keys
  }

  function getNextImageCount() {
    const currentImages = dataDetailProduct.value?.product.images ?? []
    const deletedImageIds = new Set(idsImageForDelete.value.map(image => image.id))

    return currentImages.filter(image => !deletedImageIds.has(image.id)).length
      + fileImages.value.length
  }

  async function submit(
    dataSubmit: UpdateProductBody,
    action: UpdateProductAction = 'save',
  ) {
    if (action === 'publish' && getNextImageCount() === 0) {
      toast.add({
        ...toastCustom.error,
        title: 'Add at least 1 image before publishing',
      })
      return
    }

    loadingSubmit.value = true

    try {
      const uploadedKeys = await uploadImage()
      const detailPayload = buildDetailPayload(dataSubmit)

      if (Object.keys(detailPayload).length > 0) {
        await updateProduct({
          ...detailPayload,
          id: productId,
        })
      }

      if (dataSubmit.attributes) {
        await setProductAttributes({
          id: productId,
          attributes: buildAttributesPayload(dataSubmit.attributes),
        })
      }

      if (uploadedKeys.length > 0 || idsImageForDelete.value.length > 0) {
        await setProductImagesByKeys({
          id: productId,
          images: buildImagesPayload(
            dataDetailProduct.value,
            idsImageForDelete.value,
            uploadedKeys,
          ),
        })
      }

      await queryClient.invalidateQueries({
        queryKey: ['shop-get-detail-product', productId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['shop-get-products'],
      })

      if (action === 'publish') {
        await publishProduct(productId)
      }

      if (action === 'deactivate') {
        const shopId = await resolveMyShopId(queryClient)
        await shopProductApi.bulkMutate(shopId, {
          ids: [productId],
          action: 'deactivate',
        })
      }

      await queryClient.invalidateQueries({
        queryKey: ['shop-get-detail-product', productId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['shop-get-products'],
      })

      toast.add({
        ...toastCustom.success,
        title: action === 'publish'
          ? 'Product published'
          : action === 'deactivate'
            ? 'Product deactivated'
            : 'Update product success',
      })
    }
    catch (error) {
      toast.add({
        ...toastCustom.error,
        title: 'Update product failed',
      })
    }
    finally {
      loadingSubmit.value = false
    }
  }

  return {
    loadingSubmit,
    submit,
  }
}
