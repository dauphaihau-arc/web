import type { User } from '~/shared/models/user';
import type { Shop } from '~/shared/models/shop';

export type UserAuthenticated = {
  id: string
  email: User['email']
  display_name?: string
  status: string
  session_id: string
  roles: string[]
  permissions: string[]
  preferences?: NonNullable<User['market_preferences']>
  shop?: {
    id: Shop['id']
    shop_name: Shop['shop_name']
  }
};

export type LoginRequest = Pick<User, 'email' | 'password'>;

export type LoginResponse = {
  user: UserAuthenticated
};
