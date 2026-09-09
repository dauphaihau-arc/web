export type ProductOptionValueIdentity = {
  id?: string
  client_ref?: string
};

export type ProductOptionIdentity = {
  id?: string
  client_ref?: string
};

export type ProductVariantConfigurationOptionValue = ProductOptionValueIdentity & {
  value: string
  position: number
};

export type ProductVariantConfigurationOption = ProductOptionIdentity & {
  name: string
  position: number
  values: ProductVariantConfigurationOptionValue[]
};

export type ProductVariantConfigurationSelection = {
  option_id?: string
  option_ref?: string
  value_id?: string
  value_ref?: string
};

export type ProductVariantConfigurationVariantInventory = {
  on_hand_quantity?: number
  expected_on_hand_version?: number
  sku?: string | null
  amount_minor?: number
  currency?: string
};

export type ProductVariantConfigurationVariant = {
  id?: string
  client_ref?: string
  selections: ProductVariantConfigurationSelection[]
  lifecycle_state: 'active' | 'inactive'
  inventory?: ProductVariantConfigurationVariantInventory
};

export type SetProductVariantConfigurationRequestBody = {
  product_version: number
  idempotency_key: string
  options: ProductVariantConfigurationOption[]
  variants: ProductVariantConfigurationVariant[]
  removed_variant_ids: string[]
  restore_variant_ids?: string[]
};
