import { describe, expect, it } from 'vitest';
import { countActiveFilters } from './use-product-filter-state';
import { createDefaultFilterState } from './use-product-filter-query-sync';

describe('createDefaultFilterState catalog destination', () => {
  it('follows the Market when the URL omits the key', () => {
    expect(createDefaultFilterState({}, 'USD').catalogShipTo).toBe('');
    expect(createDefaultFilterState({ catalog_ship_to: '' }, 'USD').catalogShipTo).toBe('');
  });

  it('reads an explicit ISO country and normalizes its case', () => {
    expect(createDefaultFilterState({ catalog_ship_to: 'gb' }, 'USD').catalogShipTo).toBe('GB');
  });

  it('reads the all-destinations value', () => {
    expect(createDefaultFilterState({ catalog_ship_to: 'all' }, 'USD').catalogShipTo).toBe('all');
  });

  it('falls back to the Market for a malformed value', () => {
    expect(createDefaultFilterState({ catalog_ship_to: 'United Kingdom' }, 'USD').catalogShipTo).toBe('');
  });

  it('handles repeated query values deterministically', () => {
    expect(createDefaultFilterState({
      catalog_ship_to: ['GB', 'VN'],
    }, 'USD').catalogShipTo).toBe('GB');
  });
});

describe('countActiveFilters catalog destination', () => {
  it('does not count the destination as an active chip', () => {
    expect(countActiveFilters(createDefaultFilterState({}, 'USD'))).toBe(0);
    expect(countActiveFilters(createDefaultFilterState({
      catalog_ship_to: 'all',
    }, 'USD'))).toBe(0);
    expect(countActiveFilters(createDefaultFilterState({
      catalog_ship_to: 'GB',
    }, 'USD'))).toBe(0);
  });

  it('still counts other active selections', () => {
    const state = createDefaultFilterState({
      is_digital: 'true',
      catalog_ship_to: 'GB',
    }, 'USD');

    expect(countActiveFilters(state)).toBe(1);
  });
});
