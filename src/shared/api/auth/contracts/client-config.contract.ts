import type { z } from 'zod';
import type { authClientConfigSchema } from '~/shared/schemas/api/auth/client-config.schema';

export type AuthClientConfigResponse = z.infer<typeof authClientConfigSchema>;
