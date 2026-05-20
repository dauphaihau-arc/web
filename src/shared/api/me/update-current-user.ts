import type { UserAuthenticated } from '~/shared/api/auth/login';
import type { User } from '~/shared/models/user';

export type UpdateCurrentUserRequest = {
  preferences: NonNullable<User['market_preferences']>
};

export type UpdateCurrentUserResponse = UserAuthenticated;
