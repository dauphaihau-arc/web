import { MarketCurrencies, MarketRegions } from '@arc/enums/market';
import { describe, expect, it } from 'vitest';
import { resolvePreviewCountryCode, type MarketConfigMarket } from './market.contract';

function market(overrides: Partial<MarketConfigMarket> = {}): MarketConfigMarket {
  return {
    code: 'US',
    name: MarketRegions.UNITED_STATES,
    preview_country_code: 'US',
    defaultCurrency: MarketCurrencies.USD,
    supportedCurrencies: [MarketCurrencies.USD],
    defaultLocale: 'en-US',
    supportedLocales: ['en-US'],
    enabled: true,
    ...overrides,
  };
}

describe('resolvePreviewCountryCode', () => {
  it('reads the preview country from the enabled Marketplace config', () => {
    const markets = [
      market(),
      market({
        code: 'VN',
        name: MarketRegions.VIET_NAM,
        preview_country_code: 'VN',
        defaultCurrency: MarketCurrencies.VND,
        supportedCurrencies: [MarketCurrencies.VND],
        defaultLocale: 'vi-VN',
        supportedLocales: ['vi-VN', 'en-VN'],
      }),
    ];

    expect(resolvePreviewCountryCode(markets, 'United States')).toBe('US');
    expect(resolvePreviewCountryCode(markets, 'Vietnam')).toBe('VN');
  });

  it('returns undefined when the Market is disabled, unknown, or absent', () => {
    const markets = [market({ enabled: false })];

    expect(resolvePreviewCountryCode(markets, 'United States')).toBeUndefined();
    expect(resolvePreviewCountryCode(markets, 'Vietnam')).toBeUndefined();
    expect(resolvePreviewCountryCode(undefined, 'United States')).toBeUndefined();
    expect(resolvePreviewCountryCode(markets, undefined)).toBeUndefined();
  });
});
