export const SHIPPING_PROFILE_CONFIG = {
  MAX_NAME_CHAR: 80,
  MAX_RATES: 100,
  MAX_FEE_MINOR: 100_000_000,
  MIN_POSTAL_CHAR: 2,
  MAX_POSTAL_CHAR: 20,
}

export const ShippingProfileStatuses = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const

export type ShippingProfileStatus =
  (typeof ShippingProfileStatuses)[keyof typeof ShippingProfileStatuses]

export const ShippingDestinationScopes = {
  COUNTRY: 'country',
  EVERYWHERE_ELSE: 'everywhere_else',
} as const

export type ShippingDestinationScope =
  (typeof ShippingDestinationScopes)[keyof typeof ShippingDestinationScopes]

export const ShippingProfileStatusOptions = [
  { value: ShippingProfileStatuses.DRAFT, label: 'Draft' },
  { value: ShippingProfileStatuses.ACTIVE, label: 'Active' },
  { value: ShippingProfileStatuses.ARCHIVED, label: 'Archived' },
] as const

export const ShippingDestinationScopeOptions = [
  { value: ShippingDestinationScopes.COUNTRY, label: 'Country' },
  { value: ShippingDestinationScopes.EVERYWHERE_ELSE, label: 'Everywhere else' },
] as const

export const ShippingProfileReadinessLabels = {
  archived: 'Archived profiles cannot be used for checkout',
  draft: 'Draft profiles cannot be used for checkout',
  missing_name: 'Add a profile name',
  missing_rates: 'Add at least one destination rate',
  missing_processing_time: 'Add a Processing time range in calendar days',
  invalid_processing_time: 'Processing time must be whole days with the minimum no greater than the maximum',
  missing_delivery_time: 'Add a Delivery time range to every destination rate',
  invalid_delivery_time: 'Delivery time must be whole days with the minimum no greater than the maximum',
} as const

