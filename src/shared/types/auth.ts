import type { User } from '~/shared/types/user';
import type { Shop } from '~/shared/types/shop';

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

export type LoginBody = Pick<User, 'email' | 'password'>;

export type RegisterBody = Pick<User, 'email' | 'password' | 'market_preferences'> & {
  display_name?: string
};

export type ResetPasswordBody = Record<'password' | 'passwordConfirm', string>;
