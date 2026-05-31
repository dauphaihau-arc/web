type StorageUrlInput = {
  url?: string
  storageKey?: string
  assetHost?: string
}

type ProductImageVariant = {
  storage_key: string
  url?: string
}

type ProductImageLike = {
  storage_key: string
  url?: string
  variants?: Record<string, ProductImageVariant>
}

export function resolveStoragePublicUrl(input: StorageUrlInput): string | undefined {
  if (input.url) {
    return input.url
  }

  if (!input.storageKey || !input.assetHost) {
    return undefined
  }

  const baseUrl = input.assetHost.replace(/\/+$/, '')
  const encodedKey = input.storageKey
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/')

  return `${baseUrl}/${encodedKey}`
}

export function resolveProductImageUrl(
  image: ProductImageLike | undefined,
  assetHost: string | undefined,
  preferredVariant?: string,
): string | undefined {
  if (!image) {
    return undefined
  }

  if (preferredVariant) {
    const variant = image.variants?.[preferredVariant]
    const variantUrl = resolveStoragePublicUrl({
      url: variant?.url,
      storageKey: variant?.storage_key,
      assetHost,
    })

    if (variantUrl) {
      return variantUrl
    }
  }

  return resolveStoragePublicUrl({
    url: image.url,
    storageKey: image.storage_key,
    assetHost,
  })
}
