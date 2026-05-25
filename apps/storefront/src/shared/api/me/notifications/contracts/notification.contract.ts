export interface WebPushPublicKeyResponse {
  enabled: boolean
  public_key: string | null
}

export interface RegisterWebPushSubscriptionRequest {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface RegisterWebPushSubscriptionResponse {
  subscription: {
    id: string
    endpoint: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
}

export interface UnregisterWebPushSubscriptionRequest {
  endpoint: string
}

export interface UnregisterWebPushSubscriptionResponse {
  removed: boolean
}
