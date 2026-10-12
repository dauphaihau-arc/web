import { loadSellerE2eEnvironment } from './environment';

/**
 * Preflight for the seller browser suite: the externally provisioned API must be
 * ready and must advertise the compatible generation the suite is configured to
 * speak. Runs before any browser test so a stale or mismatched backend fails
 * with an actionable message instead of a confusing first-request error.
 */
export default async function globalSetup(): Promise<void> {
  const { apiOrigin, apiBaseUrl, compatibleGeneration } = loadSellerE2eEnvironment();
  const readinessUrl = `${apiOrigin}/health/ready`;
  const readiness = await fetch(readinessUrl, { signal: AbortSignal.timeout(10_000) });

  if (!readiness.ok) {
    throw new Error(`Test API readiness check failed: ${readinessUrl} returned HTTP ${readiness.status}.`);
  }

  await assertCategoryContract(apiBaseUrl, compatibleGeneration);
}

async function assertCategoryContract(apiBaseUrl: string, expectedVersion: string): Promise<void> {
  const url = `${apiBaseUrl}/categories/contract`;
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

  if (!response.ok) {
    throw new Error(`Category contract check failed: ${url} returned HTTP ${response.status}.`);
  }

  const body = await response.json() as { version?: unknown };

  if (body?.version !== expectedVersion) {
    throw new Error(
      `Category contract mismatch: the API advertises version ${JSON.stringify(body?.version)} but the suite expects ${expectedVersion}. Provision the expected API version or explicitly select a matching test bundle with SELLER_E2E_COMPATIBLE_GENERATION.`,
    );
  }
}
