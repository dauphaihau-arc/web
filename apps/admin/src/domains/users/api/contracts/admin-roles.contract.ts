import type { components } from '@arc/schemas/api/generated/openapi';

/**
 * A role definition an operator can grant to an account. Keys are the machine
 * names the users endpoints accept; names are what the role picker shows.
 */

export type AdminRole = components['schemas']['RoleResponseDto'];

export type AdminRoleListResponse = components['schemas']['RoleListResponseDto'];
