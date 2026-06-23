export type E2EUser = {
  id: string
  display_name: string
  email: string
  permissions: string[]
  preferences: {
    currency: string
    language: string
    region: string
  }
};

export type E2ENotification = {
  id: string
  title: string
  body: string
  created_at: string
  read_at: string | null
  data?: {
    orderId?: string
  }
};

export function createUser(overrides: Partial<E2EUser> = {}): E2EUser {
  return {
    id: 'user-e2e-1',
    display_name: 'E2E User',
    email: 'e2e@example.com',
    permissions: [],
    preferences: {
      currency: 'USD',
      language: 'en',
      region: 'United States',
    },
    ...overrides,
  };
}

export function createNotification(overrides: Partial<E2ENotification> = {}): E2ENotification {
  return {
    id: 'notification-1',
    title: 'Order update',
    body: 'Your order status changed.',
    created_at: '2026-06-22T10:00:00.000Z',
    read_at: null,
    data: {
      orderId: 'order-1001',
    },
    ...overrides,
  };
}
