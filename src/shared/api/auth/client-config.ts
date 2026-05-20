export type AuthClientConfigResponse = {
  version: string
  password: {
    min_length: number
    max_length: number
    pattern: string
    requirements: {
      lowercase: boolean
      uppercase: boolean
      number: boolean
      special_character: boolean
    }
    message: string
  }
  session: {
    access_token_ttl_seconds: number
    refresh_token_ttl_seconds: number
  }
};
