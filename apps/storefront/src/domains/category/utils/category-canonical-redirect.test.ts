import {
  describe, expect, it,
} from 'vitest';
import { categoryRedirectTarget } from './category-canonical-redirect';
import type { CategoryResolution } from './category.normalizer';

const resolution: CategoryResolution = {
  category: { id: '1', slug: 'gaming-laptops', name: 'Gaming Laptops' },
  ancestry: [{ id: '1', slug: 'gaming-laptops', name: 'Gaming Laptops' }],
  canonicalPath: '/c/gaming-laptops-c1',
};

describe('categoryRedirectTarget', () => {
  it('returns null for an already canonical request', () => {
    expect(categoryRedirectTarget(resolution, {
      path: '/c/gaming-laptops-c1',
      fullPath: '/c/gaming-laptops-c1',
    })).toBeNull();
  });

  it('corrects a wrong slug in one hop', () => {
    expect(categoryRedirectTarget(resolution, {
      path: '/c/old-slug-c1',
      fullPath: '/c/old-slug-c1',
    })).toBe('/c/gaming-laptops-c1');
  });

  it('combines a trailing slash and a wrong slug into one redirect', () => {
    expect(categoryRedirectTarget(resolution, {
      path: '/c/old-slug-c1/',
      fullPath: '/c/old-slug-c1/',
    })).toBe('/c/gaming-laptops-c1');
  });

  it('preserves the query and hash', () => {
    expect(categoryRedirectTarget(resolution, {
      path: '/c/old-slug-c1/',
      fullPath: '/c/old-slug-c1/?min_price=50&page=2#reviews',
    })).toBe('/c/gaming-laptops-c1?min_price=50&page=2#reviews');
  });

  it('canonicalizes a legacy path to the current URL, preserving the query', () => {
    expect(categoryRedirectTarget(resolution, {
      path: '/c/home/gaming-laptops',
      fullPath: '/c/home/gaming-laptops?sort=price',
    })).toBe('/c/gaming-laptops-c1?sort=price');
  });
});
