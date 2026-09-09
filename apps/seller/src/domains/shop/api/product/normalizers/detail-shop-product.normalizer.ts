import { ProductVariantTypes } from '@arc/enums/product';
import { fromMinorUnits } from '@arc/utils';
import type {
  DetailShopProductInventory,
  DetailShopProductResponse,
  DetailShopProductVariant,
  DetailShopProductVariantOption,
  ShopProductDetailApiResponse,
} from '../contracts/read.contract';
import { getProductVariantType, getVariantSelectionValues } from './product-option-display';

function normalizeInventory(
  inventory?: ShopProductDetailApiResponse['inventory'][number],
): DetailShopProductInventory {
  if (!inventory) {
    return {};
  }

  const onHandQuantity = inventory.on_hand_quantity ?? inventory.stock;
  const reservedQuantity = inventory.reserved_quantity ?? 0;
  const availableQuantity = inventory.available_quantity ??
    (onHandQuantity == null ? undefined : Math.max(0, onHandQuantity - reservedQuantity));

  return {
    id: inventory.id,
    amount: inventory.amount_minor != null && inventory.currency
      ? fromMinorUnits(inventory.amount_minor, inventory.currency)
      : undefined,
    original_price: inventory.original_amount_minor != null && inventory.currency
      ? fromMinorUnits(inventory.original_amount_minor, inventory.currency)
      : undefined,
    stock: onHandQuantity,
    onHandQuantity,
    reservedQuantity,
    availableQuantity,
    onHandVersion: inventory.on_hand_version,
    shortage: inventory.shortage ?? (
      onHandQuantity != null ? onHandQuantity < reservedQuantity : undefined
    ),
    sku: inventory.sku,
    currency: inventory.currency,
  };
}

type ProductDetailOption = NonNullable<ShopProductDetailApiResponse['options']>[number];

function findSelection(
  variant: Pick<ShopProductDetailApiResponse['variants'][number], 'selections'>,
  optionId: string | undefined,
  index: number,
) {
  if (!variant.selections?.length) {
    return undefined;
  }

  return optionId
    ? variant.selections.find(selection => selection.option_id === optionId)
    : variant.selections[index];
}

function findOptionValue(
  option: ProductDetailOption | undefined,
  valueId: string | undefined,
) {
  return option?.values.find(value => value.id === valueId);
}

function optionValuePosition(
  option: ProductDetailOption | undefined,
  valueId: string,
) {
  return findOptionValue(option, valueId)?.position ?? Number.MAX_SAFE_INTEGER;
}

export function normalizeDetailShopProductResponse(
  response: ShopProductDetailApiResponse,
): DetailShopProductResponse {
  const options = response.options ?? [];
  const variantType = response.variant_type ?? getProductVariantType(options);
  const inventoryByVariantId = new Map(
    response.inventory
      .filter(item => item.product_variant_id)
      .map(item => [item.product_variant_id!, item]),
  );

  const baseProduct = {
    id: response.id,
    productVersion: response.product_version ?? 0,
    publishedAt: response.published_at,
    removedAt: response.removed_at,
    state: response.state,
    title: response.title,
    description: response.description,
    who_made: response.who_made,
    is_digital: response.is_digital,
    variant_type: variantType,
    variant_group_name: response.variant_group_name ?? options[0]?.name,
    variant_sub_group_name: response.variant_sub_group_name ?? options[1]?.name,
    options,
    tags: response.tags ?? [],
    category: response.category ?? (response.category_id
      ? {
        id: response.category_id,
        name: '',
      }
      : null),
    images: response.images.map(image => ({
      id: image.id,
      relative_url: image.url,
      rank: image.rank,
      url: image.url,
    })),
    attributes: response.attributes.map(attribute => ({
      id: attribute.id,
      attribute: attribute.category_attribute_id,
      selected: attribute.selected_option_id ?? attribute.selected_text ?? '',
    })),
  };

  if (variantType === ProductVariantTypes.NONE) {
    const defaultVariant = response.variants[0];
    const defaultInventory = defaultVariant?.id
      ? inventoryByVariantId.get(defaultVariant.id)
      : response.inventory[0];

    return {
      product: {
        ...baseProduct,
        inventory: normalizeInventory(defaultInventory ?? response.inventory[0]),
        variants: defaultVariant
          ? [{
            id: defaultVariant.id,
            variant_name: 'Default',
            selections: defaultVariant.selections ?? [],
            lifecycle_state: defaultVariant.lifecycle_state ?? 'active',
            image_url: defaultVariant.image_url,
            removed_at: defaultVariant.removed_at,
            rank: defaultVariant.rank,
            inventory: normalizeInventory(defaultInventory),
          }]
          : [],
      },
    };
  }

  if (variantType === ProductVariantTypes.SINGLE) {
    return {
      product: {
        ...baseProduct,
        inventory: {},
        variants: response.variants.map((variant) => {
          const [primaryOption] = getVariantSelectionValues(variant, options);

          return {
            id: variant.id,
            variant_name: primaryOption ?? variant.name ?? 'Option',
            selections: variant.selections ?? [],
            lifecycle_state: variant.lifecycle_state ?? 'active',
            image_url: variant.image_url,
            removed_at: variant.removed_at,
            rank: variant.rank,
            inventory: normalizeInventory(inventoryByVariantId.get(variant.id)),
          };
        }),
      },
    };
  }

  const variantsByPrimaryOption = new Map<string, DetailShopProductVariant>();
  const primaryOption = options[0];
  const secondaryOption = options[1];

  response.variants.forEach((variant) => {
    const primarySelection = findSelection(variant, primaryOption?.id, 0);
    const secondarySelection = findSelection(variant, secondaryOption?.id, 1);
    const primaryOptionName = findOptionValue(primaryOption, primarySelection?.value_id)?.value ?? variant.name ?? 'Option';
    const secondaryOptionName = findOptionValue(secondaryOption, secondarySelection?.value_id)?.value ?? variant.name ?? 'Option';
    const primaryOptionKey = primarySelection?.value_id ?? primaryOptionName;
    const secondaryOptionKey = secondarySelection?.value_id ?? variant.id;
    const existingGroup = variantsByPrimaryOption.get(primaryOptionKey);
    const variantOption: DetailShopProductVariantOption = {
      id: variant.id,
      variant: {
        id: secondaryOptionKey,
        variant_name: secondaryOptionName,
      },
      selections: variant.selections ?? [],
      lifecycle_state: variant.lifecycle_state ?? 'active',
      inventory: normalizeInventory(inventoryByVariantId.get(variant.id)),
    };

    if (existingGroup) {
      existingGroup.variant_options = [
        ...(existingGroup.variant_options ?? []),
        variantOption,
      ];
      return;
    }

    variantsByPrimaryOption.set(primaryOptionKey, {
      id: primaryOptionKey,
      variant_name: primaryOptionName,
      selections: variant.selections ?? [],
      lifecycle_state: variant.lifecycle_state ?? 'active',
      image_url: variant.image_url,
      removed_at: variant.removed_at,
      rank: variant.rank,
      variant_options: [variantOption],
    });
  });

  const groupedVariants = Array.from(variantsByPrimaryOption.values())
    .sort((left, right) =>
      optionValuePosition(primaryOption, left.id) - optionValuePosition(primaryOption, right.id),
    )
    .map(variant => ({
      ...variant,
      variant_options: variant.variant_options?.sort((left, right) =>
        optionValuePosition(secondaryOption, left.variant.id) - optionValuePosition(secondaryOption, right.variant.id),
      ),
    }));

  return {
    product: {
      ...baseProduct,
      inventory: {},
      variants: groupedVariants,
    },
  };
}
