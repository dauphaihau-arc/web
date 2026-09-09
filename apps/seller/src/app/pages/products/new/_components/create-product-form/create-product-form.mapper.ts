// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { MarketCurrencies } from '@arc/enums/market';
import { ProductVariantTypes } from '@arc/enums/product';
import type { PickPartial } from '@arc/contracts/utils';
import type {
  CreateProductBody,
  CreateProductShipping,
  StateCombineVariant,
  StateNoneVariant,
  StateSingleVariant,
} from '~/domains/shop/api/product/contracts/form.contract';
import type { CreateDraftProductRequest as RequestCreateProductDraftBody } from '~/domains/shop/api/product/contracts/create-draft.contract';

export type CreateProductSubmitBody = {
  shipping: CreateProductShipping
} & PickPartial<CreateProductBody, 'attributes' | 'tags'> & (
  NoneVariant
  | SingleVariant
  | CombineVariant
);

export function pruneEmptyCreateProductFields(
  dataSubmit: PickPartial<CreateProductBody, 'attributes' | 'tags'>,
) {
  const nextDataSubmit = { ...dataSubmit };

  if (nextDataSubmit.tags && nextDataSubmit.tags.length === 0) {
    delete nextDataSubmit.tags;
  }

  if (nextDataSubmit.attributes && nextDataSubmit.attributes.length === 0) {
    delete nextDataSubmit.attributes;
  }

  return nextDataSubmit;
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
  } as CreateProductSubmitBody;

  switch (bodyData.variant_type) {
    case ProductVariantTypes.NONE:
      bodyData = { ...bodyData, ...noneVariant };
      break;
    case ProductVariantTypes.SINGLE:
      if (!singleVariant.variant_options) return null;
      bodyData = { ...bodyData, ...singleVariant };
      break;
    case ProductVariantTypes.COMBINE:
      if (!combineVariant.variant_options) return null;
      bodyData = { ...bodyData, ...combineVariant };
      break;
  }

  return bodyData;
}

export function mapAttributes(
  attributes: NonNullable<CreateProductBody['attributes']>,
): RequestCreateProductDraftBody['attributes'] {
  return attributes.map(attribute => ({
    category_attribute_id: attribute.attribute_id,
    selected_option_id: attribute.selected,
  }));
}

export function mapInventoryAndVariants(
  bodyData: CreateProductSubmitBody,
  currency: string,
): Pick<RequestCreateProductDraftBody, 'inventory' | 'options' | 'pricing' | 'variants'> {
  if (bodyData.variant_type === ProductVariantTypes.NONE) {
    return {
      options: [],
      variants: [{
        client_ref: 'default',
        selections: [],
        lifecycle_state: 'active',
      }],
      inventory: [
        {
          variant_client_key: 'default',
          sku: bodyData.sku,
          stock: bodyData.stock,
        },
      ],
      pricing: [
        {
          variant_client_key: 'default',
          amount_minor: toMinorUnits(bodyData.amount!, currency),
          currency,
        },
      ],
    };
  }

  if (bodyData.variant_type === ProductVariantTypes.SINGLE) {
    const optionRef = 'option-1';
    const optionValues = bodyData.variant_options.map((variant, index) => ({
      client_ref: `option-1-value-${index + 1}`,
      value: variant.variant_name!,
      position: index + 1,
    }));
    const variants = bodyData.variant_options.map((variant, index) => {
      const clientKey = `variant-${index + 1}`;

      return {
        client_key: clientKey,
        value_ref: optionValues[index].client_ref,
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
      };
    });

    return {
      options: [{
        client_ref: optionRef,
        name: bodyData.variant_group_name ?? 'Option',
        position: 1,
        values: optionValues,
      }],
      variants: variants.map(variant => ({
        client_ref: variant.client_key,
        selections: [{ option_ref: optionRef, value_ref: variant.value_ref }],
        lifecycle_state: 'active',
      })),
      inventory: variants.map(variant => variant.inventory),
      pricing: variants.map(variant => variant.pricing),
    };
  }

  const primaryOptionRef = 'option-1';
  const secondaryOptionRef = 'option-2';
  const primaryValues = bodyData.variant_options.map((variant, index) => ({
    client_ref: `option-1-value-${index + 1}`,
    value: variant.variant_name!,
    position: index + 1,
  }));
  const secondaryNames = orderedUniqueValues(
    bodyData.variant_options.flatMap(variant =>
      variant.variant_options.map(subVariant => subVariant.variant_name!),
    ),
  );
  const secondaryValues = secondaryNames.map((value, index) => ({
    client_ref: `option-2-value-${index + 1}`,
    value,
    position: index + 1,
  }));
  const primaryValueRefByName = new Map(primaryValues.map(value => [value.value, value.client_ref]));
  const secondaryValueRefByName = new Map(secondaryValues.map(value => [value.value, value.client_ref]));
  const variants = bodyData.variant_options.flatMap((variant, parentIndex) => {
    return variant.variant_options.map((subVariant, childIndex) => {
      const clientKey = `variant-${parentIndex + 1}-${childIndex + 1}`;

      return {
        client_key: clientKey,
        primary_value_ref: primaryValueRefByName.get(variant.variant_name!)!,
        secondary_value_ref: secondaryValueRefByName.get(subVariant.variant_name!)!,
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
      };
    });
  });

  return {
    options: [
      {
        client_ref: primaryOptionRef,
        name: bodyData.variant_group_name ?? 'Option',
        position: 1,
        values: primaryValues,
      },
      {
        client_ref: secondaryOptionRef,
        name: bodyData.variant_sub_group_name ?? 'Option 2',
        position: 2,
        values: secondaryValues,
      },
    ],
    variants: variants.map(variant => ({
      client_ref: variant.client_key,
      selections: [
        { option_ref: primaryOptionRef, value_ref: variant.primary_value_ref },
        { option_ref: secondaryOptionRef, value_ref: variant.secondary_value_ref },
      ],
      lifecycle_state: 'active',
    })),
    inventory: variants.map(variant => variant.inventory),
    pricing: variants.map(variant => variant.pricing),
  };
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
  };
}

export function buildCreateProductPayload(
  bodyData: CreateProductSubmitBody,
  currency: string,
  idempotencyKey: string,
): RequestCreateProductDraftBody {
  return {
    idempotency_key: idempotencyKey,
    category_id: bodyData.category_id,
    title: bodyData.title,
    description: bodyData.description,
    who_made: bodyData.who_made,
    is_digital: bodyData.is_digital,
    non_taxable: false,
    attributes: bodyData.attributes?.length
      ? mapAttributes(bodyData.attributes)
      : undefined,
    ...mapInventoryAndVariants(bodyData, currency),
    shipping: mapShipping(bodyData.shipping),
  };
}

export function buildCreateProductImagesPayload(storageKeys: string[]) {
  return storageKeys.map((key, index) => ({
    storage_key: key,
    rank: index + 1,
  }));
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
};

function toMinorUnits(amount: number, currency: string) {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return Math.round(amount * 10 ** decimals);
}

function orderedUniqueValues(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = value.trim().toLocaleLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value.trim());
  }

  return result;
}
