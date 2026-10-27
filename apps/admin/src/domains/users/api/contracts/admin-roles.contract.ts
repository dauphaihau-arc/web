/**
 * A role definition an operator can grant to an account. Keys are the machine
 * names the users endpoints accept; names are what the role picker shows.
 */

export interface AdminRole {
  key: string
  name: string
  description?: string
}

export interface AdminRoleListResponse {
  roles: AdminRole[]
}
