export const CHAT_MESSAGE_TYPES = {
  TEXT: 'text',
  PRODUCT_REFERENCE: 'product_reference',
} as const

export type ChatProductReferenceSnapshot = {
  title: string
  shop_slug: string
  product_slug: string
  image_storage_key?: string
  amount_minor?: number
  original_amount_minor?: number
  currency?: string
}

export type ChatProductReference = {
  product_id: string
  snapshot: ChatProductReferenceSnapshot
  current?: {
    status?: string
    in_stock?: boolean
    stock?: number
  }
}

export type ChatProductReferenceMetadata = {
  product_reference: ChatProductReference
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function getOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function parseChatProductReference(
  metadata: unknown,
): ChatProductReference | null {
  if (!isRecord(metadata) || !isRecord(metadata.product_reference)) {
    return null
  }

  const productReference = metadata.product_reference
  const snapshot = productReference.snapshot

  if (!isRecord(snapshot)) {
    return null
  }

  const productId = getOptionalString(productReference.product_id)
  const title = getOptionalString(snapshot.title)
  const shopSlug = getOptionalString(snapshot.shop_slug)
  const productSlug = getOptionalString(snapshot.product_slug)

  if (!productId || !title || !shopSlug || !productSlug) {
    return null
  }

  return {
    product_id: productId,
    snapshot: {
      title,
      shop_slug: shopSlug,
      product_slug: productSlug,
      image_storage_key: getOptionalString(snapshot.image_storage_key),
      amount_minor: getOptionalNumber(snapshot.amount_minor),
      original_amount_minor: getOptionalNumber(snapshot.original_amount_minor),
      currency: getOptionalString(snapshot.currency),
    },
    current: isRecord(productReference.current)
      ? {
          status: getOptionalString(productReference.current.status),
          in_stock: typeof productReference.current.in_stock === 'boolean'
            ? productReference.current.in_stock
            : undefined,
          stock: getOptionalNumber(productReference.current.stock),
        }
      : undefined,
  }
}
