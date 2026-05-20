import type { User } from '~/shared/models/user';

export type ForgotPasswordRequest = {
  email: User['email']
};

export type ForgotPasswordResponse = undefined;
