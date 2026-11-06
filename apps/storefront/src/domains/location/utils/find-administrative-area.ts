import type { AdministrativeArea } from '~/domains/location/api/contracts/location.contract';

/**
 * Subdivision selections are keyed by code, but legacy saved rows may hold the
 * display name, so both vocabularies resolve here.
 */
export function findAdministrativeArea(
  areas: AdministrativeArea[] | undefined,
  value: string | undefined,
): AdministrativeArea | undefined {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return areas?.find(area =>
    area.code.toLowerCase() === normalized
    || area.name.toLowerCase() === normalized,
  );
}
