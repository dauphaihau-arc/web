import { describe, expect, it } from 'vitest';
import type { SellerE2eFixtures } from '../e2e/support/environment';
import { loadSellerE2eEnvironment } from '../e2e/support/environment';

const FIXTURES: SellerE2eFixtures = {
  seller: { email: 'seller@example.test', password: 'Password123!' },
  shopPublicId: 'shop-1',
  rootCategoryPublicId: 'root-1',
  childCategoryPublicId: 'child-1',
  fixtureProductPublicId: 'product-1',
  fixtureProductTitle: 'Fixture Shirt',
};

/** Builds an environment with a valid default, overridable per case. */
function buildEnvironment(overrides: Record<string, string | undefined> = {}) {
  return {
    SELLER_E2E_API_ORIGIN: 'http://127.0.0.1:4010',
    SELLER_E2E_FIXTURES_JSON: JSON.stringify(FIXTURES),
    ...overrides,
  };
}

describe('loadSellerE2eEnvironment', () => {
  it('rejects a missing API origin', () => {
    expect(() => loadSellerE2eEnvironment(buildEnvironment({ SELLER_E2E_API_ORIGIN: undefined })))
      .toThrow(/SELLER_E2E_API_ORIGIN/);
  });

  it('rejects an origin that carries a path', () => {
    expect(() => loadSellerE2eEnvironment(buildEnvironment({ SELLER_E2E_API_ORIGIN: 'http://127.0.0.1:4010/api' })))
      .toThrow(/SELLER_E2E_API_ORIGIN/);
  });

  it('rejects an origin that carries credentials without echoing them', () => {
    const origin = 'http://user:s3cr3t@127.0.0.1:4010';

    expect(() => loadSellerE2eEnvironment(buildEnvironment({ SELLER_E2E_API_ORIGIN: origin })))
      .toThrow(/SELLER_E2E_API_ORIGIN/);

    try {
      loadSellerE2eEnvironment(buildEnvironment({ SELLER_E2E_API_ORIGIN: origin }));
    }
    catch (error) {
      expect((error as Error).message).not.toContain('s3cr3t');
    }
  });

  it('normalizes a trailing slash and derives the direct API base', () => {
    const environment = loadSellerE2eEnvironment(buildEnvironment({ SELLER_E2E_API_ORIGIN: 'http://127.0.0.1:4010/' }));

    expect(environment.apiBaseUrl).toBe('http://127.0.0.1:4010/v1');
  });

  it('rejects a missing fixtures JSON', () => {
    expect(() => loadSellerE2eEnvironment(buildEnvironment({ SELLER_E2E_FIXTURES_JSON: undefined })))
      .toThrow(/SELLER_E2E_FIXTURES_JSON/);
  });

  it('rejects fixtures that are not valid JSON', () => {
    expect(() => loadSellerE2eEnvironment(buildEnvironment({ SELLER_E2E_FIXTURES_JSON: '{not json' })))
      .toThrow(/SELLER_E2E_FIXTURES_JSON/);
  });

  it('rejects fixtures that are not a JSON object', () => {
    expect(() => loadSellerE2eEnvironment(buildEnvironment({ SELLER_E2E_FIXTURES_JSON: '[]' })))
      .toThrow(/SELLER_E2E_FIXTURES_JSON/);
  });

  it('names the missing nested seller credential field', () => {
    const fixtures = { ...FIXTURES, seller: { email: FIXTURES.seller.email } };

    expect(() => loadSellerE2eEnvironment(buildEnvironment({ SELLER_E2E_FIXTURES_JSON: JSON.stringify(fixtures) })))
      .toThrow(/seller\.password/);
  });

  it('names the blank fixture identifier field', () => {
    const fixtures = { ...FIXTURES, childCategoryPublicId: '  ' };

    expect(() => loadSellerE2eEnvironment(buildEnvironment({ SELLER_E2E_FIXTURES_JSON: JSON.stringify(fixtures) })))
      .toThrow(/childCategoryPublicId/);
  });
});
