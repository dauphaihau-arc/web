import type { components, paths } from '@arc/schemas/api/generated/openapi';

/**
 * A platform operator's view of a user account. The list and detail endpoints
 * share one shape, and both carry the account's roles so an operator can tell
 * a seller from a buyer without opening the account.
 */

export type AdminUserStatus = components['schemas']['UserResponseDto']['status'];

export type ListAdminUsersParams = paths['/v1/users']['get']['parameters']['query'];

export type AdminUser = components['schemas']['UserResponseDto'];

export type AdminUserListMeta = components['schemas']['UserListMetaResponseDto'];

export type AdminUserListResponse = components['schemas']['UserListResponseDto'];

/**
 * The contract documents the update as a `multipart/form-data` body (the avatar
 * is a binary part) without a named schema; the admin app still sends the same
 * scalar fields as JSON and has no avatar upload, so this boundary reuses the
 * documented form fields as a flat object. Reported as a contract gap.
 */
export type UpdateAdminUserBody =
  paths['/v1/users/{id}']['patch']['requestBody']['content']['multipart/form-data'];

export type CreateAdminUserBody = components['schemas']['CreateUserDto'];

/** The complete role set for the account; an empty array clears every role. */
export type AssignAdminUserRolesBody = components['schemas']['AssignUserRolesDto'];
