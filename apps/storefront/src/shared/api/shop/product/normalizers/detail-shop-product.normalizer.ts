import type {
  DetailShopProductInventory,
  DetailShopProductResponse,
  DetailShopProductVariant,
  DetailShopProductVariantOption,
  ShopProductDetailApiResponse
} from '../contracts/read.contract';
import { ProductVariantTypes } from '~/shared/config/enums/product';

function normalizeInventory(
  inventory?: ShopProductDetailApiResponse['inventory'][number]
): DetailShopProductInventory {
  if (!inventory) {
    return {};
  }

  return {
    id: inventory.id,
    price: inventory.price,
    stock: inventory.stock,
    sku: inventory.sku,
    sale_price: inventory.salePrice,
  };
}

export function normalizeDetailShopProductResponse(
  response: ShopProductDetailApiResponse
): DetailShopProductResponse {
  const variantType = response.variantType ?? ProductVariantTypes.NONE;
  const inventoryByVariantId = new Map(
    response.inventory
      .filter(item => item.productVariantId)
      .map(item => [item.productVariantId!, item])
  );

  const baseProduct = {
    id: response.id,
    title: response.title,
    description: response.description,
    who_made: response.whoMade,
    is_digital: response.isDigital,
    variant_type: variantType,
    variant_group_name: response.variantGroupName,
    variant_sub_group_name: response.variantSubGroupName,
    tags: [],
    category: response.categoryId ?
      {
        id: response.categoryId,
        name: '',
      } :
      null,
    images: response.images.map(image => ({
      id: image.id,
      relative_url: image.storageKey,
      rank: image.rank,
      url: image.url,
    })),
    attributes: response.attributes.map(attribute => ({
      id: attribute.id,
      attribute: attribute.categoryAttributeId,
      selected: attribute.selectedOptionId ?? attribute.selectedText ?? '',
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
          variant_name: variant.optionValue1 ?? variant.name,
          inventory: normalizeInventory(inventoryByVariantId.get(variant.id)),
        })),
      },
    };
  }

  const variantsByPrimaryOption = new Map<string, DetailShopProductVariant>();

  response.variants.forEach((variant) => {
    const primaryOption = variant.optionValue1 ?? variant.name;
    const secondaryOption = variant.optionValue2 ?? variant.name;
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
