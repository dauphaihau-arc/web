import { z } from 'zod';

export const resetPasswordFormSchema = z.object({
  password: z.string(),
  passwordConfirm: z.string(),
});
