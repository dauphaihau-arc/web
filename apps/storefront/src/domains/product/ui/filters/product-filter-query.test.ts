import { describe, expect, it } from 'vitest';
import {
  buildFacetBaselineQuery,
  buildFacetRequestQuery,
  extractProductFilterQuery,
  hasActiveProductFilterQuery,
  isAttributeFilterQueryKey,
  isProductFilterQueryKey,
} from './product-filter-query';

describe('extractProductFilterQuery', () => {
  it('keeps active filters and drops pagination, sorting, and empty values', () => {
    expect(extractProductFilterQuery({
      category_id: '29',
      page: '2',
      order: 'price_desc',
      is_digital: 'false',
      who_made: 'i_did',
      min_price: '1000',
      max_price: '',
      catalog_ship_to: 'GB',
      attr_color: 'black,white',
      attr_material: '',
      unrelated: 'value',
    })).toEqual({
      is_digital: 'false',
      who_made: 'i_did',
      min_price: '1000',
      catalog_ship_to: 'GB',
      attr_color: 'black,white',
    });
  });

  it('normalizes repeated params into a non-empty array', () => {
    expect(extractProductFilterQuery({
      attr_color: ['black', '', 'white'],
      who_made: ['i_did', ''],
    })).toEqual({
      attr_color: ['black', 'white'],
      who_made: ['i_did'],
    });
  });

  it('returns no filters for an empty query', () => {
    expect(extractProductFilterQuery({})).toEqual({});
  });
});

describe('buildFacetRequestQuery', () => {
  it('omits the catalog destination when the URL follows the Market', () => {
    expect(buildFacetRequestQuery({ categoryId: '29' }, {
      page: '2',
      order: 'newest',
      is_digital: 'true',
      attr_color: 'black',
    })).toEqual({
      is_digital: 'true',
      attr_color: 'black',
      category_id: '29',
    });
  });

  it('forwards an explicit catalog destination', () => {
    expect(buildFacetRequestQuery({ categoryId: '29' }, {
      catalog_ship_to: 'GB',
    })).toEqual({
      catalog_ship_to: 'GB',
      category_id: '29',
    });
  });

  it('forwards explicit all-destinations', () => {
    expect(buildFacetRequestQuery({ categoryId: '29' }, {
      catalog_ship_to: 'all',
    })).toEqual({
      catalog_ship_to: 'all',
      category_id: '29',
    });
  });

  it('scopes a search listing to its keyword and keeps the active filters', () => {
    expect(buildFacetRequestQuery({ search: 'kl' }, {
      q: 'kl',
      page: '2',
      order: 'newest',
      is_digital: 'true',
      attr_color: 'black',
      catalog_ship_to: 'VN',
    })).toEqual({
      is_digital: 'true',
      attr_color: 'black',
      catalog_ship_to: 'VN',
      search: 'kl',
    });
  });

  it('returns no request when the scope carries neither a category nor a keyword', () => {
    expect(buildFacetRequestQuery({}, { is_digital: 'true' })).toBeUndefined();
  });
});

describe('buildFacetBaselineQuery', () => {
  it('carries only the category identity when the Market is the destination', () => {
    expect(buildFacetBaselineQuery({ categoryId: '29' })).toEqual({
      category_id: '29',
    });
  });

  it('carries an explicit catalog destination', () => {
    expect(buildFacetBaselineQuery({ categoryId: '29' }, {
      catalog_ship_to: 'GB',
    })).toEqual({
      catalog_ship_to: 'GB',
      category_id: '29',
    });
  });

  it('carries explicit all-destinations', () => {
    expect(buildFacetBaselineQuery({ categoryId: '29' }, {
      catalog_ship_to: 'all',
    })).toEqual({
      catalog_ship_to: 'all',
      category_id: '29',
    });
  });

  it('carries the keyword for a search listing', () => {
    expect(buildFacetBaselineQuery({ search: 'kl' })).toEqual({
      search: 'kl',
    });
  });

  it('returns no baseline without a scope', () => {
    expect(buildFacetBaselineQuery({})).toBeUndefined();
  });
});

describe('filter query key predicates', () => {
  it('recognizes attribute and listing filter keys', () => {
    expect(isAttributeFilterQueryKey('attr_color')).toBe(true);
    expect(isAttributeFilterQueryKey('color')).toBe(false);
    expect(isProductFilterQueryKey('who_made')).toBe(true);
    expect(isProductFilterQueryKey('catalog_ship_to')).toBe(true);
    expect(isProductFilterQueryKey('attr_color')).toBe(true);
    expect(isProductFilterQueryKey('page')).toBe(false);
  });
});

describe('hasActiveProductFilterQuery', () => {
  it('counts an explicit catalog country but not the all-destinations widening', () => {
    expect(hasActiveProductFilterQuery({ catalog_ship_to: 'GB' })).toBe(true);
    expect(hasActiveProductFilterQuery({ catalog_ship_to: 'all' })).toBe(false);
    expect(hasActiveProductFilterQuery({ catalog_ship_to: '' })).toBe(false);
    expect(hasActiveProductFilterQuery({ page: '2' })).toBe(false);
  });
});
