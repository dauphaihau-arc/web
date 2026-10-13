import {
  describe, expect, it,
} from 'vitest';
import {
  buildCategoryPath,
  isCanonicalCategoryPath,
  parseCategorySegment,
} from './route-paths';

describe('buildCategoryPath', () => {
  it('builds the canonical flat category URL', () => {
    expect(buildCategoryPath('gaming-laptops', '123'))
      .toBe('/c/gaming-laptops-c123');
  });

  it('keeps large public identities as strings', () => {
    expect(buildCategoryPath('mugs', '9007199254740993'))
      .toBe('/c/mugs-c9007199254740993');
  });
});

describe('parseCategorySegment', () => {
  it('parses a slug and public identity', () => {
    expect(parseCategorySegment('gaming-laptops-c123'))
      .toEqual({ slug: 'gaming-laptops', publicId: '123' });
  });

  it('keeps large public identities as strings', () => {
    expect(parseCategorySegment('mugs-c9007199254740993'))
      .toEqual({ slug: 'mugs', publicId: '9007199254740993' });
  });

  it('splits at the last lowercase c marker', () => {
    expect(parseCategorySegment('c-c-c42'))
      .toEqual({ slug: 'c-c', publicId: '42' });
  });

  it('accepts unicode slug characters', () => {
    expect(parseCategorySegment('kávé-c12'))
      .toEqual({ slug: 'kávé', publicId: '12' });
    expect(parseCategorySegment('日本語-c12'))
      .toEqual({ slug: '日本語', publicId: '12' });
  });

  it('uses the first value when a route param is an array', () => {
    expect(parseCategorySegment(['mugs-c12']))
      .toEqual({ slug: 'mugs', publicId: '12' });
  });

  it.each([
    'mugs-c0',
    'mugs-c01',
    'mugs-c',
    'mugs-c-1',
    'mugs-c1.5',
    'mugs-c1e2',
    'mugs-c9007199254740993x',
    'mugs-123',
    'mugs',
    '-c12',
    'mugs--cup-c12',
    '-mugs-c12',
    'mugs--c12',
    'Mugs-c12',
    'mugs-C12',
    'mugs-c12-',
    '',
  ])('rejects malformed segment %s', (segment) => {
    expect(parseCategorySegment(segment)).toBeNull();
  });

  it('rejects the empty and missing param', () => {
    expect(parseCategorySegment(undefined)).toBeNull();
    expect(parseCategorySegment([])).toBeNull();
  });
});

describe('isCanonicalCategoryPath', () => {
  it('matches the canonical path regardless of percent-encoding', () => {
    expect(isCanonicalCategoryPath('/c/gaming-laptops-c1', '/c/gaming-laptops-c1')).toBe(true);
    expect(isCanonicalCategoryPath('/c/caf%C3%A9-cadeaux-c11', '/c/caf\u00e9-cadeaux-c11')).toBe(true);
  });

  it.each([
    '/c/old-slug-c1',
    '/c/gaming-laptops-c1/',
    '/c/gaming-laptops-c2',
    '/c/home/gaming-laptops',
  ])('treats %s as non-canonical', (requested) => {
    expect(isCanonicalCategoryPath(requested, '/c/gaming-laptops-c1')).toBe(false);
  });
});
