// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { MarketCurrencies } from '@arc/enums/market'
import { ProductVariantTypes } from '@arc/enums/product'
import type { PickPartial } from '@arc/contracts/utils'
import type {
  CreateProductBody,
  CreateProductShipping,
  StateCombineVariant,
  StateNoneVariant,
  StateSingleVariant,
} from '~/shared/api/shop/product/contracts/form.contract'
import type { CreateDraftProductRequest as RequestCreateProductDraftBody } from '~/shared/api/shop/product/contracts/create-draft.contract'

export type CreateProductSubmitBody = {
  shipping: CreateProductShipping
} & PickPartial<CreateProductBody, 'attributes' | 'tags'> & (
  NoneVariant |
  SingleVariant |
  CombineVariant
)

export function pruneEmptyCreateProductFields(
  dataSubmit: PickPartial<CreateProductBody, 'attributes' | 'tags'>,
) {
  const nextDataSubmit = { ...dataSubmit }

  if (nextDataSubmit.tags && nextDataSubmit.tags.length === 0) {
    delete nextDataSubmit.tags
  }

  if (nextDataSubmit.attributes && nextDataSubmit.attributes.length === 0) {
    delete nextDataSubmit.attributes
  }

  return nextDataSubmit
}

export function buildCreateProductSubmitBody(
  dataSubmit: PickPartial<CreateProductBody, 'attributes' | 'tags'>,
  shipping: CreateProductShipping,
  noneVariant: StateNoneVariant,
  singleVariant: StateSingleVariant,
  combineVariant: StateCombineVariant,
): CreateProductSubmitBody | null {
  let bodyData: CreateProductSubmitBody = {
    ...dataSubmit,
    shipping,
  } as CreateProductSubmitBody

  switch (bodyData.variant_type) {
    case ProductVariantTypes.NONE:
      bodyData = { ...bodyData, ...noneVariant }
      break
    case ProductVariantTypes.SINGLE:
      if (!singleVariant.variant_options) return null
      bodyData = { ...bodyData, ...singleVariant }
      break
    case ProductVariantTypes.COMBINE:
      if (!combineVariant.variant_options) return null
      bodyData = { ...bodyData, ...combineVariant }
      break
  }

  return bodyData
}

export function mapAttributes(
  attributes: NonNullable<CreateProductBody['attributes']>,
): RequestCreateProductDraftBody['attributes'] {
  return attributes.map(attribute => ({
    category_attribute_id: attribute.attribute_id,
    selected_option_id: attribute.selected,
  }))
}

export function mapInventoryAndVariants(
  bodyData: CreateProductSubmitBody,
  currency: string,
): Pick<RequestCreateProductDraftBody, 'inventory' | 'pricing' | 'variants'> {
  if (bodyData.variant_type === ProductVariantTypes.NONE) {
    return {
      inventory: [
        {
          sku: bodyData.sku,
          stock: bodyData.stock,
        },
      ],
      pricing: [
        {
          amount_minor: toMinorUnits(bodyData.amount!, currency),
          currency,
        },
      ],
    }
  }

  if (bodyData.variant_type === ProductVariantTypes.SINGLE) {
    const variants = bodyData.variant_options.map((variant, index) => {
      const clientKey = `variant-${index + 1}`

      return {
        client_key: clientKey,
        option_value_1: variant.variant_name,
        inventory: {
          variant_client_key: clientKey,
          sku: variant.sku,
          stock: variant.stock,
        },
        pricing: {
          variant_client_key: clientKey,
          amount_minor: toMinorUnits(variant.amount!, currency),
          currency,
        },
      }
    })

    return {
      variants: variants.map(variant => ({
        client_key: variant.client_key,
        option_value_1: variant.option_value_1,
      })),
      inventory: variants.map(variant => variant.inventory),
      pricing: variants.map(variant => variant.pricing),
    }
  }

  const variants = bodyData.variant_options.flatMap((variant, parentIndex) => {
    return variant.variant_options.map((subVariant, childIndex) => {
      const clientKey = `variant-${parentIndex + 1}-${childIndex + 1}`

      return {
        client_key: clientKey,
        option_value_1: variant.variant_name,
        option_value_2: subVariant.variant_name,
        inventory: {
          variant_client_key: clientKey,
          sku: subVariant.sku,
          stock: subVariant.stock,
        },
        pricing: {
          variant_client_key: clientKey,
          amount_minor: toMinorUnits(subVariant.amount!, currency),
          currency,
        },
      }
    })
  })

  return {
    variants: variants.map(variant => ({
      client_key: variant.client_key,
      option_value_1: variant.option_value_1,
      option_value_2: variant.option_value_2,
    })),
    inventory: variants.map(variant => variant.inventory),
    pricing: variants.map(variant => variant.pricing),
  }
}

export function mapShipping(
  data: CreateProductShipping,
): RequestCreateProductDraftBody['shipping'] {
  return {
    origin_country: data.country,
    origin_zip: data.zip,
    process_time_label: data.process_time,
    destinations: data.standard_shipping.map(destination => ({
      country_code: destination.country,
      delivery_time_label: destination.delivery_time,
      service: destination.service,
      charge_type: destination.charge,
    })),
  }
}

export function buildCreateProductPayload(
  bodyData: CreateProductSubmitBody,
  currency: string,
): RequestCreateProductDraftBody {
  return {
    category_id: bodyData.category_id,
    title: bodyData.title,
    description: bodyData.description,
    who_made: bodyData.who_made,
    is_digital: bodyData.is_digital,
    non_taxable: false,
    variant_type: bodyData.variant_type,
    variant_group_name:
      bodyData.variant_type === ProductVariantTypes.NONE
        ? undefined
        : bodyData.variant_group_name,
    variant_sub_group_name:
      bodyData.variant_type === ProductVariantTypes.COMBINE
        ? bodyData.variant_sub_group_name
        : undefined,
    attributes: bodyData.attributes?.length
      ? mapAttributes(bodyData.attributes)
      : undefined,
    ...mapInventoryAndVariants(bodyData, currency),
    shipping: mapShipping(bodyData.shipping),
  }
}

export function buildCreateProductImagesPayload(storageKeys: string[]) {
  return storageKeys.map((key, index) => ({
    storage_key: key,
    rank: index + 1,
  }))
}

const CURRENCY_DECIMALS: Record<string, number> = {
  [MarketCurrencies.USD]: 2,
  [MarketCurrencies.AUD]: 2,
  [MarketCurrencies.BRL]: 2,
  [MarketCurrencies.CHF]: 2,
  [MarketCurrencies.CNY]: 2,
  [MarketCurrencies.CZK]: 2,
  [MarketCurrencies.DKK]: 2,
  [MarketCurrencies.EUR]: 2,
  [MarketCurrencies.GBP]: 2,
  [MarketCurrencies.CAD]: 2,
  [MarketCurrencies.HKD]: 2,
  [MarketCurrencies.HUF]: 2,
  [MarketCurrencies.IDR]: 2,
  [MarketCurrencies.ILS]: 2,
  [MarketCurrencies.INR]: 2,
  [MarketCurrencies.JPY]: 0,
  [MarketCurrencies.KRW]: 0,
  [MarketCurrencies.MAD]: 2,
  [MarketCurrencies.MXN]: 2,
  [MarketCurrencies.MYR]: 2,
  [MarketCurrencies.NOK]: 2,
  [MarketCurrencies.NZD]: 2,
  [MarketCurrencies.PHP]: 2,
  [MarketCurrencies.PLN]: 2,
  [MarketCurrencies.SEK]: 2,
  [MarketCurrencies.SGD]: 2,
  [MarketCurrencies.THB]: 2,
  [MarketCurrencies.TRY]: 2,
  [MarketCurrencies.TWD]: 2,
  [MarketCurrencies.VND]: 0,
  [MarketCurrencies.ZAR]: 2,
}

function toMinorUnits(amount: number, currency: string) {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2
  return Math.round(amount * 10 ** decimals)
}
