import type { UserAuthenticated } from './login';
import type { User } from '~/shared/models/user';

export type RegisterRequest = Pick<User, 'email' | 'password'> & {
  display_name?: string
  preferences?: NonNullable<User['market_preferences']>
};

export type RegisterResponse = {
  user: UserAuthenticated
};
