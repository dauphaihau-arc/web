import { describe, expect, it } from 'vitest';
import {
  buildFacetBaselineQuery,
  buildFacetRequestQuery,
  extractProductFilterQuery,
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
      attr_color: 'black,white',
      attr_material: '',
      unrelated: 'value',
    })).toEqual({
      is_digital: 'false',
      who_made: 'i_did',
      min_price: '1000',
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
  it('sends the active filters plus the category identity, without pagination or sorting', () => {
    expect(buildFacetRequestQuery('29', {
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
});

describe('buildFacetBaselineQuery', () => {
  it('carries only the category identity so the baseline ignores active filters', () => {
    expect(buildFacetBaselineQuery('29')).toEqual({ category_id: '29' });
  });
});

describe('filter query key predicates', () => {
  it('recognizes attribute and listing filter keys', () => {
    expect(isAttributeFilterQueryKey('attr_color')).toBe(true);
    expect(isAttributeFilterQueryKey('color')).toBe(false);
    expect(isProductFilterQueryKey('who_made')).toBe(true);
    expect(isProductFilterQueryKey('attr_color')).toBe(true);
    expect(isProductFilterQueryKey('page')).toBe(false);
  });
});
