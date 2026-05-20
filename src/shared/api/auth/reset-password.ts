import type { UserAuthenticated } from './login';
import type { User } from '~/shared/models/user';

export type ResetPasswordRequest = {
  token: string
  password: User['password']
};

export type ResetPasswordForm = Record<'password' | 'passwordConfirm', string>;

export type ResetPasswordResponse = {
  user: UserAuthenticated
};
