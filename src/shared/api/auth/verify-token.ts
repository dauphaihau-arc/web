import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';

export type VerifyTokenRequest = {
  token: string
  type: string
  options?: NitroFetchOptions<NitroFetchRequest>
};

export type VerifyTokenResponse = unknown;
