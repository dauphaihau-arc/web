export type E2EUser = {
  id: string
  display_name: string
  email: string
  roles: string[]
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
    roles: ['customer'],
    permissions: [],
    preferences: {
      currency: 'USD',
      language: 'en',
      region: 'United States',
    },
    ...overrides,
  };
}
