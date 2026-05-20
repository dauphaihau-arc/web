import type { UserAuthenticated } from '~/shared/api/auth/login';

export type GetCurrentUserResponse = {
  user: UserAuthenticated
};
