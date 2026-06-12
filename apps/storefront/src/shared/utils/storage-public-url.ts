type StorageUrlInput = {
  url?: string
  storageKey?: string
  assetHost?: string
}

type ProductImageLike = {
  storageKey?: string
  url?: string
  variants?: Record<string, unknown>
}

function getStorageKey(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const typedValue = value as Record<string, unknown> & { storageKey?: string }

  if (typeof typedValue.storageKey === 'string') {
    return typedValue.storageKey
  }

  const rawStorageKey = Reflect.get(typedValue, 'storage_key')
  return typeof rawStorageKey === 'string' ? rawStorageKey : undefined
}

function getImageUrl(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const rawUrl = Reflect.get(value as Record<string, unknown>, 'url')
  return typeof rawUrl === 'string' ? rawUrl : undefined
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
      url: getImageUrl(variant),
      storageKey: getStorageKey(variant),
      assetHost,
    })

    if (variantUrl) {
      return variantUrl
    }
  }

  return resolveStoragePublicUrl({
    url: image.url,
    storageKey: getStorageKey(image),
    assetHost,
  })
}
