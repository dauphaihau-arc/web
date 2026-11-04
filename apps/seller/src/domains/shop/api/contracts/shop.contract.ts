import type { components } from '@arc/schemas/api/generated/openapi';
import type { MarketCurrencies } from '@arc/enums/market';

type ApiShop = components['schemas']['ShopResponseDto'];
type ApiCreateShop = components['schemas']['CreateShopDto'];

/**
 * The contract types the shop currency as a plain string; the seller UI offers
 * and compares `MarketCurrencies`, so the enum narrows the generated type.
 */
export type MyShopResponse = Omit<ApiShop, 'currency'> & {
  currency: MarketCurrencies
};
export type CreateShopRequest = Omit<ApiCreateShop, 'currency'> & {
  currency: MarketCurrencies
};
export type CreateShopResponse = MyShopResponse;
export type UpdateShopSettingsRequest = components['schemas']['UpdateShopSettingsDto'];
