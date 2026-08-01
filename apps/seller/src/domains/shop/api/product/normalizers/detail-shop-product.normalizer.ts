import { ProductVariantTypes } from '@arc/enums/product';
import { fromMinorUnits } from '@arc/utils';
import type {
  DetailShopProductInventory,
  DetailShopProductResponse,
  DetailShopProductVariant,
  DetailShopProductVariantOption,
  ShopProductDetailApiResponse
} from '../contracts/read.contract';

function normalizeInventory(
  inventory?: ShopProductDetailApiResponse['inventory'][number]
): DetailShopProductInventory {
  if (!inventory || inventory.amount_minor == null || !inventory.currency) {
    return {};
  }

  return {
    id: inventory.id,
    amount: fromMinorUnits(inventory.amount_minor, inventory.currency),
    original_price: inventory.original_amount_minor != null ?
      fromMinorUnits(inventory.original_amount_minor, inventory.currency) :
      undefined,
    stock: inventory.stock,
    sku: inventory.sku,
    currency: inventory.currency,
  };
}

export function normalizeDetailShopProductResponse(
  response: ShopProductDetailApiResponse
): DetailShopProductResponse {
  const variantType = response.variant_type ?? ProductVariantTypes.NONE;
  const inventoryByVariantId = new Map(
    response.inventory
      .filter(item => item.product_variant_id)
      .map(item => [item.product_variant_id!, item])
  );

  const baseProduct = {
    id: response.id,
    state: response.state,
    title: response.title,
    description: response.description,
    who_made: response.who_made,
    is_digital: response.is_digital,
    variant_type: variantType,
    variant_group_name: response.variant_group_name,
    variant_sub_group_name: response.variant_sub_group_name,
    tags: [],
    category: response.category_id ?
      {
        id: response.category_id,
        name: '',
      } :
      null,
    images: response.images.map(image => ({
      id: image.id,
      relative_url: image.storage_key,
      rank: image.rank,
    })),
    attributes: response.attributes.map(attribute => ({
      id: attribute.id,
      attribute: attribute.category_attribute_id,
      selected: attribute.selected_option_id ?? attribute.selected_text ?? '',
    })),
  };

  if (variantType === ProductVariantTypes.NONE) {
    return {
      product: {
        ...baseProduct,
        inventory: normalizeInventory(response.inventory[0]),
        variants: [],
      },
    };
  }

  if (variantType === ProductVariantTypes.SINGLE) {
    return {
      product: {
        ...baseProduct,
        inventory: {},
        variants: response.variants.map(variant => ({
          id: variant.id,
          variant_name: variant.option_value_1 ?? variant.name,
          inventory: normalizeInventory(inventoryByVariantId.get(variant.id)),
        })),
      },
    };
  }

  const variantsByPrimaryOption = new Map<string, DetailShopProductVariant>();

  response.variants.forEach((variant) => {
    const primaryOption = variant.option_value_1 ?? variant.name;
    const secondaryOption = variant.option_value_2 ?? variant.name;
    const existingGroup = variantsByPrimaryOption.get(primaryOption);
    const variantOption: DetailShopProductVariantOption = {
      id: variant.id,
      variant: {
        id: variant.id,
        variant_name: secondaryOption,
      },
      inventory: normalizeInventory(inventoryByVariantId.get(variant.id)),
    };

    if (existingGroup) {
      existingGroup.variant_options = [
        ...(existingGroup.variant_options ?? []),
        variantOption,
      ];
      return;
    }

    variantsByPrimaryOption.set(primaryOption, {
      id: variant.id,
      variant_name: primaryOption,
      variant_options: [variantOption],
    });
  });

  return {
    product: {
      ...baseProduct,
      inventory: {},
      variants: Array.from(variantsByPrimaryOption.values()),
    },
  };
}
