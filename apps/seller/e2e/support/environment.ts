/**
 * Test-only environment contract for the seller browser suite.
 *
 * The seller e2e suite consumes a real API that is provisioned externally (the
 * API checkout's `e2e:seller` launcher or CI). It reads that API's origin and
 * seeded fixtures from the environment instead of launching the API itself or
 * polling a shared readiness file. Everything here is synchronous so a missing
 * or malformed value fails before Playwright boots any frontend server.
 */

/** Environment variable carrying the externally provisioned API's bare origin. */
export const SELLER_E2E_API_ORIGIN_ENV = 'SELLER_E2E_API_ORIGIN';

/** Environment variable carrying the externally provisioned fixtures as JSON. */
export const SELLER_E2E_FIXTURES_JSON_ENV = 'SELLER_E2E_FIXTURES_JSON';

/** Environment variable overriding the compatible bundle's generation. */
export const SELLER_E2E_COMPATIBLE_GENERATION_ENV = 'SELLER_E2E_COMPATIBLE_GENERATION';

/** Generation the compatible bundle speaks unless the caller pins another. */
export const DEFAULT_COMPATIBLE_GENERATION = '3';

/**
 * Seeded data published by the external API provisioner. Identifiers are opaque
 * nonempty strings; the suite never validates their shape or format.
 */
export type SellerE2eFixtures = {
  seller: { email: string, password: string }
  shopPublicId: string
  rootCategoryPublicId: string
  childCategoryPublicId: string
  fixtureProductPublicId: string
  fixtureProductTitle: string
};

/** Resolved, validated external API environment for the seller suite. */
export type SellerE2eEnvironment = {
  /** Bare origin of the external API, e.g. `http://127.0.0.1:4010`. */
  apiOrigin: string
  /** Direct API base derived from the origin, i.e. `${apiOrigin}/v1`. */
  apiBaseUrl: string
  /** Generation the compatible bundle is configured to speak. */
  compatibleGeneration: string
  /** Seeded fixtures published by the provisioner. */
  fixtures: SellerE2eFixtures
};

type Environment = Record<string, string | undefined>;

function fail(message: string): never {
  throw new Error(message);
}

/**
 * Requires a bare http(s) origin: no credentials, path, query, or fragment.
 * A trailing slash is accepted and normalized away via `URL.origin`.
 */
function parseApiOrigin(raw: string | undefined): string {
  if (raw === undefined || raw.trim() === '') {
    fail(
      `Missing ${SELLER_E2E_API_ORIGIN_ENV}: set it to the bare HTTP(S) origin of the externally provisioned test API, e.g. http://127.0.0.1:4010.`,
    );
  }

  let url: URL;

  try {
    url = new URL(raw);
  }
  catch {
    fail(
      `Invalid ${SELLER_E2E_API_ORIGIN_ENV}: not a valid URL. Expected a bare HTTP(S) origin without credentials, path, query, or fragment.`,
    );
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    fail(
      `Invalid ${SELLER_E2E_API_ORIGIN_ENV}: expected an http(s) origin but got a "${url.protocol}" URL.`,
    );
  }

  if (url.username !== '' || url.password !== '') {
    fail(
      `Invalid ${SELLER_E2E_API_ORIGIN_ENV}: must be a bare origin without embedded credentials.`,
    );
  }

  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    fail(
      `Invalid ${SELLER_E2E_API_ORIGIN_ENV}: must be a bare origin without path, query, or fragment.`,
    );
  }

  return url.origin;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`Invalid ${SELLER_E2E_FIXTURES_JSON_ENV}: "${field}" must be a nonempty string.`);
  }

  return value;
}

/** Parses and validates the provisioner's fixtures JSON. Never echoes values. */
function parseFixtures(raw: string | undefined): SellerE2eFixtures {
  if (raw === undefined || raw.trim() === '') {
    fail(
      `Missing ${SELLER_E2E_FIXTURES_JSON_ENV}: set it to the JSON fixtures published by the external API provisioner.`,
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  }
  catch {
    fail(`Invalid ${SELLER_E2E_FIXTURES_JSON_ENV}: value is not valid JSON.`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    fail(`Invalid ${SELLER_E2E_FIXTURES_JSON_ENV}: expected a JSON object.`);
  }

  const source = parsed as Record<string, unknown>;
  const seller = source.seller;

  if (typeof seller !== 'object' || seller === null || Array.isArray(seller)) {
    fail(`Invalid ${SELLER_E2E_FIXTURES_JSON_ENV}: "seller" must be an object with email and password.`);
  }

  const sellerRecord = seller as Record<string, unknown>;
  const email = requireNonEmptyString(sellerRecord.email, 'seller.email');
  const password = requireNonEmptyString(sellerRecord.password, 'seller.password');

  return {
    seller: { email, password },
    shopPublicId: requireNonEmptyString(source.shopPublicId, 'shopPublicId'),
    rootCategoryPublicId: requireNonEmptyString(source.rootCategoryPublicId, 'rootCategoryPublicId'),
    childCategoryPublicId: requireNonEmptyString(source.childCategoryPublicId, 'childCategoryPublicId'),
    fixtureProductPublicId: requireNonEmptyString(source.fixtureProductPublicId, 'fixtureProductPublicId'),
    fixtureProductTitle: requireNonEmptyString(source.fixtureProductTitle, 'fixtureProductTitle'),
  };
}

/** Generation the compatible bundle is configured to speak (default `3`). */
export function resolveSellerE2eCompatibleGeneration(env: Environment = process.env): string {
  const raw = env[SELLER_E2E_COMPATIBLE_GENERATION_ENV];

  return raw === undefined || raw.trim() === '' ? DEFAULT_COMPATIBLE_GENERATION : raw;
}

/**
 * Validates and resolves the external API environment synchronously. Throws an
 * actionable, secret-free error naming the offending field on any problem.
 */
export function loadSellerE2eEnvironment(env: Environment = process.env): SellerE2eEnvironment {
  const apiOrigin = parseApiOrigin(env[SELLER_E2E_API_ORIGIN_ENV]);

  return {
    apiOrigin,
    apiBaseUrl: `${apiOrigin}/v1`,
    compatibleGeneration: resolveSellerE2eCompatibleGeneration(env),
    fixtures: parseFixtures(env[SELLER_E2E_FIXTURES_JSON_ENV]),
  };
}

/** Validates and resolves only the seeded fixtures. */
export function loadSellerE2eFixtures(env: Environment = process.env): SellerE2eFixtures {
  return loadSellerE2eEnvironment(env).fixtures;
}
